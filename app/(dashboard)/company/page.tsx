'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserProfile, Company } from '@/lib/types';
import { logOut } from '@/lib/auth';
import { Broadcasts } from '@/components/broadcasts';
import { Clock, TrendingUp, FileText, Briefcase } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast'>('home');

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
        router.push('/auth/login');
        return;
      }

      if (userProfile.role !== 'partner') {
        router.push('/admin');
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2"><Clock className="text-muted-foreground" size={32} /></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-primary sticky top-0 z-30 border-b border-primary/80">
        <div className="px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-display font-bold text-white">Company Dashboard</h1>
            <p className="text-xs text-white/60">{profile?.full_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-background/20 text-white px-4 py-2 rounded-lg hover:bg-background/30 transition font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="px-8 py-8">

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="bg-background rounded-lg shadow-lg p-8 border-t-4 border-primary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Full Name</h3>
                <p className="mt-1 text-lg text-foreground">{profile?.full_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Email</h3>
                <p className="mt-1 text-lg text-foreground">{profile?.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Role</h3>
                <p className="mt-1 text-lg text-foreground capitalize">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                    {profile?.role}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Company</h3>
                <p className="mt-1 text-lg text-foreground">{company?.name}</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-fundex-cream/30 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Welcome to Fundex! You have been approved as a <strong>Firm Partner</strong>. 
                You can now access all partnership features and collaborate with other team members.
              </p>
            </div>
          </div>
        )}

        {/* Investors Tab - Coming Soon */}
        {activeTab === 'investors' && (
          <div className="bg-background rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><FileText className="text-muted-foreground" size={64} /></div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Investors</h2>
            <p className="text-foreground">Coming soon...</p>
          </div>
        )}

        {/* Deals Tab - Coming Soon */}
        {activeTab === 'deals' && (
          <div className="bg-background rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><Briefcase className="text-muted-foreground" size={64} /></div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Deals</h2>
            <p className="text-foreground">Coming soon...</p>
          </div>
        )}

        {/* Allocations Tab - Coming Soon */}
        {activeTab === 'allocations' && (
          <div className="bg-background rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><FileText className="text-muted-foreground" size={64} /></div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Allocations</h2>
            <p className="text-foreground">Coming soon...</p>
          </div>
        )}

        {/* Documents Tab - Coming Soon */}
        {activeTab === 'documents' && (
          <div className="bg-background rounded-lg shadow p-12 text-center">
            <div className="flex justify-center mb-4"><Briefcase className="text-muted-foreground" size={64} /></div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Documents</h2>
            <p className="text-foreground">Coming soon...</p>
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
    </>
  );
}
