'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/DashboardNav';
import { BroadcastChannels } from '@/components/DealBroadcastChannels';
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
  const [activeTab, setActiveTab] = useState<'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast'>('broadcast');
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleTabChange = (tab: 'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast') => {
    if (tab === 'home') {
      router.push('/dashboard/admin');
    } else if (tab === 'investors') {
      router.push('/dashboard/admin/investors');
    } else if (tab === 'deals') {
      router.push('/dashboard/admin/deals');
    } else if (tab === 'allocations') {
      router.push('/dashboard/admin/allocations');
    } else if (tab === 'documents') {
      router.push('/dashboard/admin/documents');
    } else if (tab === 'broadcast') {
      router.push('/dashboard/admin/broadcast');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved) {
      setIsSidebarExpanded(JSON.parse(saved));
    }
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Clock className="animate-spin text-gray-600" size={32} />
            <p className="text-lg text-gray-900">Loading broadcast...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${
      isSidebarExpanded ? 'ml-64' : 'ml-20'
    }`}>
      {/* Header */}
      <header className={`bg-green-600 fixed top-0 right-0 z-30 transition-all duration-300 border-b border-green-700 ${
        isSidebarExpanded ? 'left-64' : 'left-20'
      }`}>
        <div className="px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Broadcast</h1>
            {profile && <p className="text-xs text-green-100">Welcome back, {profile.full_name?.split(' ')[0]}</p>}
          </div>
        </div>
      </header>

      <main className="pt-20 px-8 py-8">
        {/* Sidebar Navigation */}
        <DashboardNav 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userRole={profile?.role}
          isExpanded={isSidebarExpanded}
          onExpandChange={setIsSidebarExpanded}
        />

        {/* Broadcast Content */}
        <BroadcastChannels 
          companyId={company?.id || ''}
          userRole={profile?.role}
          userName={profile?.full_name}
          userId={user?.id}
        />
      </main>
    </div>
  );
}
