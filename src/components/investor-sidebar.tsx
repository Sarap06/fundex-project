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
    <aside className="hidden h-screen w-72 shrink-0 flex-col justify-between border-r border-stone-100 bg-white px-5 py-6 font-sans md:fixed md:left-0 md:top-0 md:flex z-40">
      <div className="space-y-8">
        {/* Logo */}
        <Link
          href="/investor"
          className="flex items-center gap-3  outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-fundex-gold"
        >
          <div className="flex h-10 w-10 items-center justify-center  bg-fundex-gold font-display text-sm font-bold text-fundex-forest shadow-sm">
            F
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-stone-900">Fundex</p>
            <p className="mt-0.5 text-xs text-stone-400">Investor Portal</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="space-y-1">
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
                className={`flex w-full items-center gap-3  px-3 py-2.5 text-left text-sm font-normal transition-colors duration-200 ${
                  isActive
                    ? "bg-fundex-gold/10 text-fundex-forest border-l-2 border-fundex-gold -ml-px"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User card */}
      <div className="flex items-center gap-3  border border-stone-100 bg-stone-50/50 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center  bg-fundex-gold/20 text-xs font-semibold text-fundex-forest">
          JD
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-normal text-stone-900">John Doe</p>
          <p className="mt-0.5 text-[11px] text-stone-400">Investor</p>
        </div>
        <button
          aria-label="Logout"
          type="button"
          onClick={handleLogout}
          className="shrink-0  p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
