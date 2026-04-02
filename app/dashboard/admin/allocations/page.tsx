'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logOut } from '@/lib/auth';
import { DashboardNav } from '@/components/DashboardNav';
import { AddAllocationModal } from '@/components/AddAllocationModal';
import { 
  BarChart3, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  TrendingUp,
  ChevronDown,
  LogOut,
  Plus
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Allocation {
  id: string;
  investor_name: string;
  deal_name: string;
  amount: number;
  percentage: number;
  status: 'Funded' | 'Pending' | 'Review';
  commit_date: string;
  funded_date: string | null;
  monthly_interest: number;
  payments_completed: number;
  total_payments: number;
  payment_status: 'on-schedule' | 'upcoming' | 'late' | 'pending';
  deal_funding_progress: number;
}

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: string;
}

export default function AllocationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [stats, setStats] = useState<Record<string, StatCard>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isAddAllocationOpen, setIsAddAllocationOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved) {
      setIsSidebarExpanded(JSON.parse(saved));
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUserProfile(profile);
      loadAllocationsData(profile.company_id);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAllocationsData = async (companyId?: string) => {
    try {
      const company_id = companyId || userProfile?.company_id;
      
      if (!company_id) {
        console.error('No company_id available');
        setAllocations([]);
        return;
      }

      // Fetch allocations with investor and deal data from Supabase
      const { data, error } = await supabase
        .from('allocations')
        .select(`
          id,
          allocation_amount,
          allocation_percentage,
          status,
          monthly_interest,
          commit_date,
          expected_funding_date,
          funding_status,
          investors(full_name),
          deals(name)
        `)
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching allocations:', error);
        setAllocations([]);
        return;
      }

      if (!data || data.length === 0) {
        setAllocations([]);
        setStats({
          totalAllocations: {
            label: 'Total Allocations',
            value: '$0.00M',
            icon: <DollarSign className="text-blue-600" size={24} />,
          },
          capitalReceived: {
            label: 'Capital Received',
            value: '$0.00M',
            subtext: 'Funds in bank',
            color: 'text-emerald-600',
            icon: <CheckCircle2 className="text-emerald-600" size={24} />,
          },
          pendingFunding: {
            label: 'Pending Funding',
            value: '$0.00M',
            color: 'text-amber-600',
            icon: <Clock className="text-amber-600" size={24} />,
          },
          inReview: {
            label: 'In Review',
            value: '$0.00M',
            color: 'text-blue-600',
            icon: <AlertCircle className="text-blue-600" size={24} />,
          },
          monthlyInterest: {
            label: 'Monthly Interest Owed',
            value: '$0.00K',
            color: 'text-purple-600',
            icon: <TrendingUp className="text-purple-600" size={24} />,
          },
          nextPayout: {
            label: 'Next Payout Date',
            value: '-',
            icon: <Calendar className="text-blue-600" size={24} />,
          },
        });
        return;
      }

      // Transform data to match Allocation interface
      const transformedAllocations: Allocation[] = data.map((alloc: any) => ({
        id: alloc.id,
        investor_name: alloc.investors?.full_name || 'Unknown',
        deal_name: alloc.deals?.name || 'Unknown',
        amount: alloc.allocation_amount,
        percentage: alloc.allocation_percentage || 0,
        status: alloc.funding_status || 'Pending',
        commit_date: new Date(alloc.commit_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        funded_date: alloc.funding_status === 'Funded'
          ? new Date(alloc.expected_funding_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : null,
        monthly_interest: alloc.monthly_interest || 0,
        payments_completed: 0,
        total_payments: 12,
        payment_status: 'pending' as const,
        deal_funding_progress: 0,
      }));

      setAllocations(transformedAllocations);

      // Calculate stats
      const totalAllocations = transformedAllocations.reduce((sum, a) => sum + a.amount, 0);
      const capitalReceived = transformedAllocations
        .filter(a => a.status === 'Funded')
        .reduce((sum, a) => sum + a.amount, 0);
      const pendingFunding = transformedAllocations
        .filter(a => a.status === 'Pending')
        .reduce((sum, a) => sum + a.amount, 0);
      const inReview = transformedAllocations
        .filter(a => a.status === 'Review')
        .reduce((sum, a) => sum + a.amount, 0);
      const monthlyInterest = transformedAllocations.reduce((sum, a) => sum + a.monthly_interest, 0);

      setStats({
        totalAllocations: {
          label: 'Total Allocations',
          value: `$${(totalAllocations / 1000000).toFixed(2)}M`,
          icon: <DollarSign className="text-blue-600" size={24} />,
        },
        capitalReceived: {
          label: 'Capital Received',
          value: `$${(capitalReceived / 1000000).toFixed(2)}M`,
          subtext: 'Funds in bank',
          color: 'text-emerald-600',
          icon: <CheckCircle2 className="text-emerald-600" size={24} />,
        },
        pendingFunding: {
          label: 'Pending Funding',
          value: `$${(pendingFunding / 1000000).toFixed(2)}M`,
          color: 'text-amber-600',
          icon: <Clock className="text-amber-600" size={24} />,
        },
        inReview: {
          label: 'In Review',
          value: `$${(inReview / 1000000).toFixed(2)}M`,
          color: 'text-blue-600',
          icon: <AlertCircle className="text-blue-600" size={24} />,
        },
        monthlyInterest: {
          label: 'Monthly Interest Owed',
          value: `$${(monthlyInterest / 1000).toFixed(1)}K`,
          color: 'text-purple-600',
          icon: <TrendingUp className="text-purple-600" size={24} />,
        },
        nextPayout: {
          label: 'Next Payout Date',
          value: 'Aug 1, 2026',
          icon: <Calendar className="text-blue-600" size={24} />,
        },
      });
    } catch (error) {
      console.error('Error loading allocations:', error);
      setAllocations([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Funded':
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case 'Pending':
        return <Clock className="size-4 text-amber-600" />;
      case 'Review':
        return <AlertCircle className="size-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getPaymentProgressColor = (status: string) => {
    switch (status) {
      case 'on-schedule':
        return 'bg-emerald-600';
      case 'upcoming':
        return 'bg-amber-500';
      case 'late':
        return 'bg-red-600';
      case 'pending':
        return 'bg-neutral-300';
      default:
        return 'bg-neutral-300';
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Funded':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Review':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch =
      allocation.investor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.deal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || allocation.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogOut = async () => {
    await logOut();
    router.push('/auth/login');
  };

  const handleSaveAllocation = async (formData: any) => {
    try {
      const response = await fetch('/api/allocations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: userProfile.company_id,
          investor_id: formData.investor_id,
          deal_id: formData.deal_id,
          allocation_amount: formData.allocation_amount,
          allocation_percentage: formData.allocation_percentage || 0,
          commit_date: formData.commit_date,
          expected_funding_date: formData.expected_funding_date,
          annual_rate: formData.annual_rate,
          term_length: formData.term_length,
          payment_frequency: formData.payment_frequency,
          payment_start_date: formData.payment_start_date,
          funding_status: formData.funding_status,
          notes: formData.notes,
          created_by: user?.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create allocation');
      }

      // Reload allocations
      await loadAllocationsData();
      setIsAddAllocationOpen(false);
    } catch (error) {
      console.error('Error in handleSaveAllocation:', error);
      throw error;
    }
  };

  const navigateToTab = (tab: string) => {
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
            <h1 className="text-xl font-bold text-white">Allocations</h1>
            {userProfile && <p className="text-xs text-green-100">Track capital commitments and investments</p>}
          </div>
          <button
            onClick={handleLogOut}
            className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="pt-20 px-8 py-8">
        {/* Navigation */}
        <DashboardNav 
          activeTab="allocations" 
          onTabChange={navigateToTab}
          isExpanded={isSidebarExpanded}
          onExpandChange={setIsSidebarExpanded}
        />

        <div className="space-y-6 mt-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Allocations</h2>
              <p className="text-gray-600 mt-1">Track capital commitments and investor allocations</p>
            </div>
            <button
              onClick={() => setIsAddAllocationOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              <Plus size={18} />
              Add Allocation
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {Object.entries(stats).map(([key, stat]) => (
              <div key={key} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">{stat.label}</p>
                    <p className={`text-xl md:text-2xl font-bold mt-2 ${stat.color || 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                    {stat.subtext && <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>}
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search by investor, deal, or allocation ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Funded">Funded</option>
                  <option value="Pending">Pending</option>
                  <option value="Review">Review</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Allocations Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Allocation ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Investor</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Deal</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">% of Deal</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Monthly Interest</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Payment Progress</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Commit Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Funded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAllocations.map((allocation) => (
                    <tr key={allocation.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-gray-600 font-medium">{allocation.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{allocation.investor_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{allocation.deal_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">${(allocation.amount / 1000000).toFixed(2)}M</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{allocation.percentage.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-purple-600">${(allocation.monthly_interest / 1000).toFixed(1)}K</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="text-sm font-semibold text-gray-900">
                            {allocation.payments_completed} / {allocation.total_payments}
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${getPaymentProgressColor(allocation.payment_status)}`}
                              style={{ width: `${(allocation.payments_completed / allocation.total_payments) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(allocation.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyles(allocation.status)}`}>
                            {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{allocation.commit_date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{allocation.funded_date || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAllocations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No allocations found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddAllocationModal
        isOpen={isAddAllocationOpen}
        onClose={() => {
          setIsAddAllocationOpen(false);
          // Reload data when modal closes
          loadAllocationsData();
        }}
        onSave={handleSaveAllocation}
        companyId={userProfile?.company_id || ''}
      />
    </div>
  );
}
