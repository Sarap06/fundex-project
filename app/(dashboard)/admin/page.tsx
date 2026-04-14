'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserProfile, Company } from '@/lib/types';
import { logOut } from '@/lib/auth';
import { ActivityIcon } from '@/components/activity-icon';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
import { Clock, TrendingUp, Users, Target, DollarSign, Plus, LogOut, FileText, Briefcase, Mail, Copy, Check, Edit2, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
  bgColor?: string;
}

interface Deal {
  id: string;
  name: string;
  status: string;
  target: number;
  raised: number;
  progress: number;
  investors: number;
}

interface Activity {
  id: string;
  description: string;
  dealName?: string;
  investorName?: string;
  timestamp: string;
  type: string;
  initials?: string;
  bgColor?: string;
  icon?: string;
  iconBgColor?: string;
  iconBgColorHex?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, StatCard>>({});
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; email: string; full_name: string; role: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{ id: string; full_name: string; email: string; status: string; user_id: string }>>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'investor' | 'partner'>('partner');
  const [invitingEmail, setInvitingEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [codeMessage, setCodeMessage] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>('');


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

      setProfile(userProfile);

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userProfile.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);
      }

      // Load dashboard data
      loadDashboardStats(userProfile.company_id);
      loadRecentDeals(userProfile.company_id);
      loadRecentActivities(userProfile.company_id);
      loadMembers(userProfile.company_id);
      loadPendingRequests(userProfile.company_id);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadMembers = async (companyId: string) => {
    try {
      const { data: memberData } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .eq('company_id', companyId);

      if (memberData) {
        setMembers(memberData);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadPendingRequests = async (companyId: string) => {
    try {
      const { data: requestData } = await supabase
        .from('join_requests')
        .select('id, full_name, email, status, user_id')
        .eq('company_id', companyId)
        .eq('status', 'pending');

      if (requestData) {
        setPendingRequests(requestData);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const handleApproveRequest = async (requestId: string, selectedRole: string) => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    try {
      // Find the request to get user_id
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request || !request.user_id) {
        alert('User information not found');
        return;
      }

      console.log('Approving request:', { requestId, selectedRole, userId: request.user_id });

      // Call API to approve request (uses service role to bypass RLS)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please login again.');
        return;
      }

      const response = await fetch('/api/requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          requestId,
          userId: request.user_id,
          selectedRole,
          companyId: company?.id,
        }),
      });

      const result = await response.json();
      console.log('Approve response:', result);

      if (!response.ok) {
        alert(result.error || 'Failed to approve request');
        return;
      }

      // Remove approved request from pending list immediately
      setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
      // Remove role selector for this request
      const newRoles = { ...selectedRoles };
      delete newRoles[requestId];
      setSelectedRoles(newRoles);

      // Reload members to show new approved member
      if (company?.id) {
        loadMembers(company.id);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('An error occurred while approving the request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return;

    try {
      // Call API to reject request (uses service role to bypass RLS and send email)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please login again.');
        return;
      }

      const response = await fetch('/api/requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          requestId,
        }),
      });

      const result = await response.json();
      console.log('Reject response:', result);

      if (!response.ok) {
        console.error('Error rejecting request:', result.error);
        alert(result.error || 'Failed to reject request');
        return;
      }

      // Remove rejected request from pending list immediately
      setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
      // Remove role selector for this request
      const newRoles = { ...selectedRoles };
      delete newRoles[requestId];
      setSelectedRoles(newRoles);
      
      alert('Request rejected and email sent to the applicant');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('An error occurred while rejecting the request');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteMessage('Please enter an email address');
      return;
    }

    if (inviteRole === 'investor') {
      setInviteMessage('Investor invitations are sent from the Investors page.');
      return;
    }

    setInvitingEmail(inviteEmail);
    setInviteMessage('');

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setInviteMessage('You are not authenticated');
        setInvitingEmail('');
        return;
      }

      // Call API to send invitation
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          companyId: company?.id,
          companyCode: company?.company_code,
          companyName: company?.name,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        setInviteMessage(`Invitation sent to ${inviteEmail}!`);
        setInviteEmail('');
        setTimeout(() => setInviteMessage(''), 3000);
      } else {
        const error = await response.json();
        setInviteMessage(error.error || 'Failed to send invitation. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      setInviteMessage('Error sending invitation');
    } finally {
      setInvitingEmail('');
    }
  };

  const handleEditMemberRole = async (memberId: string, newRole: string) => {
    if (!newRole) return;

    try {
      // Find the member to get email
      const member = members.find(m => m.id === memberId);
      console.log('Found member:', member);
      
      if (!member) {
        alert('Member not found');
        return;
      }

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please login again.');
        return;
      }

      const payload = {
        userProfileId: memberId,
        email: member.email,
        newRole,
      };
      console.log('Sending payload:', payload);

      // Call API to update role in both tables (uses service role to bypass RLS)
      const response = await fetch('/api/members/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('API response:', result);
      
      if (!response.ok) {
        alert(result.error || 'Failed to update role');
        return;
      }

      // Update local state
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      setEditingMemberId(null);
      setEditingRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('An error occurred while updating the role');
    }
  };

  const handleCopyCompanyCode = async () => {
    if (company?.company_code) {
      await navigator.clipboard.writeText(company.company_code);
      setCodeMessage('Company code copied!');
      setTimeout(() => setCodeMessage(''), 2000);
    }
  };

  const loadDashboardStats = async (companyId: string) => {
    try {
      if (!companyId) {
        console.error('No company_id available');
        return;
      }

      // Fetch active investors count
      const { data: activeInvestorsData, count: activeInvestorsCount, error: investorsError } = await supabase
        .from('investors')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'Active');

      if (investorsError) {
        console.error('Error fetching active investors:', investorsError);
      }

      // Fetch active deals count
      const { data: activeDealsData, count: activeDealsCountValue, error: dealsError } = await supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'Active');

      if (dealsError) {
        console.error('Error fetching active deals:', dealsError);
      }

      // Fetch allocations with deal status (for AUM and allocated capital calculations)
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('allocations')
        .select('allocation_amount, funding_status, deal_id')
        .eq('company_id', companyId);

      if (allocationsError) {
        console.error('Error fetching allocations:', allocationsError);
      }

      // Fetch all deals to get their status
      const { data: dealsData, error: allDealsError } = await supabase
        .from('deals')
        .select('id, status')
        .eq('company_id', companyId);

      if (allDealsError) {
        console.error('Error fetching deals:', allDealsError);
      }

      const investorCount = activeInvestorsCount || 0;
      const dealCount = activeDealsCountValue || 0;

      // Create a map of deal IDs to their status for quick lookup
      const dealStatusMap = new Map((dealsData || []).map(deal => [deal.id, deal.status]));

      // Calculate AUM: SUM(allocation_amount) WHERE funding_status = 'Funded' AND deal.status = 'Active'
      const totalAUMValue = (allocationsData || [])
        .filter(alloc => {
          const dealStatus = dealStatusMap.get(alloc.deal_id);
          return alloc.funding_status === 'Funded' && dealStatus === 'Active';
        })
        .reduce((sum, alloc) => sum + (alloc.allocation_amount || 0), 0);

      // Calculate Allocated Capital: SUM(allocation_amount) WHERE funding_status = 'Funded' (all deals)
      const allocatedCapitalTotal = (allocationsData || [])
        .filter(alloc => alloc.funding_status === 'Funded')
        .reduce((sum, alloc) => sum + (alloc.allocation_amount || 0), 0);

      setStats({
        totalAUM: {
          label: 'Total AUM',
          value: `$${(totalAUMValue / 1000000).toFixed(2)}M`,
          subtext: '',
          trend: 12.5,
          icon: <DollarSign size={16} />,
          color: '#10B981',
          bgColor: '#ECFDF5'
        },
        activeInvestors: {
          label: 'Active Investors',
          value: investorCount,
          subtext: '',
          trend: 18,
          icon: <Users size={16} />,
          color: '#3B82F6',
          bgColor: '#EFF6FF'
        },
        activeDeals: {
          label: 'Active Deals',
          value: dealCount,
          subtext: '',
          trend: 5,
          icon: <Briefcase size={16} />,
          color: '#A855F7',
          bgColor: '#F3E8FF'
        },
        allocatedCapital: {
          label: 'Allocated Capital',
          value: `$${(allocatedCapitalTotal / 1000000).toFixed(2)}M`,
          subtext: '',
          trend: 24.8,
          icon: <TrendingUp size={16} />,
          color: '#F59E0B',
          bgColor: '#FFFBEB'
        }
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadRecentDeals = async (companyId: string) => {
    try {
      if (!companyId) return;

      // Fetch top 2 latest deals from the database
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('id, deal_id, name, status, target_amount, raised_amount, progress, investor_count')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (dealsError) {
        console.error('Error fetching deals:', dealsError);
        return;
      }

      if (dealsData) {
        const formattedDeals = dealsData.map((deal) => ({
          id: deal.deal_id,
          name: deal.name,
          status: deal.status,
          target: Number(deal.target_amount) || 0,
          raised: Number(deal.raised_amount) || 0,
          progress: deal.progress || 0,
          investors: deal.investor_count || 0
        }));
        setRecentDeals(formattedDeals);
      }
    } catch (error) {
      console.error('Error loading recent deals:', error);
    }
  };

  const loadRecentActivities = async (companyId: string) => {
    try {
      if (!companyId) return;

      const response = await fetch(`/api/activities/recent?companyId=${companyId}&limit=10`);
      const data = await response.json();

      if (data.activities) {
        setRecentActivities(data.activities);
      } else {
        // Fallback to empty if no activities
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
      // Don't break the dashboard if activities fail to load
      setRecentActivities([]);
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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-investor':
        router.push('/admin/investors');
        break;
      case 'create-deal':
        router.push('/admin/deals');
        break;
      case 'manage-allocations':
        router.push('/admin/allocations');
        break;
      case 'documents':
        router.push('/admin/documents');
        break;
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className=" border border-stone-100 bg-white p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
        <PageHeader title="Dashboard" subtitle={`Welcome back, ${profile?.full_name?.split(' ')[0]}`} />
        {/* Main Dashboard */}
        <StaggerContainer className="space-y-6">
            {/* Stats Grid — matches company dashboard card style */}
            <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {Object.values(stats).map((stat, i) => (
                <div key={stat.label} className="relative flex flex-col overflow-hidden  border border-stone-100 bg-white p-5 font-sans shadow-sm">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fundex-cream/30 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-normal text-stone-500">{stat.label}</p>
                    <div className="flex h-8 w-8 items-center justify-center  bg-stone-50 text-stone-400">
                      {stat.icon}
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-stone-900">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs font-normal text-stone-400">Growth Rate</p>
                      <span className="text-[13px] font-medium tabular-nums text-emerald-500">
                        ↑ {stat.trend}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </StaggerItem>

            {/* Quick Actions */}
            <StaggerItem>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleQuickAction('add-investor')}
                  className=" border border-stone-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold/10 text-fundex-forest mb-3">
                    <Users size={16} />
                  </div>
                  <h3 className="text-sm font-normal text-stone-900">Add Investor</h3>
                  <p className="text-xs text-stone-400 mt-1">Onboard new investor</p>
                </button>

                <button
                  onClick={() => handleQuickAction('create-deal')}
                  className=" border border-stone-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold/10 text-fundex-forest mb-3">
                    <Briefcase size={16} />
                  </div>
                  <h3 className="text-sm font-normal text-stone-900">Create Deal</h3>
                  <p className="text-xs text-stone-400 mt-1">Launch new offering</p>
                </button>

                <button
                  onClick={() => handleQuickAction('manage-allocations')}
                  className=" border border-stone-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold/10 text-fundex-forest mb-3">
                    <DollarSign size={16} />
                  </div>
                  <h3 className="text-sm font-normal text-stone-900">Manage Allocations</h3>
                  <p className="text-xs text-stone-400 mt-1">Review capital deployment</p>
                </button>

                <button
                  onClick={() => handleQuickAction('documents')}
                  className=" border border-stone-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center  bg-fundex-gold/10 text-fundex-forest mb-3">
                    <FileText size={16} />
                  </div>
                  <h3 className="text-sm font-normal text-stone-900">Documents</h3>
                  <p className="text-xs text-stone-400 mt-1">Upload or review files</p>
                </button>
              </div>
            </StaggerItem>

            {/* Company Code and Invite Members Section */}
            <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Code Card */}
              <div className="fdx-card p-6">
                <h2 className="fdx-section-title mb-4">Company Code</h2>
                <div className="bg-stone-50  p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Share this code with team members</p>
                    <p className="text-lg font-mono font-semibold text-stone-900">{company?.company_code || 'N/A'}</p>
                  </div>
                  <button
                    onClick={handleCopyCompanyCode}
                    className="fdx-btn-primary p-2"
                    title="Copy company code"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                {codeMessage && (
                  <p className="text-xs text-fundex-forest mt-3">{codeMessage}</p>
                )}
              </div>

              {/* Invite Members Card */}
              <div className="fdx-card p-6">
                <h2 className="fdx-section-title mb-4">Invite Team Members</h2>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="min-w-0 flex-1 border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
                      disabled={invitingEmail.length > 0}
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'investor' | 'partner')}
                      className="w-36 shrink-0 border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30"
                      disabled={invitingEmail.length > 0}
                    >
                      <option value="partner">Team Member</option>
                    </select>
                    <button
                      onClick={handleSendInvite}
                      disabled={invitingEmail.length > 0}
                      className="shrink-0 fdx-btn-primary px-5 py-2.5 disabled:opacity-50 gap-2"
                    >
                      <Mail size={16} />
                      Send
                    </button>
                  </div>
                  {inviteMessage && (
                    <p className={`text-xs ${inviteMessage.includes('sent') || inviteMessage.includes('copied') ? 'text-fundex-forest' : 'text-red-600'}`}>
                      {inviteMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
            </StaggerItem>

            {/* Team Members Section */}
            <StaggerItem>
            <div className="fdx-card p-6">
              <h2 className="fdx-section-title mb-6">Team Members</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="fdx-table-header py-3 px-4">Name</th>
                      <th className="fdx-table-header py-3 px-4">Email</th>
                      <th className="fdx-table-header py-3 px-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="fdx-table-row">
                        <td className="py-3 px-4 text-sm text-stone-900 font-normal">{member.full_name}</td>
                        <td className="py-3 px-4 text-sm text-stone-500">{member.email}</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-medium ${
                              member.role === 'admin'
                                ? 'fdx-badge fdx-badge-role'
                                : member.role === 'investor'
                                ? 'fdx-badge fdx-badge-info'
                                : 'fdx-badge fdx-badge-active'
                            }`}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                            {member.role !== 'admin' && (
                              <button
                                onClick={() => {
                                  setEditingMemberId(member.id);
                                  setEditingRole(member.role);
                                }}
                                className="text-stone-500 hover:text-stone-500 transition"
                                title="Edit role"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </StaggerItem>

            {/* Pending Join Requests Section */}
            {pendingRequests.length > 0 && (
              <StaggerItem>
              <div className="fdx-card p-6">
                <h2 className="fdx-section-title mb-6">Pending Join Requests</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="fdx-table-header py-3 px-4">Name</th>
                        <th className="fdx-table-header py-3 px-4">Email</th>
                        <th className="fdx-table-header py-3 px-4">Role</th>
                        <th className="fdx-table-header py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((request) => (
                        <tr key={request.id} className="fdx-table-row">
                          <td className="py-3 px-4 text-sm text-stone-900 font-normal">{request.full_name}</td>
                          <td className="py-3 px-4 text-sm text-stone-500">{request.email}</td>
                          <td className="py-3 px-4 text-sm">
                            <select
                              value={selectedRoles[request.id] || ''}
                              onChange={(e) => setSelectedRoles({ ...selectedRoles, [request.id]: e.target.value })}
                              className="px-3 py-1 fdx-input text-xs"
                            >
                              <option value="">Select role</option>
                              <option value="investor">Investor</option>
                              <option value="partner">Partner</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveRequest(request.id, selectedRoles[request.id])}
                                className="fdx-btn-primary px-3 py-1 text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="fdx-btn-danger px-3 py-1 text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </StaggerItem>
            )}

            {/* Two Column Layout - Recent Deals and Recent Activity */}
            <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Deals */}
              <div className="lg:col-span-2 fdx-card overflow-hidden">
                <div className="p-6 border-b border-stone-50">
                  <div className="flex justify-between items-center">
                    <h2 className="fdx-section-title">Recent Deals</h2>
                    <button onClick={() => router.push('/admin/deals')} className="text-fundex-forest hover:text-fundex-green text-sm font-normal">
                      View All
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-stone-50">
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="p-6 hover:bg-stone-50/50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-stone-900">{deal.name}</h3>
                          <p className="text-xs text-stone-500 mt-1">{deal.id}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium ${
                          deal.status === 'Funding'
                            ? 'fdx-badge fdx-badge-info'
                            : 'fdx-badge fdx-badge-active'
                        }`}>
                          {deal.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-stone-500">Progress</span>
                          <span className="text-xs font-medium text-stone-900">{deal.progress}%</span>
                        </div>
                        <div className="w-full bg-stone-50 h-2.5">
                          <div
                            className={`h-2.5 ${
                              deal.status === 'Active' ? 'bg-fundex-gold' : 'bg-fundex-green'
                            }`}
                            style={{ width: `${deal.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-stone-50">
                        <span className="text-xs text-stone-500">{formatCurrency(deal.raised)} of {formatCurrency(deal.target)}</span>
                        <span className="text-xs text-stone-500">{deal.investors} investors</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="fdx-card overflow-hidden">
                <div className="p-6 border-b border-stone-50">
                  <h2 className="fdx-section-title">Recent Activity</h2>
                </div>
                <div className="divide-y divide-stone-50 max-h-96 overflow-y-auto">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-stone-50/50 transition flex gap-3">
                      {activity.icon && activity.iconBgColorHex ? (
                        <ActivityIcon
                          icon={activity.icon}
                          bgColor={activity.iconBgColor || 'bg-stone-50'}
                          iconBgColorHex={activity.iconBgColorHex}
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-medium text-xs"
                          style={{ backgroundColor: activity.bgColor }}
                        >
                          {activity.initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-900">
                          <span className="font-medium">{activity.investorName}</span>
                          <span className="text-stone-500"> {activity.description} </span>
                        </p>
                        <p className="text-xs text-fundex-forest font-normal mt-0.5">{activity.dealName}</p>
                        <p className="text-xs text-stone-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </StaggerItem>
        </StaggerContainer>

        {/* Edit Member Role Modal */}
        {editingMemberId && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="fdx-card shadow-xl p-6 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="fdx-section-title">Edit Member Role</h3>
                <button
                  onClick={() => {
                    setEditingMemberId(null);
                    setEditingRole('');
                  }}
                  className="text-stone-500 hover:text-stone-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-stone-500 mb-2">Select New Role</label>
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="w-full px-4 py-2 fdx-input"
                  >
                    <option value="investor">Investor</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setEditingMemberId(null);
                      setEditingRole('');
                    }}
                    className="flex-1 px-4 py-2 fdx-btn-secondary "
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditMemberRole(editingMemberId, editingRole)}
                    className="flex-1 px-4 py-2 fdx-btn-primary "
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

    </>
  );
}
