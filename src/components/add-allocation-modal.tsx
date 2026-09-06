'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { X, Search, Upload, FileText, Trash2 } from 'lucide-react';

interface Investor {
  id: string;
  investor_code?: string;
  full_name: string;
  email: string;
  initial_investment: number;
  investor_source?: string;
}

interface Deal {
  id: string;
  deal_id: string;
  name: string;
  target_amount: number;
  raised_amount: number;
  type: string;
  interest_rate?: number | null;
  term_length_months?: number | null;
  payout_cycle?: number | null;
  first_payout_date?: string | null;
}

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  error?: string;
}

interface AllocationFormData {
  investor_id: string;
  investor_source: string;
  deal_id: string;
  allocation_amount: number;
  allocation_percentage?: number;
  annual_rate: number;
  term_length: number;
  term_unit: string;
  payment_frequency: string;
  commit_date: string;
  expected_funding_date: string;
  payment_start_date: string;
  funding_status: string;
  sponsor_id: string;
  notes: string;
}

interface AddAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AllocationFormData) => Promise<void>;
  companyId: string;
  // When opened from inside a deal (e.g. the deal quick-view), pre-select that
  // deal — it's the SAME single allocation workflow, just pre-scoped, so an
  // investor can never enter a deal through a second, divergent form.
  preselectedDealId?: string;
}

