'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardTopbar } from '@/components/dashboard-topbar';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';

const INVESTOR_NAV_LINKS = [
  { label: 'Dashboard', href: '/investor' },
  { label: 'My Investments', href: '/investor/investments' },
  { label: 'Performance', href: '/investor/performance' },
  { label: 'Transactions', href: '/investor/transactions' },
  { label: 'Documents', href: '/investor/documents' },
  { label: 'Broadcast', href: '/investor/broadcast' },
  { label: 'Settings', href: '/investor/settings' },
];

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
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

      if (!p || p.role !== 'investor') { router.push('/auth/login'); return; }

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

  const pageShell = (content: React.ReactNode) => (
    <div className="relative min-h-screen bg-white font-sans">
      {/* Top-right warm bloom — gold fading into cream */}
      <div
        className="pointer-events-none fixed right-0 top-0 z-0 h-[800px] w-[900px]"
        style={{ background: 'radial-gradient(ellipse at 90% 10%, rgba(192,184,122,0.12) 0%, rgba(242,227,187,0.07) 35%, transparent 65%)' }}
      />
      {/* Bottom-left whisper — subtle warmth for balance */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 z-0 h-[600px] w-[700px]"
        style={{ background: 'radial-gradient(ellipse at 10% 85%, rgba(242,227,187,0.09) 0%, rgba(192,184,122,0.04) 40%, transparent 65%)' }}
      />
      {/* Mid-page accent — faint gold wash */}
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(192,184,122,0.05) 0%, transparent 60%)' }}
      />
      {content}
    </div>
  );

  if (!ready) {
    return pageShell(
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

  return pageShell(
    <>
      <DashboardTopbar
        userName={firstName}
        userInitials={initials}
        basePath="/investor"
        navLinks={INVESTOR_NAV_LINKS}
        portalLabel="Investor"
      />
      <main className="relative mx-auto max-w-screen-2xl px-5 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </>
  );
}
