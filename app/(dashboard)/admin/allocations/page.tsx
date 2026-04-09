'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logOut } from '@/lib/auth';
import { AddAllocationModal } from '@/components/add-allocation-modal';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
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
        router.push('/admin');
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
            color: 'text-primary',
            icon: <CheckCircle2 className="text-primary" size={24} />,
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
          color: 'text-primary',
          icon: <CheckCircle2 className="text-primary" size={24} />,
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
        return <CheckCircle2 className="size-4 text-primary" />;
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
        return 'bg-fundex-gold';
      case 'upcoming':
        return 'bg-amber-500';
      case 'late':
        return 'bg-red-600';
      case 'pending':
        return 'bg-stone-300';
      default:
        return 'bg-stone-300';
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Funded':
        return 'fdx-badge fdx-badge-active';
      case 'Pending':
        return 'fdx-badge fdx-badge-pending';
      case 'Review':
        return 'fdx-badge fdx-badge-info';
      default:
        return 'fdx-badge fdx-badge-info';
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
      <div className="px-6 py-6 md:px-8 md:py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="fdx-card p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
        <div className="fdx-card p-5">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="fdx-card p-5 space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
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
      router.push('/admin');
    } else if (tab === 'investors') {
      router.push('/admin/investors');
    } else if (tab === 'deals') {
      router.push('/admin/deals');
    } else if (tab === 'allocations') {
      router.push('/admin/allocations');
    } else if (tab === 'documents') {
      router.push('/admin/documents');
    } else if (tab === 'broadcast') {
      router.push('/admin/broadcast');
    }
  };

  return (
    <>
      <main className="px-6 py-6 md:px-8 md:py-8">
        <StaggerContainer className="space-y-6">
          {/* Page Header */}
          <StaggerItem>
            <PageHeader
              title="Allocations"
              subtitle="Track capital allocation and funding status"
              actions={
                <button
                  onClick={() => setIsAddAllocationOpen(true)}
                  className="fdx-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                >
                  <Plus size={18} />
                  Add Allocation
                </button>
              }
            />
          </StaggerItem>

          {/* Stats Cards */}
          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {Object.entries(stats).map(([key, stat]) => (
                <div key={key} className="fdx-card p-5 relative overflow-hidden">
                  <div className="fdx-card-glow" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase">{stat.label}</p>
                      <p className={`text-xl md:text-2xl font-display font-semibold mt-2 ${stat.color || 'text-stone-900'}`}>
                        {stat.value}
                      </p>
                      {stat.subtext && <p className="text-xs text-stone-500 mt-1">{stat.subtext}</p>}
                    </div>
                    <div className="p-2 bg-stone-50/50 rounded-lg">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          </StaggerItem>

          {/* Search and Filter */}
          <StaggerItem>
            <div className="fdx-card p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-stone-500" />
                  <input
                    type="search"
                    placeholder="Search by investor, deal, or allocation ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="fdx-input w-full pl-10 pr-4 py-2"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="fdx-input px-4 py-2 appearance-none pr-10"
                  >
                    <option value="all">All Status</option>
                    <option value="Funded">Funded</option>
                    <option value="Pending">Pending</option>
                    <option value="Review">Review</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-stone-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Allocations Table */}
          <StaggerItem>
            <div className="fdx-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="fdx-table-header">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Allocation ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Investor</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Deal</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Amount</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">% of Deal</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Monthly Interest</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Payment Progress</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Commit Date</th>
                      <th className="px-6 py-3 text-left font-semibold text-stone-900">Funded Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredAllocations.map((allocation) => (
                      <tr key={allocation.id} className="fdx-table-row">
                        <td className="px-6 py-4">
                          <span className="text-stone-500 font-medium">{allocation.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-stone-900">{allocation.investor_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-stone-900">{allocation.deal_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-stone-900">${(allocation.amount / 1000000).toFixed(2)}M</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-stone-500">{allocation.percentage.toFixed(1)}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-purple-600">${(allocation.monthly_interest / 1000).toFixed(1)}K</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 min-w-[120px]">
                            <div className="text-sm font-semibold text-stone-900">
                              {allocation.payments_completed} / {allocation.total_payments}
                            </div>
                            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
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
                          <span className="text-stone-500">{allocation.commit_date}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-stone-500">{allocation.funded_date || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAllocations.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-stone-500">No allocations found</p>
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
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
    </>
  );
}
