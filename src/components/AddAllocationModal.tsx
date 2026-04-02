'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search, Upload, FileText, Trash2 } from 'lucide-react';

interface Investor {
  id: string;
  full_name: string;
  email: string;
  initial_investment: number;
}

interface Deal {
  id: string;
  deal_id: string;
  name: string;
  target_amount: number;
  raised_amount: number;
  type: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  error?: string;
}

interface AllocationFormData {
  investor_id: string;
  deal_id: string;
  allocation_amount: number;
  allocation_percentage?: number;
  annual_rate: number;
  term_length: number;
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
}

export function AddAllocationModal({
  isOpen,
  onClose,
  onSave,
  companyId,
}: AddAllocationModalProps) {
  const [formData, setFormData] = useState<AllocationFormData>({
    investor_id: '',
    deal_id: '',
    allocation_amount: 0,
    annual_rate: 0,
    term_length: 12,
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
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  useEffect(() => {
    const filtered = investors.filter((inv) =>
      inv.full_name.toLowerCase().includes(investorSearch.toLowerCase()) ||
      inv.email.toLowerCase().includes(investorSearch.toLowerCase())
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
    try {
      // Fetch investors for the company
      const { data: investorData } = await supabase
        .from('investors')
        .select('id, full_name, email, initial_investment')
        .eq('company_id', companyId);

      // Fetch deals for the company
      const { data: dealData } = await supabase
        .from('deals')
        .select('id, deal_id, name, target_amount, raised_amount, type')
        .eq('company_id', companyId);

      setInvestors(investorData || []);
      setDeals(dealData || []);
    } catch (error) {
      console.error('Error loading investors and deals:', error);
    }
  };

  const handleSelectInvestor = (investor: Investor) => {
    setSelectedInvestor(investor);
    setFormData({ ...formData, investor_id: investor.id });
    setInvestorSearch(investor.full_name);
    setShowInvestorDropdown(false);
    setShowDealDropdown(false);
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({ ...formData, deal_id: deal.id });
    setDealSearch(deal.name);
    setShowDealDropdown(false);
    setShowInvestorDropdown(false);
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

    setLoading(true);
    try {
      // Save allocation
      const response = await fetch('/api/allocations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
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
        deal_id: '',
        allocation_amount: 0,
        annual_rate: 0,
        term_length: 12,
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">New Allocation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section - Form Fields */}
            <div className="lg:col-span-2 space-y-8">
              {/* Allocation Basics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Allocation Basics
                </h3>
                <div className="space-y-4">
                  {/* Investor */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                    </div>
                    {showInvestorDropdown && filteredInvestors.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {filteredInvestors.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => handleSelectInvestor(inv)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                          >
                            <div className="font-medium text-gray-900">{inv.full_name}</div>
                            <div className="text-xs text-gray-500">{inv.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deal */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                    </div>
                    {selectedDeal && (
                      <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                        <div className="font-semibold text-gray-900">{selectedDeal.name}</div>
                        <div className="text-sm text-gray-600">
                          ${(selectedDeal.raised_amount / 1000000).toFixed(2)}M raised of ${(selectedDeal.target_amount / 1000000).toFixed(2)}M
                        </div>
                      </div>
                    )}
                    {showDealDropdown && filteredDeals.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto">
                        {filteredDeals.map((deal) => (
                          <button
                            key={deal.id}
                            type="button"
                            onClick={() => handleSelectDeal(deal)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                          >
                            <div className="font-medium text-gray-900">{deal.name}</div>
                            <div className="text-xs text-gray-500">{deal.type}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Allocation Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Allocation Amount <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-900">$</span>
                      <input
                        type="number"
                        name="allocation_amount"
                        value={formData.allocation_amount || ''}
                        onChange={handleInputChange}
                        placeholder="8000000"
                        className="ml-2 flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="text-cyan-600 font-semibold">{calculateDealPercentage()} of deal</div>
                      <div className="text-gray-500">
                        ${selectedDeal ? ((selectedDeal.target_amount - (formData.allocation_amount || 0)) / 1000000).toFixed(2) : '0.00'} remaining
                      </div>
                    </div>
                  </div>

                  {/* Commit Date and Expected Funding Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Commit Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="commit_date"
                        value={formData.commit_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Expected Funding Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="expected_funding_date"
                        value={formData.expected_funding_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Terms</h3>
                <div className="space-y-4">
                  {/* Annual Rate and Term Length */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Annual Rate (%) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        name="annual_rate"
                        step="0.01"
                        value={formData.annual_rate || ''}
                        onChange={handleInputChange}
                        placeholder="12.5"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Term Length <span className="text-red-600">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          name="term_length"
                          value={formData.term_length || ''}
                          onChange={handleInputChange}
                          placeholder="12"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value="months"
                          disabled
                          className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        >
                          <option>months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment Frequency and Payment Start Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Payment Frequency <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="payment_frequency"
                        value={formData.payment_frequency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Semi-Annual">Semi-Annual</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Payment Start Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="payment_start_date"
                        value={formData.payment_start_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        First payout cycle begins from this date
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Internal Details</h3>
                <div className="space-y-4">
                  {/* Funding Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Funding Status <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="funding_status"
                      value={formData.funding_status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Funded">Funded</option>
                      <option value="Pending">Pending</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>

                  {/* Sponsor */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Sponsor (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Search sponsors..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add internal notes..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Attach Documents */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Attach Documents
                    </label>
                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
                        isDragActive
                          ? 'border-cyan-600 bg-cyan-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">
                        Drag and drop files here, or{' '}
                        <span className="text-cyan-600 font-medium">browse</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Upload supporting documents</p>
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
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText size={18} className="text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {fileData.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 p-1 hover:bg-gray-200 rounded transition flex-shrink-0"
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
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sticky top-20">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Allocation Summary</h3>

                {/* Allocation Amount */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Allocation Amount
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${(formData.allocation_amount / 1000000).toFixed(2)}M
                  </p>
                </div>

                {/* % of Deal */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">% of Deal</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-cyan-600">
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
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Monthly Interest (Estimated)
                  </p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    ${calculateMonthlyInterest()}
                  </p>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                    Status
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      formData.funding_status === 'Funded'
                        ? 'bg-green-100 text-green-800'
                        : formData.funding_status === 'Review'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {formData.funding_status}
                  </span>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mb-6">
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
                    className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Allocation'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
