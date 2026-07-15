'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Eye, Plus, X, Filter, Search, Trash2, Upload, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserCompanyId, logOut } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';
import { DOCUMENT_TYPES, DOCUMENT_CATEGORIES, DOCUMENT_STATUSES, DOCUMENT_ACCEPT_EXTENSIONS } from '@/config/documents';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Document {
  id: string;
  document_id: string;
  name: string;
  type: string;
  category: string;
  file_url: string;
  file_size: string;
  file_type: string;
  uploaded_by: string;
  upload_date: string;
  status: string;
  notify_investor: boolean;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Filters {
  category: string[];
  status: string[];
  type: string[];
  uploadedBy: string;
  dateRange: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<Filters>({
    category: [],
    status: [],
    type: [],
    uploadedBy: '',
    dateRange: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'Offering',
    category: 'Deal Documents',
    dealId: '',
    investorId: '',
    uploadedBy: '',
    notes: '',
    status: 'Draft',
    notifyInvestor: false,
    file: null as File | null,
  });
  const [dealOptions, setDealOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [investorOptions, setInvestorOptions] = useState<Array<{ id: string; full_name: string; investor_id: string }>>([]);

  // Fetch documents on component mount
  useEffect(() => {
    const loadData = async () => {
      const cId = await getCurrentUserCompanyId();
      setCompanyId(cId);
      await fetchDocuments(cId);
      if (cId) {
        const [{ data: dealsData }, { data: investorsData }] = await Promise.all([
          supabase.from('deals').select('id, name').eq('company_id', cId).order('name'),
          supabase.from('investors').select('id, full_name, investor_id').eq('company_id', cId).order('full_name'),
        ]);
        setDealOptions(dealsData || []);
        setInvestorOptions(investorsData || []);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Filter documents when search or filters change
  useEffect(() => {
    applyFilters();
  }, [documents, searchTerm, filters]);

  const fetchDocuments = async (cId: string | null) => {
    let query = supabase
      .from('documents')
      .select('*');

    // Filter by company_id if available
    if (cId) {
      query = query.eq('company_id', cId);
    }

    const { data, error } = await query.order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const applyFilters = () => {
    let filtered = documents.filter(doc => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          doc.name.toLowerCase().includes(term) ||
          doc.document_id.toLowerCase().includes(term) ||
          doc.type.toLowerCase().includes(term) ||
          doc.category.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category.length > 0 && !filters.category.includes(doc.category)) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(doc.status)) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(doc.type)) {
        return false;
      }

      // Uploaded by filter
      if (filters.uploadedBy && doc.uploaded_by !== filters.uploadedBy) {
        return false;
      }

      return true;
    });

    setFilteredDocuments(filtered);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Document name is required');
      return;
    }

    if (!formData.file) {
      alert('Please select a file to upload');
      return;
    }

    if (!companyId) {
      alert('Unable to determine company. Please refresh the page.');
      return;
    }

    try {
      // Generate document ID
      const docId = `DOC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Upload file to Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${docId}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert('Failed to upload file to storage');
        return;
      }

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Insert document record in database
      const { error: dbError } = await supabase.from('documents').insert([{
        company_id: companyId,
        document_id: docId,
        name: formData.name,
        type: formData.type,
        category: formData.category,
        deal_id: formData.dealId || null,
        investor_id: formData.investorId || null,
        upload_date: new Date().toISOString(),
        uploaded_by: formData.uploadedBy || 'Admin',
        status: formData.status,
        file_size: `${(formData.file.size / 1024 / 1024).toFixed(2)} MB`,
        file_type: formData.file.type,
        file_url: fileUrl,
        notes: formData.notes,
        notify_investor: formData.notifyInvestor,
        tags: [formData.type, formData.category, formData.status],
      }]);

      if (dbError) {
        console.error('Error creating document record:', dbError);
        alert('File uploaded but failed to save document record');
        return;
      }

      setFormData({
        name: '',
        type: 'Offering',
        category: 'Deal Documents',
        dealId: '',
        investorId: '',
        uploadedBy: '',
        notes: '',
        status: 'Draft',
        notifyInvestor: false,
        file: null,
      });
      setIsUploadDialogOpen(false);
      fetchDocuments(companyId);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const { error } = await supabase.from('documents').delete().eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
      return;
    }

    fetchDocuments(companyId);
  };

  const toggleCheckboxFilter = (category: 'category' | 'status' | 'type', value: string) => {
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
    count += filters.category.length;
    count += filters.status.length;
    count += filters.type.length;
    if (filters.uploadedBy) count++;
    if (filters.dateRange) count++;
    setActiveFilterCount(count);
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      category: [],
      status: [],
      type: [],
      uploadedBy: '',
      dateRange: '',
    });
    setActiveFilterCount(0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'fdx-badge fdx-badge-active';
      case 'Signed':
        return 'fdx-badge fdx-badge-info';
      case 'Draft':
        return 'fdx-badge fdx-badge-pending';
      case 'Archived':
        return 'fdx-badge border-stone-200 bg-stone-50 text-stone-500';
      case 'Pending Review':
        return 'fdx-badge fdx-badge-pending';
      default:
        return 'fdx-badge border-stone-200 bg-stone-50 text-stone-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Deal Documents':
        return 'fdx-badge fdx-badge-info';
      case 'Investor Documents':
        return 'fdx-badge fdx-badge-role';
      case 'Reports':
        return 'fdx-badge border-stone-200 bg-stone-50 text-stone-600';
      case 'Legal Documents':
        return 'fdx-badge fdx-badge-danger';
      default:
        return 'fdx-badge border-stone-200 bg-stone-50 text-stone-500';
    }
  };

  const totalDocuments = documents.length;
  const dealDocuments = documents.filter(d => d.category === 'Deal Documents').length;
  const investorDocuments = documents.filter(d => d.category === 'Investor Documents').length;
  const reports = documents.filter(d => d.category === 'Reports').length;

  const handleLogOut = async () => {
    await logOut();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 " />
          ))}
        </div>
        <Skeleton className="h-11 w-full mb-6 " />
        <Skeleton className="h-64 w-full " />
      </div>
    );
  }

  return (
    <div>
      <StaggerContainer>
        <StaggerItem>
          <PageHeader title="Documents" subtitle="Manage document library and distribution" />
        </StaggerItem>

        {/* KPI Cards */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 mb-6">
            <div className="fdx-card p-5">
              <div className="fdx-card-glow" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total Documents</p>
              <p className="text-3xl font-semibold text-stone-900 mt-2">{totalDocuments}</p>
            </div>

            <div className="fdx-card p-5">
              <div className="fdx-card-glow" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Deal Documents</p>
              <p className="text-3xl font-semibold text-stone-900 mt-2">{dealDocuments}</p>
            </div>

            <div className="fdx-card p-5">
              <div className="fdx-card-glow" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Investor Documents</p>
              <p className="text-3xl font-semibold text-stone-900 mt-2">{investorDocuments}</p>
            </div>

            <div className="fdx-card p-5">
              <div className="fdx-card-glow" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Reports</p>
              <p className="text-3xl font-semibold text-stone-900 mt-2">{reports}</p>
            </div>
          </div>
        </StaggerItem>

        {/* Search and Upload */}
        <StaggerItem>
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-stone-500" />
                <input
                  placeholder="Search documents by name, type, or category..."
                  className="fdx-input pl-10 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="fdx-btn-secondary gap-2"
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                >
                  <Filter className="size-4" />
                  Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>

                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="fdx-btn-primary gap-2">
                      <Plus className="size-4" />
                      Upload Document
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto fdx-card border-stone-100">
                    <DialogHeader>
                      <DialogTitle className="text-stone-900">Upload New Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDocument} className="space-y-6">
                      {/* File Upload */}
                      <div className="space-y-4">
                        <h3 className="fdx-section-title text-sm">File Upload</h3>
                        <div
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed  p-8 text-center cursor-pointer transition-colors ${
                            dragActive ? 'border-fundex-gold bg-fundex-gold/5' : 'border-stone-100'
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="size-8 text-stone-500 mx-auto mb-2" />
                          <p className="text-sm text-stone-500">
                            {formData.file ? formData.file.name : 'Drag and drop your file or click to browse'}
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept={DOCUMENT_ACCEPT_EXTENSIONS}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setFormData({ ...formData, file: e.target.files[0] });
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Document Information */}
                      <div className="space-y-4">
                        <h3 className="fdx-section-title text-sm">Document Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label className="text-stone-900">Document Name *</Label>
                            <input
                              className="fdx-input mt-1"
                              placeholder="e.g., Offering Memorandum"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-stone-900">Document Type *</Label>
                            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-stone-900">Category *</Label>
                            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-stone-900">Related Deal</Label>
                            <Select value={formData.dealId || 'none'} onValueChange={(value) => setFormData({ ...formData, dealId: value === 'none' ? '' : value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {dealOptions.map((deal) => (
                                  <SelectItem key={deal.id} value={deal.id}>{deal.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-stone-900">Related Investor</Label>
                            <Select value={formData.investorId || 'none'} onValueChange={(value) => setFormData({ ...formData, investorId: value === 'none' ? '' : value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {investorOptions.map((inv) => (
                                  <SelectItem key={inv.id} value={inv.id}>{inv.full_name}{inv.investor_id ? ` — ${inv.investor_id}` : ''}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Status and Details */}
                      <div className="space-y-4">
                        <h3 className="fdx-section-title text-sm">Status & Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-stone-900">Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-stone-900">Uploaded By</Label>
                            <input
                              className="fdx-input mt-1"
                              placeholder="Your name"
                              value={formData.uploadedBy}
                              onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="space-y-4">
                        <h3 className="fdx-section-title text-sm">Additional Information</h3>
                        <div>
                          <Label className="text-stone-900">Notes</Label>
                          <Textarea
                            className="mt-1 border-stone-200 focus:border-fundex-gold focus:ring-fundex-gold/30"
                            placeholder="Add any notes or details about this document..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="notify-investor"
                            checked={formData.notifyInvestor}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyInvestor: checked as boolean })}
                          />
                          <Label htmlFor="notify-investor" className="cursor-pointer text-stone-900">Notify investor when published</Label>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          className="fdx-btn-secondary"
                          onClick={() => setIsUploadDialogOpen(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="fdx-btn-primary">
                          Upload Document
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Filter Panel */}
        {isFilterPanelOpen && (
          <StaggerItem>
            <div ref={filterPanelRef} className="fdx-card mb-6 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="fdx-section-title">Filter Documents</h3>
                <button
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="text-stone-500 hover:text-stone-700"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-5">
                {/* Category */}
                <div>
                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Category</h4>
                  <div className="space-y-2">
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={filters.category.includes(cat)}
                          onCheckedChange={() => toggleCheckboxFilter('category', cat)}
                        />
                        <label htmlFor={`cat-${cat}`} className="text-sm text-stone-500 cursor-pointer">
                          {cat}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Status</h4>
                  <div className="space-y-2">
                    {DOCUMENT_STATUSES.map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => toggleCheckboxFilter('status', status)}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm text-stone-500 cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Type</h4>
                  <div className="space-y-2">
                    {DOCUMENT_TYPES.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.type.includes(type)}
                          onCheckedChange={() => toggleCheckboxFilter('type', type)}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm text-stone-500 cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-stone-100">
                <button className="fdx-btn-secondary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
                <button onClick={handleApplyFilters} className="fdx-btn-primary">
                  Apply Filters
                </button>
              </div>
            </div>
          </StaggerItem>
        )}

        {/* Documents Table */}
        <StaggerItem>
          <div className="fdx-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="fdx-table-header">Document ID</th>
                    <th className="fdx-table-header">Name</th>
                    <th className="fdx-table-header">Category</th>
                    <th className="fdx-table-header">Type</th>
                    <th className="fdx-table-header">Status</th>
                    <th className="fdx-table-header">Size</th>
                    <th className="fdx-table-header">Uploaded By</th>
                    <th className="fdx-table-header">Upload Date</th>
                    <th className="fdx-table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="fdx-table-row">
                      <td className="px-4 py-3 text-sm font-normal text-stone-900">{doc.document_id}</td>
                      <td className="px-4 py-3 text-sm text-stone-900 max-w-xs truncate" title={doc.name}>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-stone-500" />
                          {doc.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getCategoryColor(doc.category)}>
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500">{doc.type}</td>
                      <td className="px-4 py-3">
                        <span className={getStatusColor(doc.status)}>{doc.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500">{doc.file_size}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">{doc.uploaded_by}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {new Date(doc.upload_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {doc.file_url && (
                            <>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fundex-forest hover:text-fundex-green"
                                title="View document"
                              >
                                <Eye className="size-4" />
                              </a>
                              <a
                                href={doc.file_url}
                                download={doc.name}
                                className="text-stone-500 hover:text-stone-700"
                                title="Download document"
                              >
                                <Download className="size-4" />
                              </a>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete document"
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

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="size-12 text-stone-500 mx-auto mb-4" />
                <p className="text-stone-500 mb-2">No documents found</p>
                <p className="text-sm text-stone-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
