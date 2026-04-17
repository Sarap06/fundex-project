'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { logOut } from '@/lib/auth';

interface CompanyTopbarProps {
  userName: string;
  userInitials: string;
}

const NAV_LINKS = [
  { label: 'Dashboard', href: '/company' },
  { label: 'Deals', href: '/company/deals' },
  { label: 'Investors', href: '/company/investors' },
  { label: 'Documents', href: '/company/documents' },
  { label: 'Broadcast', href: '/company/broadcast' },
] as const;

export function CompanyTopbar({ userName, userInitials }: CompanyTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  const isActive = (href: string) =>
    href === '/company'
      ? pathname === '/company'
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-100/80 bg-white/95 backdrop-blur-lg font-sans">
      <div className="mx-auto flex h-[60px] max-w-screen-2xl items-center justify-between px-5 md:px-8">
        {/* Left — Logo */}
        <div className="flex items-center gap-3">
          <Link href="/company" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold font-display text-sm font-bold text-fundex-forest">
              F
            </div>
            <span className="hidden font-display text-lg font-normal text-stone-900 sm:block">
              Fundex
            </span>
          </Link>
        </div>

        {/* Center — Nav links (desktop) */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-5 py-[18px] text-[13px] font-normal tracking-wide transition-colors ${
                isActive(link.href)
                  ? 'text-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-5 right-5 h-[2px]  bg-fundex-gold" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className=" p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className=" p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

          <div className="hidden items-center gap-2.5 md:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-fundex-gold/20 text-xs font-medium text-fundex-forest">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-normal text-stone-600">{userName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className=" p-2 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className=" p-2 text-stone-500 hover:bg-stone-100 md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center gap-2.5 border-b border-stone-200/80 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold font-display text-sm font-bold text-fundex-forest">
                  F
                </div>
                <span className="font-display text-lg font-normal text-stone-900">
                  Fundex
                </span>
              </div>

              <nav className="space-y-1 px-3 py-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center  px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-fundex-gold/10 text-fundex-forest'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-stone-200/80 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-fundex-gold/20 text-xs font-medium text-fundex-forest">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-normal text-stone-600">{userName}</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className=" p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
