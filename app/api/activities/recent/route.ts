import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getActivityIcon } from "@/lib/activity-icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Missing companyId parameter" }),
        { status: 400 }
      );
    }

    // Fetch recent activities sorted by creation date
    const { data: activities, error } = await supabase
      .from("activity_logs")
      .select(
        `
        id,
        activity_type,
        title,
        description,
        investor_name,
        investor_initials,
        investor_avatar_color,
        deal_name,
        created_at,
        metadata
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activities:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch activities" }),
        { status: 500 }
      );
    }

    // Transform data to match the Activity interface
    const transformedActivities = activities.map((activity: any) => {
      const iconConfig = getActivityIcon(activity.activity_type);
      return {
        id: activity.id,
        type: activity.activity_type,
        description: activity.description,
        dealName: activity.deal_name,
        investorName: activity.investor_name,
        timestamp: activity.created_at,
        initials: activity.investor_initials,
        bgColor: activity.investor_avatar_color,
        icon: iconConfig.icon,
        iconBgColor: iconConfig.bgColor,
        iconBgColorHex: iconConfig.bgColorHex,
      };
    });

    return new Response(
      JSON.stringify({ success: true, activities: transformedActivities }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in get activities:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
