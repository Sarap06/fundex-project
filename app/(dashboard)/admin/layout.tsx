'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardTopbar } from '@/components/dashboard-topbar';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';

const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Deals', href: '/admin/deals' },
  { label: 'Investors', href: '/admin/investors' },
  { label: 'Allocations', href: '/admin/allocations' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Documents', href: '/admin/documents' },
  { label: 'Broadcast', href: '/admin/broadcast' },
  { label: 'Performance', href: '/admin/performance' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: p } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!p) { router.push('/auth/login'); return; }
      if (p.role === 'partner') { router.push('/company'); return; }
      if (p.role === 'investor') { router.push('/investor'); return; }

      setProfile(p);
      setReady(true);
    })();
  }, [router]);

  const initials = (profile?.full_name || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const firstName = (profile?.full_name || '').split(' ')[0];

  if (!ready) {
    return (
      <>
        <header className="sticky top-0 z-40 border-b border-stone-100 bg-transparent backdrop-blur-sm">
          <div className="mx-auto flex h-[60px] max-w-screen-2xl items-center justify-between px-5 md:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold font-display text-sm font-bold text-fundex-forest">
                F
              </div>
              <Skeleton className="hidden h-5 w-16 sm:block" />
            </div>
            <div className="hidden gap-6 md:flex">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="hidden h-4 w-16 md:block" />
            </div>
          </div>
        </header>
        <main className="relative mx-auto max-w-screen-2xl px-5 py-6 md:px-8 md:py-8">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className=" border border-stone-100 bg-white/80 p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-9 w-32" />
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar
        userName={firstName}
        userInitials={initials}
        basePath="/admin"
        navLinks={ADMIN_NAV_LINKS}
        portalLabel="Admin"
      />
      <main className="relative mx-auto max-w-screen-2xl px-5 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </>
  );
}
