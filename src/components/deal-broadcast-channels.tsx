'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Send,
  FileText,
  Calendar,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Download,
  CheckCircle,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { BroadcastAcknowledgmentStatus } from './broadcast-acknowledgment-status';
import type { Deal, BroadcastUpdate, BroadcastCommunicationTimeline, BroadcastDocument } from '@/lib/types';

interface BroadcastChannelsProps {
  companyId: string;
  userRole?: string;
  userName?: string;
  userId?: string;
}

type ViewState = 'channels' | 'deal-detail' | 'send-update' | 'schedule-update' | 'linked-docs' | 'pending-actions';

export function BroadcastChannels({ companyId, userRole, userName, userId }: BroadcastChannelsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for channels view
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'deals' | 'inbox'>('deals');

  // State for deal detail view
  const [dealUpdates, setDealUpdates] = useState<BroadcastUpdate[]>([]);
  const [timeline, setTimeline] = useState<BroadcastCommunicationTimeline[]>([]);
  const [documents, setDocuments] = useState<BroadcastDocument[]>([]);

  // State for send update form
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(false);
  const [sending, setSending] = useState(false);

  // State for schedule update form
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduledFile, setScheduledFile] = useState<File | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (currentView === 'channels') {
      loadDeals();
    }
  }, [currentView, companyId]);

  useEffect(() => {
    if (currentView === 'deal-detail' && selectedDeal) {
      loadDealDetails(selectedDeal.id);
    }
  }, [currentView, selectedDeal]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/broadcasts/deals?companyId=${companyId}`);
      const data = await response.json();

      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deal channels');
    } finally {
      setLoading(false);
    }
  };

  const loadDealDetails = async (dealId: string) => {
    try {
      setLoading(true);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token 
        ? { 'Authorization': `Bearer ${session.access_token}` }
        : {};

      // Load deal updates
      const updatesResponse = await fetch(`/api/broadcasts/deals/${dealId}`, { headers });
      const updatesData = await updatesResponse.json();
      setDealUpdates(updatesData.updates || []);

      // Load documents
      const docsResponse = await fetch(`/api/broadcasts/deals/${dealId}/documents`, { headers });
      const docsData = await docsResponse.json();
      setDocuments(docsData.documents || []);

      // Load timeline
      const timelineResponse = await fetch(`/api/broadcasts/deals/${dealId}/timeline`, { headers });
      const timelineData = await timelineResponse.json();
      console.log('Timeline data loaded:', timelineData);
      if (timelineData.error) {
        console.error('Timeline API error:', timelineData.error);
      }
      setTimeline(timelineData.timeline || []);
    } catch (err) {
      console.error('Error loading deal details:', err);
      setError('Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updateTitle.trim() || !updateMessage.trim()) {
      setError('Please fill in title and message');
      return;
    }

    if (!selectedDeal) {
      setError('No deal selected');
      return;
    }

    try {
      setSending(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You are not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('title', updateTitle);
      formData.append('message', updateMessage);
      formData.append('requireAcknowledgment', requireAcknowledgment.toString());
      if (updateFile) {
        formData.append('file', updateFile);
      }

      const response = await fetch(`/api/broadcasts/deals/${selectedDeal.id}/send-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Update sent to ${data.recipientCount} investors!`);
        setUpdateTitle('');
        setUpdateMessage('');
        setUpdateFile(null);
        setRequireAcknowledgment(false);
        setCurrentView('deal-detail');
        setTimeout(() => setSuccessMessage(''), 3000);
        if (selectedDeal) {
          loadDealDetails(selectedDeal.id);
        }
      } else {
        setError(data.error || 'Failed to send update');
      }
    } catch (err) {
      console.error('Error sending update:', err);
      setError('An error occurred while sending update');
    } finally {
      setSending(false);
    }
  };

  const handleScheduleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updateTitle.trim() || !updateMessage.trim() || !scheduleDate || !scheduleTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (!selectedDeal) {
      setError('No deal selected');
      return;
    }

    try {
      setScheduling(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You are not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('title', updateTitle);
      formData.append('message', updateMessage);
      formData.append('scheduledDate', scheduleDate);
      formData.append('scheduledEstTime', scheduleTime);
      formData.append('requireAcknowledgment', requireAcknowledgment.toString());
      if (scheduledFile) {
        formData.append('file', scheduledFile);
      }

      const response = await fetch(`/api/broadcasts/deals/${selectedDeal.id}/schedule-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Update scheduled successfully!');
        setUpdateTitle('');
        setUpdateMessage('');
        setScheduleDate('');
        setScheduleTime('');
        setScheduledFile(null);
        setRequireAcknowledgment(false);
        setCurrentView('deal-detail');
        setTimeout(() => setSuccessMessage(''), 3000);
        if (selectedDeal) {
          loadDealDetails(selectedDeal.id);
        }
      } else {
        setError(data.error || 'Failed to schedule update');
      }
    } catch (err) {
      console.error('Error scheduling update:', err);
      setError('An error occurred while scheduling update');
    } finally {
      setScheduling(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isSchedule: boolean = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      if (isSchedule) {
        setScheduledFile(selectedFile);
      } else {
        setUpdateFile(selectedFile);
      }
      setError('');
    }
  };

  const handleGoBack = () => {
    if (currentView === 'deal-detail') {
      setCurrentView('channels');
      setSelectedDeal(null);
    } else if (['send-update', 'schedule-update', 'linked-docs', 'pending-actions'].includes(currentView)) {
      setCurrentView('deal-detail');
    }
  };

  const renderChannelsView = () => {
    // Filter deals based on search query
    const filteredDeals = deals.filter((deal) =>
      deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.deal_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-0">
        {/* Header Section */}
        <div className="pb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-display font-semibold text-stone-900">Deal Communications</h1>
              <p className="text-sm text-stone-500 mt-1">Official updates from your active deals.</p>
            </div>
            <button className="px-4 py-2 bg-white border border-stone-100 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-50 transition">
              Manage Communications
            </button>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center gap-2 border-b border-stone-100 -mb-px">
            <button
              onClick={() => {
                setActiveTab('deals');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                activeTab === 'deals'
                  ? 'text-stone-900 border-b-2 border-fundex-gold'
                  : 'text-stone-400 hover:bg-stone-50'
              }`}
            >
              Deal Channels
            </button>
            <button
              onClick={() => {
                setActiveTab('inbox');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                activeTab === 'inbox'
                  ? 'text-stone-900 border-b-2 border-fundex-gold'
                  : 'text-stone-400 hover:bg-stone-50'
              }`}
            >
              Investor Inbox
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="py-4 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-stone-500" size={18} />
            <input
              type="text"
              placeholder="Search deals or updates"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-100 rounded-lg bg-stone-50 focus:outline-none focus:bg-white focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {activeTab === 'deals' ? (
          <div className="space-y-3 pt-6">
            {filteredDeals.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100">
                <AlertCircle className="mx-auto text-stone-500 mb-2" size={40} />
                <p className="text-stone-500">
                  {searchQuery ? 'No deals match your search' : 'No deal channels available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => {
                      setSelectedDeal(deal);
                      setCurrentView('deal-detail');
                    }}
                    className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-2xl hover:shadow-md hover:border-fundex-gold/20 cursor-pointer transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-fundex-gold/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-fundex-forest">
                            {deal.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{deal.name}</p>
                          <p className="text-sm text-stone-500">
                            {deal.location} • {deal.investor_count} investors
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-stone-500" size={20} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-6">
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100">
              <AlertCircle className="mx-auto text-stone-500 mb-2" size={40} />
              <p className="text-stone-500">Investor inbox coming soon</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDealDetailView = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-stone-50 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-stone-500" />
        </button>
        <div>
          <h1 className="text-3xl font-display font-semibold text-stone-900">{selectedDeal?.name}</h1>
          <p className="text-stone-500">{selectedDeal?.location}</p>
        </div>
      </div>

      {/* Four Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setCurrentView('send-update')}
          className="px-6 py-2 bg-fundex-forest text-white font-medium rounded-lg hover:bg-fundex-forest/90 transition flex items-center gap-2"
        >
          <Send size={18} />
          Send Update
        </button>

        <button
          onClick={() => setCurrentView('linked-docs')}
          className="px-4 py-2 bg-white border border-stone-100 text-stone-900 font-medium rounded-lg hover:bg-stone-50 transition flex items-center gap-2"
        >
          <FileText size={18} />
          Linked Docs
        </button>

        <button
          onClick={() => setCurrentView('schedule-update')}
          className="px-4 py-2 bg-white border border-stone-100 text-stone-900 font-medium rounded-lg hover:bg-stone-50 transition flex items-center gap-2"
        >
          <Calendar size={18} />
          Schedule
        </button>

        <button
          disabled
          className="px-4 py-2 bg-white border border-stone-100 text-stone-500 font-medium rounded-lg cursor-not-allowed opacity-50 flex items-center gap-2"
        >
          <AlertCircle size={18} />
          Pending Actions
        </button>
      </div>

      {/* Deal Details Card */}
      <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Header with Title and Status */}
          <div className="border-b border-stone-100 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-stone-900">Latest Deal Update</h2>
              <p className="text-xs text-stone-500 mt-1">{selectedDeal?.name}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                selectedDeal?.status === 'Active'
                  ? 'bg-fundex-gold/10 text-fundex-forest'
                  : selectedDeal?.status === 'Closed'
                    ? 'bg-stone-50 text-stone-900'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {selectedDeal?.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          {/* Compact Key Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-fundex-cream/30 rounded-2xl">
            <div>
              <p className="text-xs text-fundex-forest font-semibold uppercase mb-1">Target Amount</p>
              <p className="text-sm font-semibold text-stone-900">
                ${Number(selectedDeal?.target_amount || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-fundex-forest font-semibold uppercase mb-1">Raised Amount</p>
              <p className="text-sm font-semibold text-fundex-forest">
                ${Number(selectedDeal?.raised_amount || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-fundex-forest font-semibold uppercase mb-1">Investors</p>
              <p className="text-sm font-semibold text-stone-600">{selectedDeal?.investor_count || 0}</p>
            </div>
            <div>
              <p className="text-xs text-fundex-forest font-semibold uppercase mb-1">Progress</p>
              <p className="text-sm font-semibold text-stone-900">{selectedDeal?.progress || 0}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-stone-50 rounded-full h-2">
              <div
                className="bg-fundex-forest h-2 rounded-full transition-all"
                style={{
                  width: `${selectedDeal?.progress || 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Additional Details - 2 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase mb-1">Type</p>
                <p className="font-medium text-stone-900">{selectedDeal?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase mb-1">Close Date</p>
                <p className="font-medium text-stone-900">
                  {selectedDeal?.close_date
                    ? new Date(selectedDeal.close_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase mb-1">Interest Rate</p>
                <p className="font-medium text-stone-900">
                  {selectedDeal?.interest_rate ? `${selectedDeal.interest_rate}%` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase mb-1">Location</p>
                <p className="font-medium text-stone-900">{selectedDeal?.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase mb-1">Term</p>
                <p className="font-medium text-stone-900">{selectedDeal?.term || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 font-semibold uppercase mb-1">Borrower</p>
                <p className="font-medium text-stone-900">{selectedDeal?.borrower_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgment Status */}
      <BroadcastAcknowledgmentStatus
        dealId={selectedDeal?.id || ''}
      />

      {/* Timeline */}
      <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-display font-semibold text-stone-900 mb-4">Communication Timeline</h3>
          {timeline.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-100">
              <Clock className="mx-auto text-stone-500 mb-2" size={32} />
              <p className="text-stone-500">No communications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="flex gap-4 pb-4 border-l-2 border-fundex-gold/20 pl-4">
                  <div className="mt-2 w-3 h-3 bg-fundex-forest rounded-full -ml-6"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-stone-900">{event.title}</p>
                    <p className="text-sm text-stone-500">{event.description}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {event.triggered_by_name} • {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSendUpdateView = () => (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-display font-semibold text-stone-900">Send Investor Update</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Broadcast to all {selectedDeal?.investor_count || 0} investors
            </p>
          </div>
          <button
            onClick={handleGoBack}
            className="p-1 hover:bg-stone-50 rounded-lg transition"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSendUpdate} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-fundex-gold/10 border border-fundex-gold/20 rounded-lg text-fundex-forest text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1.5">Update Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g., Q1 2025 Performance Update"
              className="w-full px-3 py-2 text-sm border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1.5">Message Body <span className="text-red-500">*</span></label>
            <textarea
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="Write your message to investors..."
              rows={5}
              className="w-full px-3 py-2 text-sm border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundex-gold/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">Document Attachments</label>
            <label className="flex flex-col items-center justify-center w-full px-4 py-5 border-2 border-dashed border-stone-100 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-stone-50 transition">
              <div className="flex flex-col items-center justify-center">
                <Upload size={32} className="text-stone-500 mb-1" />
                <p className="text-xs font-medium text-stone-900">Click to upload documents</p>
                <p className="text-xs text-stone-500">PDF, DOC, XLS up to 10MB</p>
              </div>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, false)}
                className="hidden"
              />
            </label>
            {updateFile && (
              <p className="text-xs text-fundex-forest mt-1.5 flex items-center gap-1">
                <CheckCircle size={14} /> {updateFile.name}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requireAcknowledgment}
              onChange={(e) => setRequireAcknowledgment(e.target.checked)}
              className="w-4 h-4 border border-stone-100 rounded-md"
            />
            <span className="text-sm text-stone-500">Require investor acknowledgment</span>
          </label>
        </form>

        {/* Footer */}
        <div className="border-t border-stone-100 p-5 bg-stone-50 flex-shrink-0">
          <p className="text-xs text-stone-500 mb-3">
            <span className="font-semibold text-stone-900">{selectedDeal?.investor_count || 0} investors</span> will receive this update
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex-1 px-3 py-2 text-sm border border-stone-100 rounded-lg text-stone-900 font-medium hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendUpdate}
              disabled={sending}
              className="flex-1 px-3 py-2 text-sm bg-fundex-forest text-white rounded-lg font-medium hover:bg-fundex-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sending ? 'Sending...' : 'Send Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduleUpdateView = () => (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-display font-semibold text-stone-900">Schedule Future Update</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Plan an investor communication in advance
            </p>
          </div>
          <button
            onClick={handleGoBack}
            className="p-1 hover:bg-stone-50 rounded-lg transition"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleScheduleUpdate} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-fundex-gold/10 border border-fundex-gold/20 rounded-lg text-fundex-forest text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1.5">Update Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g., Monthly Distribution Notice"
              className="w-full px-3 py-2 text-sm border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1.5">Message Body <span className="text-red-500">*</span></label>
            <textarea
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="Write your scheduled message..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundex-gold/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-1.5">Send Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="w-full px-3 py-2 text-sm border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-1.5">Send Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                placeholder="--:--"
                className="w-full px-3 py-2 text-sm border border-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
              />
            </div>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-stone-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-stone-900">Timezone: Eastern Time (ET)</p>
                <p className="text-xs text-stone-600 mt-1">
                  The update will be sent to all investors at the scheduled time in your organization's timezone.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-stone-100 p-5 bg-stone-50 flex-shrink-0">
          <p className="text-xs text-stone-500 mb-3">
            Updates can be edited or cancelled before the scheduled time
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex-1 px-3 py-2 text-sm border border-stone-100 rounded-lg text-stone-900 font-medium hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleUpdate}
              disabled={scheduling}
              className="flex-1 px-3 py-2 text-sm bg-fundex-forest text-white rounded-lg font-medium hover:bg-fundex-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              {scheduling ? 'Scheduling...' : 'Schedule Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLinkedDocsView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-stone-50 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-stone-500" />
        </button>
        <h1 className="text-3xl font-display font-semibold text-stone-900">Linked Documents</h1>
      </div>

      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100">
            <FileText className="mx-auto text-stone-500 mb-2" size={40} />
            <p className="text-stone-500">No documents linked to this deal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-2xl hover:shadow-md hover:border-stone-300 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-stone-600" size={24} />
                  <div>
                    <p className="font-semibold text-stone-900">{doc.name}</p>
                    <p className="text-sm text-stone-500">
                      {doc.category} • {doc.file_size}
                    </p>
                  </div>
                </div>
                <Download className="text-stone-500 hover:text-stone-600 transition" size={20} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading && currentView === 'channels') {
    return (
      <div className="text-center py-8">
        <Clock className="animate-spin mx-auto text-stone-500 mb-3" size={32} />
        <p className="text-stone-500">Loading broadcast channels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {currentView === 'channels' && renderChannelsView()}
      {currentView === 'deal-detail' && renderDealDetailView()}
      {currentView === 'send-update' && renderSendUpdateView()}
      {currentView === 'schedule-update' && renderScheduleUpdateView()}
      {currentView === 'linked-docs' && renderLinkedDocsView()}
    </div>
  );
}
