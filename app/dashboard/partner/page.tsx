'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserProfile, Company } from '@/lib/types';
import { logOut } from '@/lib/auth';
import { DashboardNav } from '@/components/DashboardNav';
import { Broadcasts } from '@/components/Broadcasts';
import { Clock, TrendingUp, FileText, Briefcase } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function PartnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast'>('home');

  useEffect(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved) {
      setIsSidebarExpanded(JSON.parse(saved));
    }
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
        router.push('/auth/login');
        return;
      }

      if (userProfile.role !== 'partner') {
        router.push('/dashboard/admin');
        return;
      }

      setProfile(userProfile);

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userProfile.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2"><Clock className="text-gray-600" size={32} /></div>
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${
      isSidebarExpanded ? 'ml-64' : 'ml-20'
    }`}>
      <header className={`bg-white shadow fixed top-0 right-0 z-30 transition-all duration-300 ${
        isSidebarExpanded ? 'left-64' : 'left-20'
      }`}>
        <div className="px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-800">{profile?.full_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="pt-32 px-4 py-8">
        {/* Dashboard Navigation */}
        <DashboardNav 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={profile?.role}
          isExpanded={isSidebarExpanded}
          onExpandChange={setIsSidebarExpanded}
        />

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-green-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Full Name</h3>
                <p className="mt-1 text-lg text-gray-900">{profile?.full_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</h3>
                <p className="mt-1 text-lg text-gray-900">{profile?.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role</h3>
                <p className="mt-1 text-lg text-gray-900 capitalize">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    {profile?.role}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Company</h3>
                <p className="mt-1 text-lg text-gray-900">{company?.name}</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700">
                Welcome to Fundex! You have been approved as a <strong>Firm Partner</strong>. 
                You can now access all partnership features and collaborate with other team members.
              </p>
            </div>
          </div>
        )}

        {/* Investors Tab - Coming Soon */}
        {activeTab === 'investors' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><FileText className="text-gray-600" size={64} /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Investors</h2>
            <p className="text-gray-800">Coming soon...</p>
          </div>
        )}

        {/* Deals Tab - Coming Soon */}
        {activeTab === 'deals' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><Briefcase className="text-gray-600" size={64} /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deals</h2>
            <p className="text-gray-800">Coming soon...</p>
          </div>
        )}

        {/* Allocations Tab - Coming Soon */}
        {activeTab === 'allocations' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><FileText className="text-gray-600" size={64} /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Allocations</h2>
            <p className="text-gray-800">Coming soon...</p>
          </div>
        )}

        {/* Documents Tab - Coming Soon */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><Briefcase className="text-gray-600" size={64} /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents</h2>
            <p className="text-gray-800">Coming soon...</p>
          </div>
        )}

        {/* Broadcast Tab - View Only for Non-Admins */}
        {activeTab === 'broadcast' && (
          <Broadcasts 
            companyId={company?.id || ''}
            userRole={profile?.role}
            userName={profile?.full_name}
            userId={user?.id}
          />
        )}
      </main>
    </div>
  );
}
