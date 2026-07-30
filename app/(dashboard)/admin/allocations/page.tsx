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
  X,
  Check,
  User as UserIcon,
  Building2,
  Trash2
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Allocation {
  id: string;
  investor_name: string;
  investor_email: string;
  deal_name: string;
  amount: number;
  percentage: number;
  status: 'Funded' | 'Pending' | 'Review';
  commit_date: string;
  commit_date_raw: string;
  funded_date: string | null;
  funded_date_raw: string;
  monthly_interest: number;
  payment_start_date: string | null;
  term_length: number | null;
  annual_rate: number | null;
  notes: string;
}

interface EditForm {
  amount: string;
  status: 'Funded' | 'Pending' | 'Review';
  commit_date: string;
  funded_date: string;
}

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: string;
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Real projected interest schedule for a single allocation, derived from its terms.
function buildAllocationSchedule(startIso: string | null, termMonths: number | null, monthlyInterest: number) {
  if (!startIso || !termMonths || termMonths <= 0) return [] as { n: number; dateIso: string; amount: number }[];
  return Array.from({ length: termMonths }, (_, i) => ({
    n: i + 1,
    dateIso: addMonthsIso(startIso, i),
    amount: monthlyInterest,
  }));
}

// Soonest upcoming payout date across a set of allocations (today or later).
function computeNextPayout(allocs: Allocation[]): string {
  const today = new Date().toISOString().slice(0, 10);
  let soonest: string | null = null;
  for (const a of allocs) {
    for (const p of buildAllocationSchedule(a.payment_start_date, a.term_length, a.monthly_interest)) {
      if (p.dateIso >= today && (soonest === null || p.dateIso < soonest)) soonest = p.dateIso;
    }
  }
  return soonest
    ? new Date(soonest + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '-';
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [deletingAllocationId, setDeletingAllocationId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ amount: '', status: 'Pending', commit_date: '', funded_date: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmingFunds, setConfirmingFunds] = useState(false);

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
          payment_start_date,
          term_length,
          annual_rate,
          notes,
          deals(name)
        `)
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching allocations:', error);
        setAllocations([]);
        return;
      }

      // Build investor name + email map from both sources
      const investorIds = [...new Set((data || []).map((a: any) => a.investor_id))];
      const nameMap = new Map<string, string>();
      const emailMap = new Map<string, string>();
      if (investorIds.length > 0) {
        const [{ data: manualInvs }, { data: profileInvs }] = await Promise.all([
          supabase.from('investors').select('id, full_name, email').in('id', investorIds),
          supabase.from('user_profiles').select('user_id, full_name, email').in('user_id', investorIds),
        ]);
        (manualInvs || []).forEach((i: any) => { nameMap.set(i.id, i.full_name); if (i.email) emailMap.set(i.id, i.email); });
        (profileInvs || []).forEach((p: any) => { nameMap.set(p.user_id, p.full_name); if (p.email) emailMap.set(p.user_id, p.email); });
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

      // Transform data to match Allocation interface (all fields real, from DB)
      const fmtDate = (v: string | null) => v
        ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';
      const rawDate = (v: string | null) => (v ? String(v).slice(0, 10) : '');

      const transformedAllocations: Allocation[] = data.map((alloc: any) => ({
        id: alloc.id,
        investor_name: nameMap.get(alloc.investor_id) || 'Unknown',
        investor_email: emailMap.get(alloc.investor_id) || '',
        deal_name: alloc.deals?.name || 'Unknown',
        amount: Number(alloc.allocation_amount) || 0,
        percentage: alloc.allocation_percentage || 0,
        status: alloc.funding_status || 'Pending',
        commit_date: fmtDate(alloc.commit_date),
        commit_date_raw: rawDate(alloc.commit_date),
        funded_date: alloc.funding_status === 'Funded' ? fmtDate(alloc.expected_funding_date) : null,
        funded_date_raw: rawDate(alloc.expected_funding_date),
        monthly_interest: Number(alloc.monthly_interest) || 0,
        payment_start_date: rawDate(alloc.payment_start_date) || null,
        term_length: alloc.term_length != null ? Number(alloc.term_length) : null,
        annual_rate: alloc.annual_rate != null ? Number(alloc.annual_rate) : null,
        notes: alloc.notes || '',
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
          value: computeNextPayout(transformedAllocations),
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
    setEditForm({
      amount: String(allocation.amount || ''),
      status: allocation.status,
      commit_date: allocation.commit_date_raw,
      funded_date: allocation.funded_date_raw,
    });
    setEditModalOpen(true);
  };

  const patchAllocation = async (id: string, body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Your session expired. Please log in again.'); return false; }
    const response = await fetch(`/api/allocations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      alert(result?.message || 'Failed to update allocation.');
      return false;
    }
    return true;
  };

  const handleSaveEdit = async () => {
    if (!selectedAllocation) return;
    setSavingEdit(true);
    try {
      const body: Record<string, unknown> = { funding_status: editForm.status };
      const amt = parseFloat(editForm.amount);
      if (!Number.isNaN(amt)) body.allocation_amount = amt;
      if (editForm.commit_date) body.commit_date = editForm.commit_date;
      if (editForm.funded_date) body.expected_funding_date = editForm.funded_date;
      const ok = await patchAllocation(selectedAllocation.id, body);
      if (ok) {
        setEditModalOpen(false);
        await loadAllocationsData();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmFunds = async () => {
    if (!selectedAllocation) return;
    setConfirmingFunds(true);
    try {
      const ok = await patchAllocation(selectedAllocation.id, { funding_status: 'Funded' });
      if (ok) {
        setViewDrawerOpen(false);
        await loadAllocationsData();
      }
    } finally {
      setConfirmingFunds(false);
    }
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
                      <p className="text-sm text-stone-500">{selectedAllocation.investor_email || '—'}</p>
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

              {/* Notes */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Notes</h3>
                <div className="fdx-card p-4">
                  {selectedAllocation.notes ? (
                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{selectedAllocation.notes}</p>
                  ) : (
                    <p className="text-sm text-stone-400 italic">No notes for this allocation.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {selectedAllocation.status === 'Pending' && (
                <div className="sticky bottom-0 bg-white border-t border-stone-200 pt-4">
                  <button
                    className="fdx-btn-primary w-full flex items-center justify-center gap-2 py-2 disabled:opacity-60"
                    onClick={handleConfirmFunds}
                    disabled={confirmingFunds}
                  >
                    <Check className="size-4" />
                    {confirmingFunds ? 'Confirming…' : 'Confirm Funds Received'}
                  </button>
                </div>
              )}
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
                <input value={selectedAllocation.investor_name} disabled className="fdx-input w-full mt-1.5 bg-stone-50" />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Deal</label>
                <input value={selectedAllocation.deal_name} disabled className="fdx-input w-full mt-1.5 bg-stone-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700">Amount ($)</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                    className="fdx-input w-full mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">% of Deal</label>
                  <input value={`${selectedAllocation.percentage.toFixed(1)}%`} disabled className="fdx-input w-full mt-1.5 bg-stone-50" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as EditForm['status'] }))}
                  className="fdx-input w-full mt-1.5"
                >
                  <option value="Pending">Pending</option>
                  <option value="Funded">Funded</option>
                  <option value="Review">In Review</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700">Commit Date</label>
                  <input
                    type="date"
                    value={editForm.commit_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, commit_date: e.target.value }))}
                    className="fdx-input w-full mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">Funded Date</label>
                  <input
                    type="date"
                    value={editForm.funded_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, funded_date: e.target.value }))}
                    className="fdx-input w-full mt-1.5"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="fdx-btn-primary flex-1 py-2 disabled:opacity-60" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="fdx-btn-outline flex-1 py-2" onClick={() => setEditModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule Modal — real projected interest schedule from allocation terms */}
      {paymentModalOpen && selectedAllocation && (() => {
        const schedule = buildAllocationSchedule(
          selectedAllocation.payment_start_date,
          selectedAllocation.term_length,
          selectedAllocation.monthly_interest,
        );
        const todayIso = new Date().toISOString().slice(0, 10);
        const totalInterest = schedule.reduce((s, p) => s + p.amount, 0);
        return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Projected Payment Schedule</h2>
                <p className="text-sm text-stone-500 mt-0.5">Interest projection based on this allocation&apos;s terms</p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="size-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {schedule.length === 0 ? (
                <div className="py-10 text-center text-sm text-stone-500">
                  No schedule available — this allocation has no payment start date or term set.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="fdx-card p-4">
                      <p className="text-sm text-stone-600">Total Payments</p>
                      <p className="text-2xl font-semibold text-stone-900 mt-1">{schedule.length}</p>
                    </div>
                    <div className="fdx-card p-4">
                      <p className="text-sm text-stone-600">Monthly Interest</p>
                      <p className="text-2xl font-semibold text-purple-600 mt-1">${(selectedAllocation.monthly_interest / 1000).toFixed(1)}K</p>
                    </div>
                    <div className="fdx-card p-4">
                      <p className="text-sm text-stone-600">Total Interest</p>
                      <p className="text-2xl font-semibold text-stone-900 mt-1">${(totalInterest / 1000).toFixed(1)}K</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {schedule.map((p) => {
                      const isPast = p.dateIso < todayIso;
                      return (
                        <div key={p.n} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-stone-200">
                              <span className="text-sm font-semibold text-stone-500">{p.n}</span>
                            </div>
                            <div>
                              <p className="font-medium text-stone-900">Payment #{p.n}</p>
                              <p className="text-sm text-stone-500">
                                {new Date(p.dateIso + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-stone-900">${(p.amount / 1000).toFixed(1)}K</p>
                            <span className={`fdx-badge text-xs ${isPast ? 'fdx-badge-info' : 'fdx-badge-pending'}`}>
                              {isPast ? 'Elapsed' : 'Scheduled'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-stone-400 pt-2">
                    Payment tracking and marking payouts as paid is handled on the Payments page.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </>
  );
}
