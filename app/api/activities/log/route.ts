import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyId,
      activityType,
      investorId,
      dealId,
      allocationId,
      userId,
      title,
      description,
      investorName,
      createdByName,
      dealName,
      metadata = {},
    } = body;

    if (!companyId || !activityType || !title) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: companyId, activityType, title",
        }),
        { status: 400 }
      );
    }

    // Use investorName or createdByName for initials/avatar (for deal creation events, support both)
    const displayName = investorName || createdByName;
    const initials = displayName ? getInitials(displayName) : undefined;
    const avatarColor = displayName ? getRandomColor() : undefined;

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        company_id: companyId,
        activity_type: activityType,
        investor_id: investorId,
        deal_id: dealId,
        allocation_id: allocationId,
        user_id: userId,
        title,
        description,
        metadata,
        investor_name: investorName || createdByName,
        investor_initials: initials,
        investor_avatar_color: avatarColor,
        deal_name: dealName,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      return new Response(
        JSON.stringify({ error: "Failed to log activity" }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error in activity logger:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