export function AddAllocationModal({
  isOpen,
  onClose,
  onSave,
  companyId,
  preselectedDealId,
}: AddAllocationModalProps) {
  const [formData, setFormData] = useState<AllocationFormData>({
    investor_id: '',
    investor_source: 'investors',
    deal_id: '',
    allocation_amount: 0,
    annual_rate: 0,
    term_length: 12,
    term_unit: 'months',
    payment_frequency: 'Monthly',
    commit_date: new Date().toISOString().split('T')[0],
    expected_funding_date: '',
    payment_start_date: '',
    funding_status: 'Pending',
    sponsor_id: '',
    notes: '',
  });

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [investorSearch, setInvestorSearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showInvestorDropdown, setShowInvestorDropdown] = useState(false);
  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadInvestorsAndDeals();
      getCurrentUser();
    } else {
      // Reset all state when modal closes
      setShowInvestorDropdown(false);
      setShowDealDropdown(false);
    }
  }, [isOpen, companyId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  // Apply the deal preselection once deals have loaded (and again if the modal
  // reopens without a selection). Goes through handleSelectDeal so the deal's
  // rate/term/frequency/first-payout prefill and locks all apply.
  useEffect(() => {
    if (isOpen && preselectedDealId && !selectedDeal && deals.length > 0) {
      const deal = deals.find((d) => d.id === preselectedDealId);
      if (deal) handleSelectDeal(deal);
    }
  }, [isOpen, preselectedDealId, deals]);

  useEffect(() => {
    const filtered = investors.filter((inv) =>
      inv.full_name.toLowerCase().includes(investorSearch.toLowerCase()) ||
      inv.email.toLowerCase().includes(investorSearch.toLowerCase()) ||
      (inv.investor_code || '').toLowerCase().includes(investorSearch.toLowerCase())
    );
    setFilteredInvestors(filtered);
  }, [investorSearch, investors]);

  useEffect(() => {
    const filtered = deals.filter((deal) =>
      deal.name.toLowerCase().includes(dealSearch.toLowerCase()) ||
      deal.deal_id.toLowerCase().includes(dealSearch.toLowerCase())
    );
    setFilteredDeals(filtered);
  }, [dealSearch, deals]);

  const loadInvestorsAndDeals = async () => {
    // companyId can arrive a beat after the modal opens (e.g. quick-view still
    // resolving the profile) — the [isOpen, companyId] effect re-runs this once
    // it lands, so just skip the empty-tenant query instead of 400ing.
    if (!companyId) return;
    try {
      // Fetch manually-added investors
      const { data: investorData } = await supabase
        .from('investors')
        .select('id, investor_id, full_name, email, initial_investment')
        .eq('company_id', companyId);

      // Fetch signed-up investors from user_profiles
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .eq('company_id', companyId)
        .eq('role', 'investor');

      const manualInvestors: Investor[] = (investorData || []).map((inv: { id: string; investor_id?: string; full_name: string; email: string; initial_investment: number }) => ({
        id: inv.id,
        investor_code: inv.investor_id,
        full_name: inv.full_name,
        email: inv.email,
        initial_investment: inv.initial_investment,
        investor_source: 'investors',
      }));

      const signedUpInvestors: Investor[] = (profileData || []).map((p) => ({
        id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        initial_investment: 0,
        investor_source: 'user_profiles',
      }));

      // Merge, deduplicating by email (prefer user_profiles entry if same email)
      const emailSeen = new Set<string>();
      const merged: Investor[] = [];
      [...signedUpInvestors, ...manualInvestors].forEach((inv) => {
        if (!emailSeen.has(inv.email)) {
          emailSeen.add(inv.email);
          merged.push(inv);
        }
      });

      // Fetch deals for the company
      // Closed deals take no new allocations, so they're not selectable here
      // (the API enforces the same rule server-side).
      const { data: dealData } = await supabase
        .from('deals')
        .select('id, deal_id, name, target_amount, raised_amount, type, interest_rate, term_length_months, payout_cycle, first_payout_date')
        .eq('company_id', companyId)
        .neq('status', 'Closed');

      setInvestors(merged);
      setDeals(dealData || []);
    } catch (error) {
      console.error('Error loading investors and deals:', error);
    }
  };

  const handleSelectInvestor = (investor: Investor) => {
    setSelectedInvestor(investor);
    setFormData({ ...formData, investor_id: investor.id, investor_source: investor.investor_source || 'investors' });
    setInvestorSearch(investor.full_name);
    setShowInvestorDropdown(false);
    setShowDealDropdown(false);
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    // Pull the real terms from the selected deal so the admin doesn't re-enter
    // them (and the placeholder rate can't leak through). Rate, term, frequency
    // and payout schedule come straight from the deal record. First Payout Date
    // is only PREFILLED — it stays editable because an investor may join a deal
    // mid-term and need their own start date.
    setFormData({
      ...formData,
      deal_id: deal.id,
      annual_rate: deal.interest_rate != null ? Number(deal.interest_rate) : formData.annual_rate,
      term_length: deal.term_length_months != null ? Number(deal.term_length_months) : formData.term_length,
      term_unit: 'months',
      payment_frequency: 'Monthly',
      // Always take the newly selected deal's schedule — keeping a previous
      // deal's date after a switch would silently misdate the payout schedule.
      // The field stays editable for per-allocation adjustments afterwards.
      payment_start_date: deal.first_payout_date || formData.payment_start_date || '',
    });
    setDealSearch(deal.name);
    setShowDealDropdown(false);
    setShowInvestorDropdown(false);
  };

  // Remaining capacity on the selected deal = target − already-allocated (raised).
  const remainingCapacity = (): number => {
    if (!selectedDeal) return 0;
    return Math.max(0, Number(selectedDeal.target_amount || 0) - Number(selectedDeal.raised_amount || 0));
  };

  // Full-dollar formatting — abbreviations like $0.10M are fine for dashboard
  // totals but not for individual investment positions.
  const fmtMoney = (n: number): string => {
    const digits = Number.isInteger(n) ? 0 : 2;
    return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  };

  // Maturity = the allocation's first payout month + term. Uses the editable
  // per-allocation start date so a mid-term joiner sees their own maturity.
  const maturityDate = (): string | null => {
    const start = formData.payment_start_date || selectedDeal?.first_payout_date;
    const term = formData.term_unit === 'years' ? formData.term_length * 12 : formData.term_length;
    if (!start || !term) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(start);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1 + term, Number(m[3]));
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'allocation_amount' ||
        name === 'annual_rate' ||
        name === 'term_length'
          ? value === '' ? 0 : parseFloat(value)
          : value,
    });
  };

  const calculateDealPercentage = () => {
    if (selectedDeal && formData.allocation_amount) {
      return (
        ((formData.allocation_amount / selectedDeal.target_amount) * 100).toFixed(2) +
        '%'
      );
    }
    return '0%';
  };

  const calculateMonthlyInterest = () => {
    if (formData.allocation_amount && formData.annual_rate) {
      return (
        (formData.allocation_amount * formData.annual_rate / 100) / 12
      ).toFixed(2);
    }
    return '0';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !selectedDeal) {
      alert('Please select an investor and deal');
      return;
    }

    if (!formData.expected_funding_date || !formData.payment_start_date) {
      alert('Please fill in all date fields (Commit Date, Expected Funding Date, and Payment Start Date)');
      return;
    }

    // Block allocations that exceed the deal's remaining capacity (front-end guard;
    // the API enforces the same rule so it can't be bypassed).
    const remaining = remainingCapacity();
    if (formData.allocation_amount > remaining) {
      alert(
        `Allocation exceeds remaining deal capacity by $${(formData.allocation_amount - remaining).toLocaleString()}. ` +
        `Only $${remaining.toLocaleString()} is available on this deal.`
      );
      return;
    }

    setLoading(true);
    try {
      // Save allocation
      const termLengthMonths = formData.term_unit === 'years'
        ? formData.term_length * 12
        : formData.term_length;

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
          company_id: companyId,
          investor_id: formData.investor_id,
          investor_source: formData.investor_source,
          deal_id: formData.deal_id,
          allocation_amount: formData.allocation_amount,
          allocation_percentage: formData.allocation_percentage || 0,
          commit_date: formData.commit_date,
          expected_funding_date: formData.expected_funding_date,
          annual_rate: formData.annual_rate,
          term_length: termLengthMonths,
          payment_frequency: formData.payment_frequency,
          payment_start_date: formData.payment_start_date,
          funding_status: formData.funding_status,
          notes: formData.notes,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create allocation');
      }

      const allocationId = result.allocation?.id;

      // Upload documents if any
      if (uploadedFiles.length > 0 && allocationId && currentUser) {
        const uploadPromises = uploadedFiles.map((fileData) =>
          uploadDocument(
            fileData.file,
            allocationId,
            currentUser.id,
            formData.deal_id,
            formData.investor_id
          )
        );

        await Promise.all(uploadPromises);
      }

      // Close modal and reset
      onClose();
      setFormData({
        investor_id: '',
        investor_source: 'investors',
        deal_id: '',
        allocation_amount: 0,
        annual_rate: 0,
        term_length: 12,
        term_unit: 'months',
        payment_frequency: 'Monthly',
        commit_date: new Date().toISOString().split('T')[0],
        expected_funding_date: '',
        payment_start_date: '',
        funding_status: 'Pending',
        sponsor_id: '',
        notes: '',
      });
      setUploadedFiles([]);
      setSelectedInvestor(null);
      setSelectedDeal(null);
      setInvestorSearch('');
      setDealSearch('');
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Failed to save allocation');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    allocationId: string,
    userId: string,
    dealId: string,
    investorId: string
  ) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('companyId', companyId);
      uploadFormData.append('allocationId', allocationId);
      uploadFormData.append('userId', userId);
      uploadFormData.append('dealId', dealId || '');
      uploadFormData.append('investorId', investorId || '');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to upload document:', result.message);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-display font-normal text-stone-900">New Allocation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted  transition"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section - Form Fields */}
            <div className="lg:col-span-2 space-y-8">
              {/* Allocation Basics */}
              <div className="bg-muted  p-6">
                <h3 className="text-lg font-display font-normal text-stone-900 mb-4">
                  Allocation Basics
                </h3>
                <div className="space-y-4">
                  {/* Investor */}
                  <div className="relative">
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Investor <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search investors..."
                        value={investorSearch}
                        onChange={(e) => setInvestorSearch(e.target.value)}
                        onFocus={() => {
                          setShowInvestorDropdown(true);
                          setShowDealDropdown(false);
                        }}
                        className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                    {showInvestorDropdown && filteredInvestors.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border  shadow-lg z-20 max-h-48 overflow-y-auto">
                        {filteredInvestors.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => handleSelectInvestor(inv)}
                            className="w-full text-left px-4 py-2 hover:bg-muted transition"
                          >
                            <div className="font-medium text-foreground">{inv.full_name}{inv.investor_code ? ` — ${inv.investor_code}` : ''}</div>
                            <div className="text-xs text-muted-foreground">{inv.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deal */}
                  <div className="relative">
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Deal <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search deals..."
                        value={dealSearch}
                        onChange={(e) => setDealSearch(e.target.value)}
                        onFocus={() => {
                          setShowDealDropdown(true);
                          setShowInvestorDropdown(false);
                        }}
                        className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                    {selectedDeal && (
                      <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 text-sm">
                        <div className="font-medium text-stone-900 mb-1">{selectedDeal.name}</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                          <span>Deal Size</span>
                          <span className="text-right text-stone-900">{fmtMoney(Number(selectedDeal.target_amount || 0))}</span>
                          <span>Already Allocated</span>
                          <span className="text-right text-stone-900">{fmtMoney(Number(selectedDeal.raised_amount || 0))}</span>
                          <span>Remaining Before Allocation</span>
                          <span className="text-right text-stone-900">{fmtMoney(remainingCapacity())}</span>
                          {formData.allocation_amount > 0 && (
                            <>
                              <span>New Allocation</span>
                              <span className="text-right text-stone-900">{fmtMoney(formData.allocation_amount)}</span>
                              <span>Remaining After Allocation</span>
                              <span className={`text-right font-medium ${remainingCapacity() - formData.allocation_amount < 0 ? 'text-red-600' : 'text-stone-900'}`}>
                                {fmtMoney(remainingCapacity() - formData.allocation_amount)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {showDealDropdown && filteredDeals.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border  shadow-lg z-30 max-h-48 overflow-y-auto">
                        {filteredDeals.map((deal) => (
                          <button
                            key={deal.id}
                            type="button"
                            onClick={() => handleSelectDeal(deal)}
                            className="w-full text-left px-4 py-2 hover:bg-muted transition"
                          >
                            <div className="font-medium text-foreground">{deal.name}</div>
                            <div className="text-xs text-muted-foreground">{deal.type}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Allocation Amount */}
                  <div>
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Allocation Amount <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center">
                      <span className="text-foreground">$</span>
                      <input
                        type="number"
                        name="allocation_amount"
                        value={formData.allocation_amount || ''}
                        onChange={handleInputChange}
                        placeholder="8000000"
                        className="ml-2 flex-1 px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mt-2 text-sm flex items-center justify-between gap-2">
                      <div>
                        <div className="text-stone-900 font-medium">{calculateDealPercentage()} of deal</div>
                        <div className={remainingCapacity() - (formData.allocation_amount || 0) < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                          {selectedDeal ? fmtMoney(remainingCapacity() - (formData.allocation_amount || 0)) : '$0'} remaining after allocation
                        </div>
                      </div>
                      {selectedDeal && remainingCapacity() > 0 && formData.allocation_amount !== remainingCapacity() && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, allocation_amount: remainingCapacity() })}
                          className="shrink-0 text-xs px-3 py-1.5 border border-fundex-forest/30 text-fundex-forest hover:bg-fundex-forest/5 transition font-medium"
                        >
                          Allocate Remaining {fmtMoney(remainingCapacity())}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Commit Date and Expected Funding Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-normal text-stone-700 mb-1">
                        Commit Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="commit_date"
                        value={formData.commit_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-stone-700 mb-1">
                        Expected Funding Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="expected_funding_date"
                        value={formData.expected_funding_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms — rate/term/frequency are locked to the selected deal so
                  one allocation can't drift to different terms than its parent
                  deal. First Payout Date stays editable on purpose: an investor
                  can take over a position mid-deal and start on their own date. */}
              <div className="bg-muted  p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-normal text-stone-900">Terms</h3>
                  {selectedDeal && (
                    <span className="text-xs text-muted-foreground">Rate, term &amp; frequency come from the deal</span>
                  )}
                </div>
                <div className="space-y-4">
                  {/* Annual Rate and Term Length */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-normal text-stone-700 mb-1">
                        Annual Rate (%) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        name="annual_rate"
                        step="0.01"
                        value={formData.annual_rate || ''}
                        onChange={handleInputChange}
                        readOnly={!!selectedDeal}
                        placeholder={selectedDeal ? 'From deal' : '12.5'}
                        className={`w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedDeal ? 'bg-stone-100 text-stone-600 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-stone-700 mb-1">
                        Term Length <span className="text-red-600">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          name="term_length"
                          value={formData.term_length || ''}
                          onChange={handleInputChange}
                          readOnly={!!selectedDeal}
                          placeholder={selectedDeal ? 'From deal' : '12'}
                          className={`flex-1 px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedDeal ? 'bg-stone-100 text-stone-600 cursor-not-allowed' : ''}`}
                        />
                        <select
                          name="term_unit"
                          value={formData.term_unit}
                          onChange={handleInputChange}
                          disabled={!!selectedDeal}
                          className={`px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedDeal ? 'bg-stone-100 text-stone-600 cursor-not-allowed' : ''}`}
                        >
                          <option value="months">months</option>
                          <option value="years">years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment Frequency and Payment Start Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-normal text-stone-700 mb-1">
                        Payment Frequency <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="payment_frequency"
                        value={formData.payment_frequency}
                        onChange={handleInputChange}
                        disabled={!!selectedDeal}
                        className={`w-full px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedDeal ? 'bg-stone-100 text-stone-600 cursor-not-allowed' : ''}`}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Semi-Annual">Semi-Annual</option>
                        <option value="Annual">Annual</option>
                      </select>
                      {selectedDeal && selectedDeal.payout_cycle != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Deal pays on the {Number(selectedDeal.payout_cycle) === 15 ? '15th' : '1st'} of every month
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-normal text-stone-700 mb-1">
                        First Payout Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="payment_start_date"
                        value={formData.payment_start_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Editable per allocation — an investor joining mid-deal can start on their own date
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Details */}
              <div className="bg-muted  p-6">
                <h3 className="text-lg font-display font-normal text-stone-900 mb-4">Internal Details</h3>
                <div className="space-y-4">
                  {/* Funding Status */}
                  <div>
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Funding Status <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="funding_status"
                      value={formData.funding_status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Funded">Funded</option>
                      <option value="Pending">Pending</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>

                  {/* Sponsor */}
                  <div>
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Sponsor (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Search sponsors..."
                      className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add internal notes..."
                      rows={4}
                      className="w-full px-4 py-2 border border-border  focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Attach Documents */}
                  <div>
                    <label className="block text-sm font-normal text-stone-700 mb-1">
                      Attach Documents
                    </label>
                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed  p-6 text-center transition cursor-pointer ${
                        isDragActive
                          ? 'border-cyan-600 bg-cyan-50'
                          : 'border-border hover:border-gray-400'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Drag and drop files here, or{' '}
                        <span className="text-cyan-600 font-medium">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Upload supporting documents</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.jpeg"
                      />
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((fileData, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted  border border-border"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText size={18} className="text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {fileData.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 p-1 hover:bg-muted rounded transition flex-shrink-0"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Allocation Summary */}
            <div className="lg:col-span-1">
              <div className="bg-background border-2 border-border  p-6 sticky top-20">
                <h3 className="text-lg font-display font-normal text-stone-900 mb-6">Allocation Summary</h3>

                {/* Allocation Amount */}
                <div className="mb-6">
                  <p className="text-xs font-medium text-stone-400 uppercase">
                    Allocation Amount
                  </p>
                  <p className="text-3xl font-display font-normal text-stone-900 mt-2">
                    {fmtMoney(formData.allocation_amount)}
                  </p>
                </div>

                {/* % of Deal */}
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">% of Deal</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-display font-normal text-stone-900">
                      {calculateDealPercentage()}
                    </span>
                    {selectedDeal && (
                      <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                        {selectedDeal.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Monthly Interest */}
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-xs font-medium text-stone-400 uppercase">
                    Monthly Interest (Estimated)
                  </p>
                  <p className="text-2xl font-display font-normal text-stone-900 mt-2">
                    {fmtMoney(Number(calculateMonthlyInterest()))}
                  </p>
                </div>

                {/* Final review — everything the admin should confirm before
                    clicking Create Allocation, in one place. */}
                <div className="mb-6 pb-6 border-b border-border space-y-1.5 text-sm">
                  {[
                    ['Investor', selectedInvestor?.full_name ?? '—'],
                    ['Deal', selectedDeal?.name ?? '—'],
                    ['Deal Size', selectedDeal ? fmtMoney(Number(selectedDeal.target_amount || 0)) : '—'],
                    ['Already Allocated', selectedDeal ? fmtMoney(Number(selectedDeal.raised_amount || 0)) : '—'],
                    ['Remaining After', selectedDeal ? fmtMoney(remainingCapacity() - (formData.allocation_amount || 0)) : '—'],
                    ['Rate', formData.annual_rate ? `${formData.annual_rate}%` : '—'],
                    ['Payout Cycle', selectedDeal?.payout_cycle != null ? `${Number(selectedDeal.payout_cycle) === 15 ? '15th' : '1st'} of month` : '—'],
                    ['First Payout Date', formData.payment_start_date || '—'],
                    ['Maturity', maturityDate() ?? '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-stone-900 font-medium text-right truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="mb-6">
                  <p className="text-xs font-medium text-stone-400 uppercase mb-2">
                    Funding Status
                  </p>
                  <span
                    className={`inline-block px-3 py-1  text-xs font-semibold ${
                      formData.funding_status === 'Funded'
                        ? 'bg-fundex-gold/10 text-fundex-forest'
                        : formData.funding_status === 'Review'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {formData.funding_status}
                  </span>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200  p-3 text-xs text-blue-800 mb-6">
                  <p>
                    <strong>Note:</strong> Values update in real-time as you fill in the form.
                    Review the summary before creating the allocation.
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading || !selectedInvestor || !selectedDeal}
                    className="w-full bg-fundex-gold text-fundex-forest py-2 font-medium hover:bg-fundex-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Allocation'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-stone-100 text-stone-700 py-2 font-medium hover:bg-stone-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
