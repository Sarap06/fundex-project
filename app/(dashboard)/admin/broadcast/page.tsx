'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BroadcastChannels } from '@/components/deal-broadcast-channels';
import { Clock } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Clock className="animate-spin text-muted-foreground" size={32} />
            <p className="text-lg text-foreground">Loading broadcast...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-primary sticky top-0 z-30 border-b border-primary/80">
        <div className="px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-display font-bold text-white">Broadcast</h1>
            {profile && <p className="text-xs text-white/60">Welcome back, {profile.full_name?.split(' ')[0]}</p>}
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        {/* Sidebar Navigation */}

        {/* Broadcast Content */}
        <BroadcastChannels 
          companyId={company?.id || ''}
          userRole={profile?.role}
          userName={profile?.full_name}
          userId={user?.id}
        />
      </main>
    </>
  );
}
