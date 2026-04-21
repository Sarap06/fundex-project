'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  MessageCircle,
} from 'lucide-react';

// ── Admin Inbox (WhatsApp-style 1-to-1 threads) ────────────────────────────

interface InboxThread {
  investorId: string;
  investorSource: string;
  investorName: string;
  latestMessage: { content: string; sender_role: string; created_at: string } | null;
  unreadCount: number;
  deals: Array<{ id: string; name: string }>;
}

interface InboxMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  sender_name: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

function AdminInboxPanel({ companyId, currentUserId }: { companyId: string; currentUserId: string }) {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const loadThreads = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/inbox', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      setThreads(json.threads ?? []);
    } catch (e) {
      console.error('[AdminInbox] loadThreads', e);
    } finally {
      setLoadingThreads(false);
    }
  }, [getToken]);

  const loadMessages = useCallback(async (investorId: string) => {
    const token = await getToken();
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/inbox/${investorId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages ?? []);
      // Mark thread as read locally
      setThreads(prev => prev.map(t => t.investorId === investorId ? { ...t, unreadCount: 0 } : t));
    } catch (e) {
      console.error('[AdminInbox] loadMessages', e);
    } finally {
      setLoadingMessages(false);
    }
  }, [getToken]);

  // Poll for new messages every 10s when a thread is selected
  useEffect(() => {
    loadThreads();
    const pollThreads = setInterval(loadThreads, 10000);
    return () => clearInterval(pollThreads);
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedThread) return;
    const poll = setInterval(() => loadMessages(selectedThread.investorId), 10000);
    return () => clearInterval(poll);
  }, [selectedThread, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectThread = (thread: InboxThread) => {
    setSelectedThread(thread);
    loadMessages(thread.investorId);
  };

  const handleSend = async () => {
    if (!text.trim() || sending || !selectedThread) return;
    const token = await getToken();
    if (!token) return;
    setSending(true);
    const optimistic: InboxMessage = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      sender_role: 'admin',
      sender_name: null,
      content: text.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    try {
      const res = await fetch(`/api/inbox/${selectedThread.investorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: optimistic.content }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(prev => prev.map(m => m.id === optimistic.id ? json.message : m));
        // Refresh thread list to update latest message
        loadThreads();
      }
    } catch (e) {
      console.error('[AdminInbox] send error', e);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = threads.filter(t =>
    t.investorName.toLowerCase().includes(threadSearch.toLowerCase())
  );

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  if (loadingThreads) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border border-stone-100 mt-4">
      {/* Thread list */}
      <div className={`flex flex-col border-r border-stone-100 ${selectedThread ? 'hidden md:flex w-72' : 'flex w-full md:w-72'}`}>
        <div className="p-3 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-stone-400" size={14} />
            <input
              placeholder="Search investors..."
              value={threadSearch}
              onChange={e => setThreadSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-100 bg-stone-50 focus:outline-none focus:bg-white focus:border-fundex-gold/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm gap-2 py-12">
              <MessageCircle size={28} className="text-stone-300" />
              <p>{threads.length === 0 ? 'No conversations yet' : 'No results'}</p>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <button
                key={thread.investorId}
                onClick={() => handleSelectThread(thread)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition border-b border-stone-50 ${selectedThread?.investorId === thread.investorId ? 'bg-fundex-gold/5 border-l-2 border-l-fundex-gold' : ''}`}
              >
                <div className="size-9 shrink-0 flex items-center justify-center bg-fundex-gold/20 text-fundex-forest text-xs font-semibold">
                  {getInitials(thread.investorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-stone-900 truncate">{thread.investorName}</p>
                    {thread.latestMessage && (
                      <span className="text-[10px] text-stone-400 shrink-0 ml-2">{fmtTime(thread.latestMessage.created_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 truncate mt-0.5">
                    {thread.latestMessage
                      ? `${thread.latestMessage.sender_role === 'investor' ? '' : 'You: '}${thread.latestMessage.content}`
                      : 'No messages yet'}
                  </p>
                  {thread.deals && thread.deals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {thread.deals.slice(0, 2).map(d => (
                        <span key={d.id} className="text-[9px] px-1.5 py-0.5 bg-fundex-gold/10 text-fundex-forest font-medium truncate max-w-[80px]">
                          {d.name}
                        </span>
                      ))}
                      {thread.deals.length > 2 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-400">+{thread.deals.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                {thread.unreadCount > 0 && (
                  <span className="shrink-0 size-4 bg-fundex-forest text-white text-[10px] font-bold  flex items-center justify-center">
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      {selectedThread ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white">
            <button
              onClick={() => setSelectedThread(null)}
              className="md:hidden p-1 text-stone-400 hover:text-stone-600"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="size-8 flex items-center justify-center bg-fundex-gold/20 text-fundex-forest text-xs font-semibold">
              {getInitials(selectedThread.investorName)}
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">{selectedThread.investorName}</p>
              <p className="text-xs text-stone-400">Investor</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/30">
            {loadingMessages ? (
              <div className="text-center text-sm text-stone-400 py-8">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-stone-400 py-8">No messages yet. Start the conversation.</div>
            ) : (
              messages.map(msg => {
                const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'partner';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[72%]  px-3.5 py-2.5 text-sm shadow-sm ${
                      isAdmin
                        ? 'bg-fundex-forest text-white'
                        : 'bg-white border border-stone-100 text-stone-900'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-white/60' : 'text-stone-400'}`}>
                        {fmtTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Send box */}
          <div className="p-3 border-t border-stone-100 bg-white flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm border border-stone-100 focus:outline-none focus:border-fundex-gold/50 bg-stone-50"
              placeholder={`Message ${selectedThread.investorName}...`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-3 py-2 bg-fundex-forest text-white disabled:opacity-40 hover:bg-fundex-forest/90 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-stone-400 text-sm flex-col gap-2">
          <MessageCircle size={32} className="text-stone-300" />
          <p>Select a conversation</p>
        </div>
      )}
    </div>
  );
}
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
  const [previousView, setPreviousView] = useState<ViewState>('channels');
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
        setCurrentView(previousView);
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
        setCurrentView(previousView);
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
      setCurrentView(previousView);
      if (previousView === 'channels') setSelectedDeal(null);
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
            <button
              onClick={() => { if (selectedDeal) { setPreviousView('channels'); setCurrentView('send-update'); } }}
              disabled={!selectedDeal}
              className={`px-4 py-2 bg-white border border-stone-100 text-sm font-medium transition ${
                selectedDeal
                  ? 'text-stone-700 hover:bg-stone-50 cursor-pointer'
                  : 'text-stone-300 cursor-not-allowed'
              }`}
            >
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
              className={`px-4 py-2 font-medium text-sm transition-colors ${
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
              className={`px-4 py-2 font-medium text-sm transition-colors ${
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
              className="w-full pl-10 pr-4 py-2 border border-stone-100  bg-stone-50 focus:outline-none focus:bg-white focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {activeTab === 'deals' ? (
          <div className="space-y-3 pt-6">
            {filteredDeals.length === 0 ? (
              <div className="text-center py-12 bg-stone-50  border border-stone-100">
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
                    onClick={() => setSelectedDeal(deal)}
                    className={`flex items-center justify-between p-4 bg-white border cursor-pointer transition hover:shadow-md ${
                      selectedDeal?.id === deal.id
                        ? 'border-fundex-gold bg-fundex-gold/5'
                        : 'border-stone-100 hover:border-fundex-gold/20'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-fundex-gold/10  flex items-center justify-center">
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedDeal(deal); setPreviousView('deal-detail'); setCurrentView('deal-detail'); }}
                      className="p-1 hover:bg-stone-100 rounded transition"
                    >
                      <ChevronRight className="text-stone-500" size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <AdminInboxPanel companyId={companyId} currentUserId={userId ?? ''} />
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
          className="p-2 hover:bg-stone-50  transition"
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
          onClick={() => { setPreviousView('deal-detail'); setCurrentView('send-update'); }}
          className="px-6 py-2 bg-fundex-forest text-white font-medium  hover:bg-fundex-forest/90 transition flex items-center gap-2"
        >
          <Send size={18} />
          Send Update
        </button>

        <button
          onClick={() => { setPreviousView('deal-detail'); setCurrentView('linked-docs'); }}
          className="px-4 py-2 bg-white border border-stone-100 text-stone-900 font-medium  hover:bg-stone-50 transition flex items-center gap-2"
        >
          <FileText size={18} />
          Linked Docs
        </button>

        <button
          onClick={() => { setPreviousView('deal-detail'); setCurrentView('schedule-update'); }}
          className="px-4 py-2 bg-white border border-stone-100 text-stone-900 font-medium  hover:bg-stone-50 transition flex items-center gap-2"
        >
          <Calendar size={18} />
          Schedule
        </button>

        <button
          disabled
          className="px-4 py-2 bg-white border border-stone-100 text-stone-500 font-medium  cursor-not-allowed opacity-50 flex items-center gap-2"
        >
          <AlertCircle size={18} />
          Pending Actions
        </button>
      </div>

      {/* Deal Details Card */}
      <div className=" border border-stone-100 bg-white overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Header with Title and Status */}
          <div className="border-b border-stone-100 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-stone-900">Latest Deal Update</h2>
              <p className="text-xs text-stone-500 mt-1">{selectedDeal?.name}</p>
            </div>
            <span
              className={`px-3 py-1  text-xs font-semibold whitespace-nowrap ${
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-fundex-cream/30 ">
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
            <div className="w-full bg-stone-50  h-2">
              <div
                className="bg-fundex-forest h-2  transition-all"
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
      <div className=" border border-stone-100 bg-white overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-display font-semibold text-stone-900 mb-4">Communication Timeline</h3>
          {timeline.length === 0 ? (
            <div className="text-center py-8 bg-stone-50  border border-stone-100">
              <Clock className="mx-auto text-stone-500 mb-2" size={32} />
              <p className="text-stone-500">No communications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="flex gap-4 pb-4 border-l-2 border-fundex-gold/20 pl-4">
                  <div className="mt-2 w-3 h-3 bg-fundex-forest  -ml-6"></div>
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

  const renderSendUpdateView = () => createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={handleGoBack}>
      <div className="border border-stone-200 bg-white shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white border-b border-stone-100 px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-display font-normal text-stone-900">Send Investor Update</h2>
            <p className="text-sm text-stone-500 mt-1">
              Broadcast to all {selectedDeal?.investor_count || 0} investors in {selectedDeal?.name}
            </p>
          </div>
          <button
            onClick={handleGoBack}
            className="p-1 hover:bg-stone-50 transition"
          >
            <X size={24} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSendUpdate} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-fundex-gold/10 border border-fundex-gold/20 text-fundex-forest text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          <div className="bg-stone-50 p-6 space-y-5">
            <h3 className="text-lg font-display font-normal text-stone-900">Message Details</h3>

            <div>
              <label className="block text-sm font-normal text-stone-700 mb-1.5">Update Title <span className="text-red-600">*</span></label>
              <input
                type="text"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                placeholder="e.g., Q1 2025 Performance Update"
                className="w-full px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-stone-700 mb-1.5">Message Body <span className="text-red-600">*</span></label>
              <textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="Write your message to investors..."
                rows={8}
                className="w-full px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-fundex-gold/30 resize-none"
              />
            </div>
          </div>

          <div className="bg-stone-50 p-6 space-y-5">
            <h3 className="text-lg font-display font-normal text-stone-900">Attachments & Settings</h3>

            <div>
              <label className="block text-sm font-normal text-stone-700 mb-2">Document Attachments</label>
              <label className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-stone-200 cursor-pointer hover:border-stone-400 hover:bg-white transition bg-white">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={32} className="text-stone-400 mb-2" />
                  <p className="text-sm font-medium text-stone-900">Click to upload documents</p>
                  <p className="text-xs text-stone-500 mt-1">PDF, DOC, XLS up to 10MB</p>
                </div>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, false)}
                  className="hidden"
                />
              </label>
              {updateFile && (
                <p className="text-sm text-fundex-forest mt-2 flex items-center gap-1">
                  <CheckCircle size={14} /> {updateFile.name}
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAcknowledgment}
                onChange={(e) => setRequireAcknowledgment(e.target.checked)}
                className="w-4 h-4 border border-stone-200"
              />
              <span className="text-sm text-stone-700">Require investor acknowledgment</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-stone-100 px-6 py-4 bg-stone-50 shrink-0">
          <p className="text-xs text-stone-500 mb-3">
            <span className="font-semibold text-stone-900">{selectedDeal?.investor_count || 0} investors</span> will receive this update
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex-1 px-4 py-2.5 text-sm border border-stone-200 text-stone-900 font-medium hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendUpdate}
              disabled={sending}
              className="flex-1 px-4 py-2.5 text-sm bg-fundex-forest text-white font-medium hover:bg-fundex-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sending ? 'Sending...' : 'Send Update'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  const renderScheduleUpdateView = () => createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={handleGoBack}>
      <div className="border border-stone-200 bg-white shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white border-b border-stone-100 px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-display font-normal text-stone-900">Schedule Future Update</h2>
            <p className="text-sm text-stone-500 mt-1">
              Plan an investor communication in advance for {selectedDeal?.name}
            </p>
          </div>
          <button
            onClick={handleGoBack}
            className="p-1 hover:bg-stone-50 transition"
          >
            <X size={24} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleScheduleUpdate} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-fundex-gold/10 border border-fundex-gold/20 text-fundex-forest text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          <div className="bg-stone-50 p-6 space-y-5">
            <h3 className="text-lg font-display font-normal text-stone-900">Message Details</h3>

            <div>
              <label className="block text-sm font-normal text-stone-700 mb-1.5">Update Title <span className="text-red-600">*</span></label>
              <input
                type="text"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                placeholder="e.g., Monthly Distribution Notice"
                className="w-full px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-stone-700 mb-1.5">Message Body <span className="text-red-600">*</span></label>
              <textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="Write your scheduled message..."
                rows={8}
                className="w-full px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-fundex-gold/30 resize-none"
              />
            </div>
          </div>

          <div className="bg-stone-50 p-6 space-y-5">
            <h3 className="text-lg font-display font-normal text-stone-900">Schedule Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-normal text-stone-700 mb-1.5">Send Date <span className="text-red-600">*</span></label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-stone-700 mb-1.5">Send Time <span className="text-red-600">*</span></label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-fundex-gold/30"
                />
              </div>
            </div>

            <div className="p-4 bg-white border border-stone-200">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-stone-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-900">Timezone: Eastern Time (ET)</p>
                  <p className="text-xs text-stone-500 mt-1">
                    The update will be sent to all investors at the scheduled time in your organization&apos;s timezone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-stone-100 px-6 py-4 bg-stone-50 shrink-0">
          <p className="text-xs text-stone-500 mb-3">
            Updates can be edited or cancelled before the scheduled time
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex-1 px-4 py-2.5 text-sm border border-stone-200 text-stone-900 font-medium hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleUpdate}
              disabled={scheduling}
              className="flex-1 px-4 py-2.5 text-sm bg-fundex-forest text-white font-medium hover:bg-fundex-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              {scheduling ? 'Scheduling...' : 'Schedule Update'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  const renderLinkedDocsView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-stone-50  transition"
        >
          <ArrowLeft size={24} className="text-stone-500" />
        </button>
        <h1 className="text-3xl font-display font-semibold text-stone-900">Linked Documents</h1>
      </div>

      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-stone-50  border border-stone-100">
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
                className="flex items-center justify-between p-4 bg-white border border-stone-100  hover:shadow-md hover:border-stone-300 transition"
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

  // Determine base view (channels or deal-detail) vs overlay modals (send-update, schedule-update)
  const isModalOpen = currentView === 'send-update' || currentView === 'schedule-update';
  const baseView = isModalOpen ? previousView : currentView;

  return (
    <div className="space-y-6 pt-6">
      {baseView === 'channels' && renderChannelsView()}
      {baseView === 'deal-detail' && renderDealDetailView()}
      {currentView === 'linked-docs' && renderLinkedDocsView()}
      {/* Modal overlays — rendered on top of the base view */}
      {currentView === 'send-update' && renderSendUpdateView()}
      {currentView === 'schedule-update' && renderScheduleUpdateView()}
    </div>
  );
}
