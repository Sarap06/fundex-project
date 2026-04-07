"use client";

import {
  ArrowLeftRight,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Radio,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/investor", icon: LayoutDashboard },
  { label: "My Investments", href: "/investor/investments", icon: BriefcaseBusiness },
  { label: "Performance", href: "/investor/performance", icon: TrendingUp },
  { label: "Transactions", href: "/investor/transactions", icon: ArrowLeftRight },
  { label: "Documents", href: "/investor/documents", icon: FileText },
  { label: "Broadcast", href: "/investor/broadcast", icon: Radio },
] as const;

export function InvestorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col justify-between bg-gradient-to-b from-[#0B1E36] to-[#0E2A4D] px-6 py-8 text-slate-100 md:fixed md:left-0 md:top-0 md:flex z-40">
      <div className="space-y-10">
        <Link
          href="/investor"
          className="flex items-center gap-3.5 rounded-xl outline-none ring-offset-2 ring-offset-[#0B1E36] focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-sm shadow-emerald-500/25">
            F
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight">Fundex</p>
            <p className="mt-0.5 text-sm text-slate-300/90">Investor Portal</p>
          </div>
        </Link>

        <nav className="space-y-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/investor"
                ? pathname === "/investor"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                    : "text-slate-300/90 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 p-3.5 shadow-sm">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600/80 text-sm font-semibold text-white">
            JD
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">John Doe</p>
            <p className="mt-0.5 text-xs text-slate-300">Investor</p>
          </div>
        </div>
        <button
          aria-label="Logout"
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
