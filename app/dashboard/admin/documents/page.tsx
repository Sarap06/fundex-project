'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/DashboardNav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Download, Eye, Plus, X, Filter, Search, Trash2, Upload, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserCompanyId, logOut } from '@/lib/auth';

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
    uploadedBy: '',
    notes: '',
    status: 'Draft',
    notifyInvestor: false,
    file: null as File | null,
  });

  // Fetch documents on component mount
  useEffect(() => {
    const loadData = async () => {
      const cId = await getCurrentUserCompanyId();
      setCompanyId(cId);
      fetchDocuments(cId);
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

  const handleTabChange = (tab: 'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast') => {
    if (tab === 'home') {
      router.push('/dashboard/admin');
    } else if (tab === 'investors') {
      router.push('/dashboard/admin/investors');
    } else if (tab === 'deals') {
      router.push('/dashboard/admin/deals');
    } else if (tab === 'allocations') {
      router.push('/dashboard/admin/allocations');
    } else if (tab === 'broadcast') {
      router.push('/dashboard/admin/broadcast');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Signed':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Archived':
        return 'bg-orange-100 text-orange-800';
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Deal Documents':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Investor Documents':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Reports':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Legal Documents':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${
      isExpanded ? 'ml-64' : 'ml-20'
    }`}>
      {/* Header */}
      <header className={`bg-green-600 fixed top-0 right-0 z-30 transition-all duration-300 border-b border-green-700 ${
        isExpanded ? 'left-64' : 'left-20'
      }`}>
        <div className="px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Documents</h1>
            <p className="text-xs text-green-100">Manage your document library</p>
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
        <DashboardNav activeTab="documents" onTabChange={handleTabChange} isExpanded={isExpanded} onExpandChange={setIsExpanded} />
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalDocuments}</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Deal Documents</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dealDocuments}</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Investor Documents</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{investorDocuments}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Reports</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{reports}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Upload */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  placeholder="Search documents by name, type, or category..."
                  className="pl-10 h-11 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-gray-300 hover:bg-gray-50"
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                >
                  <Filter className="size-4" />
                  Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>

                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-green-600 hover:bg-green-700">
                      <Plus className="size-4" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upload New Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDocument} className="space-y-6">
                      {/* File Upload */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm">File Upload</h3>
                        <div
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {formData.file ? formData.file.name : 'Drag and drop your file or click to browse'}
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
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
                        <h3 className="font-semibold text-sm">Document Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Document Name *</Label>
                            <Input
                              placeholder="e.g., Offering Memorandum"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Document Type *</Label>
                            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Offering">Offering</SelectItem>
                                <SelectItem value="Agreement">Agreement</SelectItem>
                                <SelectItem value="Appraisal">Appraisal</SelectItem>
                                <SelectItem value="Report">Report</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Category *</Label>
                            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Deal Documents">Deal Documents</SelectItem>
                                <SelectItem value="Investor Documents">Investor Documents</SelectItem>
                                <SelectItem value="Reports">Reports</SelectItem>
                                <SelectItem value="Legal Documents">Legal Documents</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Status and Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Status & Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                                <SelectItem value="Signed">Signed</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Uploaded By</Label>
                            <Input
                              placeholder="Your name"
                              value={formData.uploadedBy}
                              onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Additional Information</h3>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
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
                          <Label htmlFor="notify-investor" className="cursor-pointer">Notify investor when published</Label>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsUploadDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          Upload Document
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterPanelOpen && (
            <div ref={filterPanelRef} className="mb-6 p-5 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900">Filter Documents</h3>
                <button
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-5">
                {/* Category */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Category</h4>
                  <div className="space-y-2">
                    {['Deal Documents', 'Investor Documents', 'Reports', 'Legal Documents'].map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={filters.category.includes(cat)}
                          onCheckedChange={() => toggleCheckboxFilter('category', cat)}
                        />
                        <label htmlFor={`cat-${cat}`} className="text-sm text-gray-700 cursor-pointer">
                          {cat}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Status</h4>
                  <div className="space-y-2">
                    {['Draft', 'Published', 'Signed', 'Archived'].map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => toggleCheckboxFilter('status', status)}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm text-gray-700 cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Type</h4>
                  <div className="space-y-2">
                    {['Offering', 'Agreement', 'Appraisal', 'Report'].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.type.includes(type)}
                          onCheckedChange={() => toggleCheckboxFilter('type', type)}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm text-gray-700 cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-gray-200">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={handleApplyFilters} className="bg-green-600 hover:bg-green-700">
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* Documents Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Document ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Size</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Uploaded By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Upload Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.document_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={doc.name}>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-gray-400" />
                          {doc.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getCategoryColor(doc.category)}>
                          {doc.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.file_size}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.uploaded_by}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(doc.upload_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {doc.file_url && (
                            <>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="View document"
                              >
                                <Eye className="size-4" />
                              </a>
                              <a
                                href={doc.file_url}
                                download={doc.name}
                                className="text-green-600 hover:text-green-800"
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
                <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No documents found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
      </main>
    </div>
  );
}
