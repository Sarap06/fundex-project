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
  Plus,
  Eye,
  Edit,
  MessageSquare,
  X,
  Upload,
  Check,
  Send,
  User as UserIcon,
  Building2,
  Trash2
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
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [deletingAllocationId, setDeletingAllocationId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState('');
  const [customMessage, setCustomMessage] = useState('');

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

      // Fetch allocations with deal data from Supabase
      const { data, error } = await supabase
        .from('allocations')
        .select(`
          id,
          investor_id,
          allocation_amount,
          allocation_percentage,
          status,
          monthly_interest,
          commit_date,
          expected_funding_date,
          funding_status,
          deals(name)
        `)
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching allocations:', error);
        setAllocations([]);
        return;
      }

      // Build investor name map from both sources
      const investorIds = [...new Set((data || []).map((a: any) => a.investor_id))];
      const nameMap = new Map<string, string>();
      if (investorIds.length > 0) {
        const [{ data: manualInvs }, { data: profileInvs }] = await Promise.all([
          supabase.from('investors').select('id, full_name').in('id', investorIds),
          supabase.from('user_profiles').select('user_id, full_name').in('user_id', investorIds),
        ]);
        (manualInvs || []).forEach((i: any) => nameMap.set(i.id, i.full_name));
        (profileInvs || []).forEach((p: any) => nameMap.set(p.user_id, p.full_name));
      }

      if (!data || data.length === 0) {
        setAllocations([]);
        setStats({
          totalAllocations: {
            label: 'Total Allocations',
            value: '$0.00M',
            icon: <DollarSign className="text-stone-400" size={24} />,
          },
          capitalReceived: {
            label: 'Capital Received',
            value: '$0.00M',
            subtext: 'Funds in bank',
            color: 'text-stone-900',
            icon: <CheckCircle2 className="text-stone-400" size={24} />,
          },
          pendingFunding: {
            label: 'Pending Funding',
            value: '$0.00M',
            color: 'text-stone-900',
            icon: <Clock className="text-stone-400" size={24} />,
          },
          inReview: {
            label: 'In Review',
            value: '$0.00M',
            color: 'text-stone-900',
            icon: <AlertCircle className="text-stone-400" size={24} />,
          },
          monthlyInterest: {
            label: 'Monthly Interest Owed',
            value: '$0.00K',
            color: 'text-stone-900',
            icon: <TrendingUp className="text-stone-400" size={24} />,
          },
          nextPayout: {
            label: 'Next Payout Date',
            value: '-',
            icon: <Calendar className="text-stone-400" size={24} />,
          },
        });
        return;
      }

      // Transform data to match Allocation interface
      const transformedAllocations: Allocation[] = data.map((alloc: any) => ({
        id: alloc.id,
        investor_name: nameMap.get(alloc.investor_id) || 'Unknown',
        deal_name: alloc.deals?.name || 'Unknown',
        amount: Number(alloc.allocation_amount) || 0,
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
        monthly_interest: Number(alloc.monthly_interest) || 0,
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
          icon: <DollarSign className="text-stone-400" size={24} />,
        },
        capitalReceived: {
          label: 'Capital Received',
          value: `$${(capitalReceived / 1000000).toFixed(2)}M`,
          subtext: 'Funds in bank',
          color: 'text-stone-900',
          icon: <CheckCircle2 className="text-stone-400" size={24} />,
        },
        pendingFunding: {
          label: 'Pending Funding',
          value: `$${(pendingFunding / 1000000).toFixed(2)}M`,
          color: 'text-stone-900',
          icon: <Clock className="text-stone-400" size={24} />,
        },
        inReview: {
          label: 'In Review',
          value: `$${(inReview / 1000000).toFixed(2)}M`,
          color: 'text-stone-900',
          icon: <AlertCircle className="text-stone-400" size={24} />,
        },
        monthlyInterest: {
          label: 'Monthly Interest Owed',
          value: `$${(monthlyInterest / 1000).toFixed(1)}K`,
          color: 'text-stone-900',
          icon: <TrendingUp className="text-stone-400" size={24} />,
        },
        nextPayout: {
          label: 'Next Payout Date',
          value: 'Aug 1, 2026',
          icon: <Calendar className="text-stone-400" size={24} />,
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
        return <CheckCircle2 className="size-4 text-stone-500" />;
      case 'Pending':
        return <Clock className="size-4 text-stone-500" />;
      case 'Review':
        return <AlertCircle className="size-4 text-stone-500" />;
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

  const handleViewDetails = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setViewDrawerOpen(true);
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setEditModalOpen(true);
  };

  const handleMessageInvestor = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setMessageType('');
    setCustomMessage('');
    setMessageModalOpen(true);
  };

  const handlePaymentSchedule = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setPaymentModalOpen(true);
  };

  const handleDeleteAllocation = async (allocation: Allocation) => {
    const confirmed = window.confirm(
      `Delete the ${allocation.investor_name} allocation for ${allocation.deal_name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingAllocationId(allocation.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Your session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/allocations/${allocation.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        alert(result?.message || 'Failed to delete allocation.');
        return;
      }

      await loadAllocationsData();
    } catch (error) {
      console.error('Error deleting allocation:', error);
      alert('Failed to delete allocation.');
    } finally {
      setDeletingAllocationId(null);
    }
  };

  const getMessageTemplate = (type: string) => {
    if (!selectedAllocation) return '';
    const name = selectedAllocation.investor_name;
    const amount = `$${(selectedAllocation.amount / 1000000).toFixed(2)}M`;
    const deal = selectedAllocation.deal_name;
    const interest = `$${(selectedAllocation.monthly_interest / 1000).toFixed(1)}K`;

    switch (type) {
      case 'request-funding':
        return `Dear ${name},\n\nThis is a friendly reminder that your allocation of ${amount} for ${deal} is pending funding.\n\nPlease transfer funds at your earliest convenience.\n\nThank you,\nFundex Team`;
      case 'payment-confirmation':
        return `Dear ${name},\n\nWe are pleased to confirm that your payment of ${interest} for ${deal} has been processed successfully.\n\nThank you for your continued investment.\n\nBest regards,\nFundex Team`;
      case 'reminder':
        return `Dear ${name},\n\nThis is a reminder about your allocation for ${deal}.\n\nAmount: ${amount}\nMonthly Interest: ${interest}\n\nPlease contact us if you have any questions.\n\nBest regards,\nFundex Team`;
      default:
        return '';
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Your session expired. Please log in again.');
        return;
      }

      const response = await fetch('/api/allocations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
      <div>
        <StaggerContainer className="space-y-6">
          {/* Page Header */}
          <StaggerItem>
            <PageHeader
              title="Allocations"
              subtitle="Track capital allocation and funding status"
              actions={
                <button
                  onClick={() => setIsAddAllocationOpen(true)}
                  className="fdx-btn-primary flex items-center gap-2 px-4 py-2  font-medium"
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
                      <p className="text-xs font-medium text-stone-500 uppercase">{stat.label}</p>
                      <p className={`text-xl md:text-2xl font-semibold mt-2 ${stat.color || 'text-stone-900'}`}>
                        {stat.value}
                      </p>
                      {stat.subtext && <p className="text-xs text-stone-500 mt-1">{stat.subtext}</p>}
                    </div>
                    <div className="p-2 bg-stone-50/50 ">{stat.icon}</div>
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
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Allocation ID</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Investor</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Deal</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Amount</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">% of Deal</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Monthly Interest</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Payment Progress</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Commit Date</th>
                      <th className="px-6 py-3 text-left font-medium text-stone-400 uppercase tracking-wide">Funded Date</th>
                      <th className="px-6 py-3 text-right font-medium text-stone-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredAllocations.map((allocation) => (
                      <tr key={allocation.id} className="fdx-table-row">
                        <td className="px-6 py-4">
                          <span className="text-stone-500 font-normal">{allocation.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-normal text-stone-900">{allocation.investor_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-stone-900">{allocation.deal_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-stone-900">${(allocation.amount / 1000000).toFixed(2)}M</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-stone-500">{allocation.percentage.toFixed(1)}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-stone-900">${(allocation.monthly_interest / 1000).toFixed(1)}K</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 min-w-[120px]">
                            <div className="text-sm font-medium text-stone-900">
                              {allocation.payments_completed} / {allocation.total_payments}
                            </div>
                            <div className="w-full h-2 bg-stone-100 overflow-hidden">
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
                            <span className={`px-3 py-1 text-xs font-medium ${getStatusBadgeStyles(allocation.status)}`}>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              title="View Details"
                              onClick={() => handleViewDetails(allocation)}
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Allocation"
                              onClick={() => handleEditAllocation(allocation)}
                            >
                              <Edit className="size-4" />
                            </button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Message Investor"
                              onClick={() => handleMessageInvestor(allocation)}
                            >
                              <MessageSquare className="size-4" />
                            </button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded text-stone-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Payment Schedule"
                              onClick={() => handlePaymentSchedule(allocation)}
                            >
                              <Calendar className="size-4" />
                            </button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Delete Allocation"
                              onClick={() => handleDeleteAllocation(allocation)}
                              disabled={deletingAllocationId === allocation.id}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
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
      </div>

      <AddAllocationModal
        isOpen={isAddAllocationOpen}
        onClose={() => {
          setIsAddAllocationOpen(false);
          loadAllocationsData();
        }}
        onSave={handleSaveAllocation}
        companyId={userProfile?.company_id || ''}
      />

      {/* View Details Drawer */}
      {viewDrawerOpen && selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setViewDrawerOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-stone-900">Allocation Details</h2>
              <button onClick={() => setViewDrawerOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="size-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Investor Info */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Investor Information</h3>
                <div className="fdx-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <UserIcon className="size-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{selectedAllocation.investor_name}</p>
                      <p className="text-sm text-stone-500">investor@example.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Info */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Deal Information</h3>
                <div className="fdx-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="size-6 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{selectedAllocation.deal_name}</p>
                      <p className="text-sm text-stone-500">ID: {selectedAllocation.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allocation Details */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Allocation Details</h3>
                <div className="fdx-card p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-stone-600">Amount</p>
                      <p className="text-lg font-semibold text-stone-900 mt-1">${(selectedAllocation.amount / 1000000).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">% of Deal</p>
                      <p className="text-lg font-semibold text-stone-900 mt-1">{selectedAllocation.percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">Monthly Interest</p>
                      <p className="text-lg font-semibold text-purple-600 mt-1">${(selectedAllocation.monthly_interest / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">Status</p>
                      <div className="mt-1">
                        <span className={`px-3 py-1 text-xs font-medium ${getStatusBadgeStyles(selectedAllocation.status)}`}>
                          {selectedAllocation.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">Commit Date</p>
                      <p className="text-base font-medium text-stone-900 mt-1">{selectedAllocation.commit_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">Funded Date</p>
                      <p className="text-base font-medium text-stone-900 mt-1">{selectedAllocation.funded_date || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Payment Progress</h3>
                <div className="fdx-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-stone-600">Completed</p>
                    <p className="font-semibold text-stone-900">
                      {selectedAllocation.payments_completed} / {selectedAllocation.total_payments}
                    </p>
                  </div>
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPaymentProgressColor(selectedAllocation.payment_status)}`}
                      style={{ width: `${(selectedAllocation.payments_completed / selectedAllocation.total_payments) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Payment History */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Recent Payment History</h3>
                <div className="fdx-card p-4 space-y-3">
                  {selectedAllocation.payments_completed > 0 ? (
                    Array.from({ length: Math.min(selectedAllocation.payments_completed, 3) }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                        <div>
                          <p className="font-medium text-stone-900">Payment #{i + 1}</p>
                          <p className="text-xs text-stone-500">Mar {i + 1}, 2026</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-stone-900">${(selectedAllocation.monthly_interest / 1000).toFixed(1)}K</p>
                          <span className="fdx-badge fdx-badge-active text-xs">Paid</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500 text-center py-2">No payments yet</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Notes</h3>
                <textarea
                  placeholder="Add notes about this allocation..."
                  className="fdx-input w-full min-h-[100px] p-3"
                  defaultValue="No issues. Payments are on schedule."
                />
              </div>

              {/* Quick Actions */}
              <div className="sticky bottom-0 bg-white border-t border-stone-200 pt-4 space-y-2">
                {selectedAllocation.status === 'Pending' && (
                  <button
                    className="fdx-btn-primary w-full flex items-center justify-center gap-2 py-2"
                    onClick={() => setViewDrawerOpen(false)}
                  >
                    <Check className="size-4" />
                    Confirm Funds Received
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="fdx-btn-outline flex items-center justify-center gap-2 py-2"
                    onClick={() => {
                      setViewDrawerOpen(false);
                      handleMessageInvestor(selectedAllocation);
                    }}
                  >
                    <Send className="size-4" />
                    Send Message
                  </button>
                  <button className="fdx-btn-outline flex items-center justify-center gap-2 py-2">
                    <Upload className="size-4" />
                    Upload Proof
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-stone-900">Edit Allocation</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="size-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Allocation ID</label>
                <input value={selectedAllocation.id} disabled className="fdx-input w-full mt-1.5 bg-stone-50" />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Investor</label>
                <input defaultValue={selectedAllocation.investor_name} className="fdx-input w-full mt-1.5" />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Deal</label>
                <input defaultValue={selectedAllocation.deal_name} className="fdx-input w-full mt-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700">Amount</label>
                  <input defaultValue={`$${(selectedAllocation.amount / 1000000).toFixed(2)}M`} className="fdx-input w-full mt-1.5" />
                  <p className="text-xs text-stone-500 mt-1">Updating amount will recalculate % of deal</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">% of Deal</label>
                  <input value={`${selectedAllocation.percentage.toFixed(1)}%`} disabled className="fdx-input w-full mt-1.5 bg-stone-50" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Status</label>
                <select defaultValue={selectedAllocation.status} className="fdx-input w-full mt-1.5">
                  <option value="Pending">Pending</option>
                  <option value="Funded">Funded</option>
                  <option value="Review">In Review</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700">Commit Date</label>
                  <input type="date" defaultValue="2026-03-01" className="fdx-input w-full mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">Funded Date</label>
                  <input type="date" defaultValue="2026-03-05" className="fdx-input w-full mt-1.5" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="fdx-btn-primary flex-1 py-2">Save Changes</button>
                <button className="fdx-btn-outline flex-1 py-2" onClick={() => setEditModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModalOpen && selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMessageModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-b border-stone-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-stone-900">Message Investor</h2>
              <button onClick={() => setMessageModalOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="size-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Message Type</label>
                <select
                  value={messageType}
                  onChange={(e) => {
                    setMessageType(e.target.value);
                    setCustomMessage(getMessageTemplate(e.target.value));
                  }}
                  className="fdx-input w-full mt-1.5"
                >
                  <option value="">Select message type</option>
                  <option value="request-funding">Request Funding</option>
                  <option value="payment-confirmation">Send Payment Confirmation</option>
                  <option value="reminder">Send Reminder</option>
                  <option value="custom">Custom Message</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Message</label>
                <textarea
                  placeholder="Type your message here..."
                  className="fdx-input w-full mt-1.5 min-h-[200px] p-3"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button className="fdx-btn-primary flex-1 flex items-center justify-center gap-2 py-2">
                  <Send className="size-4" />
                  Send Message
                </button>
                <button className="fdx-btn-outline flex-1 py-2" onClick={() => setMessageModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule Modal */}
      {paymentModalOpen && selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-stone-900">Payment Schedule</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="size-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="fdx-card p-4">
                  <p className="text-sm text-stone-600">Total Payments</p>
                  <p className="text-2xl font-semibold text-stone-900 mt-1">{selectedAllocation.total_payments}</p>
                </div>
                <div className="fdx-card p-4">
                  <p className="text-sm text-stone-600">Completed</p>
                  <p className="text-2xl font-semibold text-emerald-600 mt-1">{selectedAllocation.payments_completed}</p>
                </div>
                <div className="fdx-card p-4">
                  <p className="text-sm text-stone-600">Remaining</p>
                  <p className="text-2xl font-semibold text-amber-600 mt-1">{selectedAllocation.total_payments - selectedAllocation.payments_completed}</p>
                </div>
              </div>

              <div className="space-y-3">
                {Array.from({ length: selectedAllocation.total_payments }).map((_, i) => {
                  const isPaid = i < selectedAllocation.payments_completed;
                  const isUpcoming = i === selectedAllocation.payments_completed;

                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isPaid ? 'bg-emerald-100' : isUpcoming ? 'bg-amber-100' : 'bg-stone-200'
                        }`}>
                          {isPaid ? (
                            <CheckCircle2 className="size-5 text-emerald-600" />
                          ) : isUpcoming ? (
                            <Clock className="size-5 text-amber-600" />
                          ) : (
                            <span className="text-sm font-semibold text-stone-500">{i + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">Payment #{i + 1}</p>
                          <p className="text-sm text-stone-500">Apr {i + 1}, 2026</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-stone-900">${(selectedAllocation.monthly_interest / 1000).toFixed(1)}K</p>
                        {isPaid ? (
                          <span className="fdx-badge fdx-badge-active text-xs">Paid</span>
                        ) : isUpcoming ? (
                          <span className="fdx-badge fdx-badge-pending text-xs">Upcoming</span>
                        ) : (
                          <span className="fdx-badge fdx-badge-info text-xs">Scheduled</span>
                        )}
                        {!isPaid && (
                          <button className="fdx-btn-outline text-xs px-2 py-1">Mark as Paid</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-stone-200">
                <button className="fdx-btn-outline w-full flex items-center justify-center gap-2 py-2">
                  <Upload className="size-4" />
                  Upload Payment Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
