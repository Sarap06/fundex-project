'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
import { TrendingUp, DollarSign, AlertCircle, Plus, X, Filter, Search, Trash2, Edit, Eye } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserCompanyId, logOut } from '@/lib/auth';
import { CreateDealWizard } from '@/components/create-deal-wizard';
import { DealQuickViewModal, type DealQuickViewData } from '@/components/deal-quick-view-modal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Deal {
  id: string;
  deal_id: string;
  name: string;
  type: string;
  location: string;
  location_state: string;
  location_city: string;
  status: string;
  target_amount: number;
  raised_amount: number;
  progress: number;
  investor_count: number;
  term: string;
  interest_rate: number;
  close_date: string;
  next_milestone: string;
  milestone_type: string;
  borrower_name: string;
  borrower_contact: string;
  property_address: string;
  property_type: string;
  loan_purpose: string;
  documents_status: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  dealInvestors?: Array<{
    id: string;
    investor_id: string;
    investor_source: 'investors' | 'user_profiles';
  }>;
}

interface Filters {
  contractStatus: string[];
  dealType: string[];
  location: { state: string; city: string };
  fundingProgress: string[];
  interestRate: { min: string; max: string };
  capitalRaised: { min: string; max: string };
  monthlyInterest: { min: string; max: string };
  nextMilestone: string[];
  needsAttention: string[];
}

