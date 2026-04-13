'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BroadcastChannels } from '@/components/deal-broadcast-channels';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
}

export default function BroadcastPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push('/auth/login');
        return;
      }

      setUser(authUser);

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Profile error:', profileError);
        return;
      }

      setProfile(userProfile);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userProfile.company_id)
        .single();

      if (!companyError && companyData) {
        setCompany(companyData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <Skeleton className="mt-6 h-64 w-full " />
      </div>
    );
  }

  return (
    <div>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <PageHeader title="Broadcast" subtitle="Manage announcements and communications" />
        </StaggerItem>

        <StaggerItem>
          <BroadcastChannels
            companyId={company?.id || ''}
            userRole={profile?.role}
            userName={profile?.full_name}
            userId={user?.id}
          />
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
