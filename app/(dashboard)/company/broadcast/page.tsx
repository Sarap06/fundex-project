'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Broadcasts } from '@/components/broadcasts';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, Company } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

export default function CompanyBroadcastPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);

      const { data: p } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (!p) return;
      setProfile(p);

      const { data: c } = await supabase
        .from('companies')
        .select('*')
        .eq('id', p.company_id)
        .single();

      if (c) setCompany(c);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="space-y-7 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-12 w-16" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden border border-stone-100 bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-12" />
              <Skeleton className="mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="border border-stone-100 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-9 w-full max-w-md" />
          </div>
          <div className="divide-y divide-stone-50 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-5">
                <Skeleton className="h-14 w-14 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!company || !profile || !user) return null;

  const firstName = profile.full_name?.split(' ')[0] ?? '';

  return (
    <Broadcasts
      companyId={company.id}
      userRole={profile.role}
      userName={profile.full_name}
      userId={user.id}
      firstName={firstName}
    />
  );
}