export default function DealsPage() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [quickViewDeal, setQuickViewDeal] = useState<DealQuickViewData | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);


  const [filters, setFilters] = useState<Filters>({
    contractStatus: [],
    dealType: [],
    location: { state: '', city: '' },
    fundingProgress: [],
    interestRate: { min: '', max: '' },
    capitalRaised: { min: '', max: '' },
    monthlyInterest: { min: '', max: '' },
    nextMilestone: [],
    needsAttention: [],
  });

  // Fetch deals on component mount
  useEffect(() => {
    const loadData = async () => {
      const cId = await getCurrentUserCompanyId();
      setCompanyId(cId);
      fetchDeals(cId);
      
      // Fetch current user profile for activity logging
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', authUser.id)
            .single();
          
          if (userProfile?.full_name) {
            setUserName(userProfile.full_name);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    loadData();
  }, []);

  // Filter deals when search or filters change
  useEffect(() => {
    applyFilters();
  }, [deals, searchTerm, filters, statusTab]);

  const fetchDeals = async (cId: string | null) => {
    let query = supabase
      .from('deals')
      .select(`
        *,
        deal_investors (
          id,
          investor_id,
          investor_source
        )
      `);

    // If company_id is available, filter by it
    if (cId) {
      query = query.eq('company_id', cId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      return;
    }

    // Transform data to rename deal_investors to dealInvestors for easier access
    const transformedData = data?.map((deal: any) => ({
      ...deal,
      dealInvestors: deal.deal_investors || []
    })) || [];

    setDeals(transformedData);
  };

  const applyFilters = () => {
    let filtered = deals.filter(deal => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          deal.name.toLowerCase().includes(term) ||
          deal.deal_id.toLowerCase().includes(term) ||
          deal.borrower_name?.toLowerCase().includes(term) ||
          deal.location?.toLowerCase().includes(term) ||
          deal.type.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Status tab filter
      if (statusTab !== 'all') {
        const tabStatusMap: Record<string, string[]> = {
          funding: ['Funding', 'funding'],
          active: ['Active', 'active'],
          'due-diligence': ['Due Diligence', 'due_diligence', 'due diligence'],
          'awaiting-docs': ['Awaiting Docs', 'awaiting_docs', 'awaiting docs'],
          closed: ['Closed', 'closed'],
        };
        const allowed = tabStatusMap[statusTab] || [];
        if (allowed.length > 0 && !allowed.some(s => s.toLowerCase() === deal.status.toLowerCase())) return false;
      }

      // Status filter
      if (filters.contractStatus.length > 0 && !filters.contractStatus.includes(deal.status)) {
        return false;
      }

      // Type filter
      if (filters.dealType.length > 0 && !filters.dealType.includes(deal.type)) {
        return false;
      }

      // Location filters
      if (filters.location.state && deal.location_state !== filters.location.state) {
        return false;
      }
      if (filters.location.city && !deal.location_city?.toLowerCase().includes(filters.location.city.toLowerCase())) {
        return false;
      }

      // Interest rate filter
      if (filters.interestRate.min || filters.interestRate.max) {
        const rate = deal.interest_rate || 0;
        if (filters.interestRate.min && rate < parseFloat(filters.interestRate.min)) return false;
        if (filters.interestRate.max && rate > parseFloat(filters.interestRate.max)) return false;
      }

      // Capital raised filter
      if (filters.capitalRaised.min || filters.capitalRaised.max) {
        const raised = deal.raised_amount || 0;
        if (filters.capitalRaised.min && raised < parseFloat(filters.capitalRaised.min)) return false;
        if (filters.capitalRaised.max && raised > parseFloat(filters.capitalRaised.max)) return false;
      }

      return true;
    });

    setFilteredDeals(filtered);
  };

  const handleAddDeal = async (wizardData: any) => {
    if (!companyId) {
      alert('Unable to determine company. Please refresh the page.');
      return;
    }

    try {
      // Fetch current user's full name for activity logging
      let creatorName = userName;
      if (!creatorName) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('user_id', authUser.id)
              .single();
            
            if (userProfile?.full_name) {
              creatorName = userProfile.full_name;
              setUserName(userProfile.full_name);
            }
          }
        } catch (error) {
          console.error('Error fetching user for activity:', error);
        }
      }

      const isEdit = !!editingDeal;
      
      // Generate deal ID only for new deals, preserve for edits
      const dealId = isEdit ? editingDeal.deal_id : `D-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const dealPayload = {
        company_id: companyId,
        deal_id: dealId,
        name: wizardData.name,
        type: wizardData.type,
        location: `${wizardData.city}, ${wizardData.state}`,
        location_state: wizardData.state,
        location_city: wizardData.city,
        status: wizardData.status,
        target_amount: wizardData.targetAmount ? parseFloat(wizardData.targetAmount) : null,
        raised_amount: wizardData.raisedAmount ? parseFloat(wizardData.raisedAmount) : 0,
        progress: wizardData.targetAmount && wizardData.raisedAmount ? 
          Math.round((parseFloat(wizardData.raisedAmount) / parseFloat(wizardData.targetAmount)) * 100) : 0,
        interest_rate: wizardData.interestRate ? parseFloat(wizardData.interestRate) : null,
        term: `${wizardData.termLengthMonths} months`,
        close_date: wizardData.closeDate || null,
        next_milestone: wizardData.nextMilestone || null,
        milestone_type: wizardData.milestoneType,
        borrower_name: wizardData.borrowerName,
        borrower_contact: wizardData.borrowerContact,
        property_address: wizardData.propertyAddress,
        property_type: wizardData.propertyType,
        loan_purpose: wizardData.loanPurpose,
        documents_status: 'Pending',
        notes: wizardData.notes,
        investor_notes: wizardData.investorNotes,
        tags: [],
        investor_count: 0,
        // New fields
        minimum_investment: wizardData.minimumInvestment ? parseFloat(wizardData.minimumInvestment) : null,
        term_length_months: wizardData.termLengthMonths ? parseInt(wizardData.termLengthMonths) : null,
        funding_close_date: wizardData.fundingCloseDate || null,
        first_payout_date: wizardData.firstPayoutDate || null,
        collateral_type: wizardData.collateralType,
        collateral_address: wizardData.collateralAddress,
        estimated_property_value: wizardData.estimatedPropertyValue ? parseFloat(wizardData.estimatedPropertyValue) : null,
        loan_to_value_ratio: wizardData.loanToValueRatio ? parseFloat(wizardData.loanToValueRatio) : null,
        asset_notes: wizardData.assetNotes,
        default_investor_audience: wizardData.defaultInvestorAudience,
        enable_broadcast_channel: wizardData.enableBroadcastChannel,
        enable_investor_inbox: wizardData.enableInvestorInbox,
        require_investor_acknowledgment: wizardData.requireInvestorAcknowledgment,
        automated_investor_message: wizardData.automatedInvestorMessage,
        send_automated_message: wizardData.sendAutomatedMessage,
        internal_approval_deadline: wizardData.internalApprovalDeadline || null,
        milestone_notes: wizardData.milestoneNotes,
        document_status: 'Pending',
      };

      let newDeal: any;
      
      if (isEdit) {
        // Update existing deal
        const { data: updatedDeal, error: dealError } = await supabase
          .from('deals')
          .update(dealPayload)
          .eq('id', editingDeal.id)
          .select()
          .single();

        if (dealError) {
          console.error('Error updating deal:', dealError);
          alert('Failed to update deal');
          return;
        }
        newDeal = updatedDeal;
      } else {
        // Insert new deal
        const { data: createdDeal, error: dealError } = await supabase
          .from('deals')
          .insert([dealPayload])
          .select()
          .single();

        if (dealError) {
          console.error('Error creating deal:', dealError);
          alert('Failed to create deal');
          return;
        }
        newDeal = createdDeal;

        // Log activity for new deal
        try {
          await fetch('/api/activities/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId,
              activityType: 'deal_created',
              title: `New deal: ${newDeal.name}`,
              description: 'A new deal has been created',
              dealId: newDeal.id,
              dealName: newDeal.name,
              createdByName: creatorName,
              metadata: {
                targetAmount: newDeal.target_amount,
                status: newDeal.status,
              },
            }),
          });
        } catch (err) {
          console.error('Error logging deal creation activity:', err);
        }
      }

      // Handle file uploads if any
      if (wizardData.uploadedFiles && wizardData.uploadedFiles.length > 0) {
        for (const fileData of wizardData.uploadedFiles) {
          try {
            const fileExt = fileData.file.name.split('.').pop();
            const fileName = `deal-${newDeal.id}-${Date.now()}.${fileExt}`;
            const filePath = `deals/${newDeal.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(filePath, fileData.file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              continue;
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(filePath);

            // Insert document record into the documents table
            const { error: docError } = await supabase
              .from('documents')
              .insert({
                company_id: companyId,
                deal_id: newDeal.id,
                document_id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: fileData.file.name,
                type: fileExt || 'Other',
                category: fileData.type || 'Deal Documents',
                file_url: urlData.publicUrl,
                file_size: `${(fileData.file.size / 1024).toFixed(2)} KB`,
                file_type: fileData.file.type,
                uploaded_by: 'admin',
                status: 'Published',
                notify_investor: false,
                notes: `Uploaded for deal: ${newDeal.name}`,
              });

            if (docError) {
              console.error('Error creating document record:', docError);
              console.error('Document insert error details:', docError.message, docError.details);
            }
          } catch (fileError) {
            console.error('Error processing file:', fileError);
          }
        }
      }

      // Handle investor selection
      if (isEdit) {
        // Delete old investor records
        const { error: deleteError } = await supabase
          .from('deal_investors')
          .delete()
          .eq('deal_id', newDeal.id);

        if (deleteError) {
          console.error('Error deleting old investor records:', deleteError);
        }
      }

      if (wizardData.selectedInvestors && wizardData.selectedInvestors.length > 0) {
        const investorRecords = wizardData.selectedInvestors.map((selected: any) => ({
          deal_id: newDeal.id,
          investor_id: selected.id,
          investor_source: selected.source || 'user_profiles',
        }));

        const { error: investorError } = await supabase
          .from('deal_investors')
          .insert(investorRecords);

        if (investorError) {
          console.error('Error linking investors to deal:', investorError);
          // Don't alert here as the deal was already created
        }
      }

      setIsDrawerOpen(false);
      setEditingDeal(null);
      fetchDeals(companyId);
      alert(isEdit ? 'Deal updated successfully!' : 'Deal created successfully!');
    } catch (error) {
      console.error('Error in handleAddDeal:', error);
      alert('An error occurred while saving the deal');
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    const { error } = await supabase.from('deals').delete().eq('id', id);

    if (error) {
      console.error('Error deleting deal:', error);
      alert('Failed to delete deal');
      return;
    }

    fetchDeals(companyId);
  };

  const toggleCheckboxFilter = (category: keyof Filters, value: string) => {
    if (typeof filters[category] === 'object' && !Array.isArray(filters[category])) return;
    
    const filterArray = filters[category] as string[];
    setFilters(prev => ({
      ...prev,
      [category]: filterArray.includes(value)
        ? filterArray.filter(item => item !== value)
        : [...filterArray, value]
    }));
  };

  const handleApplyFilters = () => {
    let count = 0;
    count += filters.contractStatus.length;
    count += filters.dealType.length;
    if (filters.location.state) count++;
    if (filters.location.city) count++;
    if (filters.interestRate.min || filters.interestRate.max) count++;
    if (filters.capitalRaised.min || filters.capitalRaised.max) count++;
    if (filters.monthlyInterest.min || filters.monthlyInterest.max) count++;
    setActiveFilterCount(count);
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      contractStatus: [],
      dealType: [],
      location: { state: '', city: '' },
      fundingProgress: [],
      interestRate: { min: '', max: '' },
      capitalRaised: { min: '', max: '' },
      monthlyInterest: { min: '', max: '' },
      nextMilestone: [],
      needsAttention: [],
    });
    setActiveFilterCount(0);
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalMonthlyInterest = () => {
    return deals
      .filter(deal => deal.status === 'Active')
      .reduce((sum, deal) => {
        const monthlyInterest = ((deal.raised_amount || 0) * (deal.interest_rate || 0) / 100) / 12;
        return sum + monthlyInterest;
      }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Funding':
        return 'fdx-badge fdx-badge-info';
      case 'Active':
        return 'fdx-badge fdx-badge-active';
      case 'Due Diligence':
        return 'fdx-badge fdx-badge-info';
      case 'Awaiting Docs':
        return 'fdx-badge fdx-badge-info';
      case 'Closed':
        return 'fdx-badge fdx-badge-pending';
      default:
        return 'fdx-badge fdx-badge-info';
    }
  };

  const getMilestoneTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'fdx-badge fdx-badge-active';
      case 'attention':
        return 'fdx-badge fdx-badge-info';
      case 'normal':
        return 'fdx-badge fdx-badge-pending';
      default:
        return 'fdx-badge fdx-badge-pending';
    }
  };

  const totalDeals = deals.length;
  const activeDeals = deals.filter(d => d.status === 'Active').length;
  const closedDeals = deals.filter(d => d.status === 'Closed').length;
  const needsAttention = deals.filter(d => d.milestone_type === 'urgent' || d.milestone_type === 'attention').length;

  const handleLogOut = async () => {
    await logOut();
    router.push('/auth/login');
  };

  return (
    <>
      <div>
      <PageHeader title="Deals" subtitle="Create and manage investment deals" />

      <StaggerContainer className="mt-6">
      {/* KPI Cards */}
      <StaggerItem>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="fdx-card p-5 relative overflow-hidden">
          <div className="fdx-card-glow" />
          <div className="flex items-center justify-between mb-2">
            <p className="fdx-label">Total Contracts</p>
            <TrendingUp className="size-4 text-stone-500" />
          </div>
          <p className="fdx-value">{totalDeals}</p>
          <p className="text-xs text-stone-500 mt-1">Across all stages</p>
        </div>

        <div className="fdx-card p-5 relative overflow-hidden">
          <div className="fdx-card-glow" />
          <div className="flex items-center justify-between mb-2">
            <p className="fdx-label">Active Contracts</p>
            <TrendingUp className="size-4 text-stone-500" />
          </div>
          <p className="fdx-value">{activeDeals}</p>
          <p className="text-xs text-stone-500 mt-1">Generating interest</p>
        </div>

        <div className="fdx-card p-5 relative overflow-hidden">
          <div className="fdx-card-glow" />
          <div className="flex items-center justify-between mb-2">
            <p className="fdx-label">Closed Contracts</p>
            <TrendingUp className="size-4 text-stone-500" />
          </div>
          <p className="fdx-value">{closedDeals}</p>
          <p className="text-xs text-stone-500 mt-1">Matured or repaid</p>
        </div>

        <div className="fdx-card p-5 relative overflow-hidden">
          <div className="fdx-card-glow" />
          <div className="flex items-center justify-between mb-2">
            <p className="fdx-label">Monthly Interest Paid</p>
            <DollarSign className="size-4 text-stone-500" />
          </div>
          <p className="fdx-value">{formatCurrency(calculateTotalMonthlyInterest())}</p>
          <p className="text-xs text-stone-500 mt-1">Interest distributed this month</p>
        </div>

        <div className="fdx-card p-5 relative overflow-hidden">
          <div className="fdx-card-glow" />
          <div className="flex items-center justify-between mb-2">
            <p className="fdx-label">Needs Attention</p>
            <AlertCircle className="size-4 text-stone-500" />
          </div>
          <p className="fdx-value">{needsAttention}</p>
          <p className="text-xs text-stone-500 mt-1">Require action</p>
        </div>
      </div>
      </StaggerItem>

      {/* Search and Filters */}
      <StaggerItem>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-stone-500" />
            <Input
              placeholder="Search deals by name, ID, borrower, location, or type..."
              className="fdx-input pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="fdx-btn-secondary gap-2"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            >
              <Filter className="size-4" />
              Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>

            <Button
              onClick={() => setIsDrawerOpen(true)}
              className="fdx-btn-primary gap-2"
            >
              <Plus className="size-4" />
              Create Deal
            </Button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mt-4">
        {[
          { key: 'all', label: 'All' },
          { key: 'funding', label: 'Funding' },
          { key: 'active', label: 'Active' },
          { key: 'due-diligence', label: 'Due Diligence' },
          { key: 'awaiting-docs', label: 'Awaiting Docs' },
          { key: 'closed', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              statusTab === tab.key
                ? 'bg-fundex-forest text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      </StaggerItem>

      {/* Create Deal Wizard Modal */}
      {isDrawerOpen && (
        <CreateDealWizard
          onClose={() => {
            setIsDrawerOpen(false);
            setEditingDeal(null);
          }}
          onSave={handleAddDeal}
          initialData={editingDeal}
        />
      )}

      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <div ref={filterPanelRef} className="mb-6 p-5 fdx-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="fdx-section-title">Filter Deals</h3>
            <button
              onClick={() => setIsFilterPanelOpen(false)}
              className="text-stone-500 hover:text-stone-900"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-5">
            {/* Contract Status */}
            <div>
              <h4 className="fdx-label mb-3">Contract Status</h4>
              <div className="space-y-2">
                {['Funding', 'Active', 'Due Diligence', 'Awaiting Docs', 'Closed'].map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.contractStatus.includes(status)}
                      onCheckedChange={() => toggleCheckboxFilter('contractStatus', status)}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm text-stone-500 cursor-pointer">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Deal Type */}
            <div>
              <h4 className="fdx-label mb-3">Deal Type</h4>
              <div className="space-y-2">
                {['Bridge Loan', 'Construction', 'Acquisition', 'Development', 'Refinance'].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.dealType.includes(type)}
                      onCheckedChange={() => toggleCheckboxFilter('dealType', type)}
                    />
                    <label htmlFor={`type-${type}`} className="text-sm text-stone-500 cursor-pointer">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="fdx-label mb-3">Location</h4>
              <div className="space-y-2">
                <Input
                  className="fdx-input"
                  placeholder="State (e.g., TX)"
                  maxLength={2}
                  value={filters.location.state}
                  onChange={(e) => setFilters({ ...filters, location: { ...filters.location, state: e.target.value.toUpperCase() } })}
                />
                <Input
                  className="fdx-input"
                  placeholder="City"
                  value={filters.location.city}
                  onChange={(e) => setFilters({ ...filters, location: { ...filters.location, city: e.target.value } })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* Interest Rate Range */}
            <div>
              <h4 className="fdx-label mb-3">Interest Rate (%)</h4>
              <div className="space-y-2">
                <Input
                  className="fdx-input"
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  value={filters.interestRate.min}
                  onChange={(e) => setFilters({ ...filters, interestRate: { ...filters.interestRate, min: e.target.value } })}
                />
                <Input
                  className="fdx-input"
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  value={filters.interestRate.max}
                  onChange={(e) => setFilters({ ...filters, interestRate: { ...filters.interestRate, max: e.target.value } })}
                />
              </div>
            </div>

            {/* Capital Raised Range */}
            <div>
              <h4 className="fdx-label mb-3">Capital Raised ($)</h4>
              <div className="space-y-2">
                <Input
                  className="fdx-input"
                  type="number"
                  placeholder="Min"
                  value={filters.capitalRaised.min}
                  onChange={(e) => setFilters({ ...filters, capitalRaised: { ...filters.capitalRaised, min: e.target.value } })}
                />
                <Input
                  className="fdx-input"
                  type="number"
                  placeholder="Max"
                  value={filters.capitalRaised.max}
                  onChange={(e) => setFilters({ ...filters, capitalRaised: { ...filters.capitalRaised, max: e.target.value } })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-5 pt-5 border-t border-stone-100">
            <Button variant="outline" onClick={handleClearFilters} className="fdx-btn-secondary">
              Clear Filters
            </Button>
            <Button onClick={handleApplyFilters} className="fdx-btn-primary">
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Deals Table */}
      <StaggerItem>
      <div className="fdx-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="fdx-table-header">
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Deal ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Target / Raised</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Rate</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Investors</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Close Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase">Milestone</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-stone-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="fdx-table-row">
                  <td className="px-6 py-4 text-sm font-normal text-stone-900">{deal.deal_id}</td>
                  <td className="px-6 py-4 text-sm text-stone-900">{deal.name}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{deal.location}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{deal.type}</td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {formatCurrency(deal.target_amount)} / {formatCurrency(deal.raised_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-stone-100 h-2 overflow-hidden">
                        <div
                          className="bg-fundex-gold h-2"
                          style={{ width: `${Math.min(100, deal.progress)}%` }}
                        />
                      </div>
                      <span className="text-sm font-normal text-stone-500">{deal.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">{deal.interest_rate}%</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{deal.dealInvestors?.length ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">{deal.close_date ? new Date(deal.close_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4">
                    {deal.next_milestone && (
                      <Badge className={getMilestoneTypeColor(deal.milestone_type)}>
                        {deal.milestone_type}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setQuickViewDeal({
                          id: deal.id,
                          name: deal.name,
                          dealId: deal.deal_id,
                          status: deal.status,
                          type: deal.type,
                          location: [deal.location_city, deal.location_state].filter(Boolean).join(', ') || deal.location,
                          targetAmount: deal.target_amount,
                          raisedAmount: deal.raised_amount,
                          progress: deal.progress,
                          interestRate: deal.interest_rate,
                          monthlyInterest: deal.target_amount * (deal.interest_rate / 100) / 12,
                          minimumInvestment: 0,
                          term: deal.term || '',
                          investorCount: deal.dealInvestors?.length ?? deal.investor_count,
                        })}
                        className="text-stone-500 hover:text-fundex-forest"
                        title="Quick view"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingDeal(deal);
                          setIsDrawerOpen(true);
                        }}
                        className="text-fundex-forest hover:text-fundex-green"
                        title="Edit deal"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="fdx-btn-danger inline-flex p-1"
                        title="Delete deal"
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

        {filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500">No deals found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
      </StaggerItem>

      </StaggerContainer>
      </div>

      <DealQuickViewModal
        isOpen={!!quickViewDeal}
        onClose={() => setQuickViewDeal(null)}
        deal={quickViewDeal}
      />
    </>
  );
}
