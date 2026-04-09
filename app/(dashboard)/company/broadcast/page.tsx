'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Broadcasts } from '@/components/broadcasts';
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

  if (!ready || !company || !profile || !user) return null;

  return (
    <Broadcasts
      companyId={company.id}
      userRole={profile.role}
      userName={profile.full_name}
      userId={user.id}
    />
  );
}
