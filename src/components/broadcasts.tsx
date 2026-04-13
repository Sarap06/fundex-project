'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  AlertCircle,
  Megaphone,
  Download,
  FileIcon,
  X,
  Copy,
  ChevronRight,
  ArrowLeft,
  Search,
  ChevronDown,
} from 'lucide-react';
import { StaggerContainer } from '@/components/motion-wrapper';
import { CompanyStatCard } from '@/components/company/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  admin_id: string;
  admin_name?: string;
}

interface BroadcastsProps {
  companyId: string;
  userRole?: string;
  userName?: string;
  userId?: string;
  firstName?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function getTodayString(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const day = now.getDate();
  const year = now.getFullYear();
  return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

function computeStats(broadcasts: Broadcast[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const total = broadcasts.length;
  const thisMonth = broadcasts.filter((b) => new Date(b.created_at) >= startOfMonth).length;
  const withAttachments = broadcasts.filter((b) => b.file_url).length;
  const last7 = broadcasts.filter((b) => new Date(b.created_at) >= weekAgo).length;

  const lastMonthCount = broadcasts.filter((b) => {
    const d = new Date(b.created_at);
    return d >= startPrevMonth && d < startOfMonth;
  }).length;

  const momLabel = 'from last month';
  let momChange: string | null = '0%';
  if (lastMonthCount === 0) {
    momChange = thisMonth > 0 ? '+100%' : '0%';
  } else {
    const pct = ((thisMonth - lastMonthCount) / lastMonthCount) * 100;
    momChange = `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  }

  return { total, thisMonth, withAttachments, last7, momChange, momLabel };
}

export function Broadcasts({
  companyId,
  userRole,
  userName: _userName,
  userId,
  firstName = '',
}: BroadcastsProps) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedBroadcast, setExpandedBroadcast] = useState<Broadcast | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);

  const isAdmin = userRole === 'admin';

  const filteredBroadcasts = useMemo(() => {
    const searched = broadcasts.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.admin_name || '').toLowerCase().includes(searchQuery.toLowerCase()),
    );
    // Unread state is not tracked in the API yet; keep parity with previous behavior (same as all).
    return searched;
  }, [broadcasts, searchQuery]);

  const stats = useMemo(() => computeStats(broadcasts), [broadcasts]);

  useEffect(() => {
    loadBroadcasts();

    const subscription = supabase
      .channel(`broadcasts:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcasts',
          filter: `company_id=eq.${companyId}`,
        },
        (payload: Record<string, unknown>) => {
          if (payload.eventType === 'INSERT') {
            setBroadcasts((prev) => [payload.new as Broadcast, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setBroadcasts((prev) =>
              prev.filter((b) => b.id !== (payload.old as Record<string, unknown>).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [companyId]);

  const loadBroadcasts = async () => {
    try {
      const response = await fetch(`/api/broadcasts?companyId=${companyId}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setBroadcasts(data);
      }
    } catch (err) {
      console.error('Error loading broadcasts:', err);
      setError('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      setError('Please fill in title and message');
      return;
    }

    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You are not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('companyId', companyId);
      formData.append('title', title);
      formData.append('message', message);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setTitle('');
        setMessage('');
        setFile(null);
        setSuccessMessage('Broadcast sent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowSendForm(false);
        loadBroadcasts();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send broadcast');
      }
    } catch (err) {
      console.error('Error sending broadcast:', err);
      setError('An error occurred while sending the broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteBroadcast = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You are not authenticated');
        return;
      }

      const response = await fetch(`/api/broadcasts/${broadcastId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('Broadcast deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadBroadcasts();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete broadcast');
      }
    } catch (err) {
      console.error('Error deleting broadcast:', err);
      setError('An error occurred while deleting the broadcast');
    }
  };

  if (loading) {
    return (
      <div className="space-y-7 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-12 w-16" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden border border-stone-100 bg-white p-5 shadow-sm"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-12" />
              <Skeleton className="mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="border border-stone-100 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-9 w-full max-w-md" />
          </div>
          <div className="divide-y divide-stone-50 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-5">
                <Skeleton className="h-14 w-14 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <StaggerContainer className="space-y-7 pb-12">
        {/* Row 1 — greeting + actions (matches /company dashboard) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[1.75rem] font-normal tracking-tight text-stone-900 md:text-[2rem]">
              {getGreeting()}, {firstName || 'there'}!
            </h1>
            <p className="mt-1 text-sm text-stone-400">Today is {getTodayString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 border border-stone-200 bg-white px-4 py-2 text-sm font-normal text-stone-600 transition-colors hover:bg-stone-50"
            >
              Last Month
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowSendForm(true);
                  setError('');
                  setSuccessMessage('');
                }}
                className="flex items-center gap-1.5 bg-fundex-gold px-5 py-2 text-sm font-medium text-fundex-forest shadow-sm transition-colors hover:bg-fundex-gold/85"
              >
                Create Update
              </button>
            )}
          </div>
        </div>

        {/* Row 2 — KPI strip */}
        <div>
          <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <CompanyStatCard
              label="Total Announcements"
              value={String(stats.total)}
              change={stats.momChange}
              changeLabel={stats.momLabel}
              featured
            />
            <CompanyStatCard
              label="This Month"
              value={String(stats.thisMonth)}
              sublabel="New posts"
              change={
                stats.thisMonth > 0
                  ? `+${Math.min(100, Math.round((stats.thisMonth / Math.max(stats.total, 1)) * 100))}%`
                  : '+0%'
              }
            />
            <CompanyStatCard
              label="With Attachments"
              value={String(stats.withAttachments)}
              sublabel="Include a file"
              change={
                stats.withAttachments > 0
                  ? `+${((stats.withAttachments / Math.max(stats.total, 1)) * 100).toFixed(0)}%`
                  : '+0%'
              }
            />
            <CompanyStatCard
              label="Last 7 Days"
              value={String(stats.last7)}
              sublabel="Recent activity"
              change={`+${stats.last7}`}
            />
          </div>
        </div>

        {/* Row 3 — list shell (ActivityTable pattern) */}
        <div className="border border-stone-100 bg-white font-sans shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-medium text-stone-900">All Announcements</h3>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    type="search"
                    placeholder="Search announcements or updates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 border-stone-200 bg-white pl-9 text-sm text-stone-700 placeholder:text-stone-400 focus-visible:border-fundex-gold focus-visible:ring-fundex-gold/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-6 border-b border-stone-100">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'pb-3 text-sm font-normal transition-colors',
                  activeTab === 'all'
                    ? 'border-b-2 border-fundex-gold text-stone-900'
                    : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600',
                )}
              >
                All
              </button>
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('unread')}
                  className={cn(
                    'pb-3 text-sm font-normal transition-colors',
                    activeTab === 'unread'
                      ? 'border-b-2 border-fundex-gold text-stone-900'
                      : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600',
                  )}
                >
                  Unread
                </button>
              )}
            </div>
          </div>

          {filteredBroadcasts.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center bg-stone-50">
                <Megaphone className="h-7 w-7 text-stone-400" />
              </div>
              <p className="mt-4 text-base font-normal text-stone-700">No announcements yet</p>
              <p className="mt-1 max-w-sm text-sm text-stone-400">
                When your team posts an update, it will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-50">
              {filteredBroadcasts.map((broadcast) => {
                const initials = (broadcast.admin_name || 'A')
                  .split(' ')
                  .map((n) => n.charAt(0))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <li key={broadcast.id}>
                    <div className="flex gap-4 px-6 py-5 transition-colors hover:bg-stone-50/80">
                      <button
                        type="button"
                        onClick={() => setExpandedBroadcast(broadcast)}
                        className="flex min-w-0 flex-1 gap-4 text-left"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-fundex-gold font-display text-sm font-bold text-fundex-forest">
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-medium text-stone-900">{broadcast.title}</h3>
                              <p className="mt-0.5 text-sm text-stone-500">
                                {broadcast.admin_name || 'Unknown Admin'}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm text-stone-400">
                              {getTimeDisplay(broadcast.created_at)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center bg-fundex-gold/10 px-2.5 py-0.5 text-xs font-medium text-fundex-forest">
                              Announcement
                            </span>
                            {broadcast.file_url && (
                              <span className="inline-flex items-center bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                                Document
                              </span>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm text-stone-500">{broadcast.message}</p>
                        </div>

                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-stone-300" />
                      </button>

                      {isAdmin && broadcast.admin_id === userId && (
                        <div className="flex shrink-0 flex-col items-end justify-between pt-0.5">
                          <span className="sr-only">Actions</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(broadcast.id)}
                            className="text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </StaggerContainer>

      <Dialog open={showSendForm} onOpenChange={setShowSendForm}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-stone-100 bg-white p-0 sm:max-w-md">
          <DialogHeader className="border-b border-stone-100 px-6 py-4 text-left">
            <DialogTitle className="text-xl font-normal text-stone-900">Create Announcement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {error && (
              <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 border border-fundex-gold/20 bg-fundex-gold/10 px-4 py-3 text-sm text-fundex-forest">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-normal text-stone-700">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="h-10 border-stone-200 focus-visible:border-fundex-gold focus-visible:ring-fundex-gold/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-normal text-stone-700">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement description here..."
                  rows={5}
                  className="border-stone-200 focus-visible:border-fundex-gold focus-visible:ring-fundex-gold/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-normal text-stone-700">
                  Upload Document (Optional)
                </label>
                {!file ? (
                  <div className="border-2 border-dashed border-stone-200 bg-stone-50/50 p-6 text-center transition-colors hover:border-stone-300">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                      className="hidden"
                      id="broadcast-file-input"
                    />
                    <label htmlFor="broadcast-file-input" className="cursor-pointer">
                      <FileIcon className="mx-auto mb-2 h-10 w-10 text-stone-400" />
                      <p className="text-sm font-medium text-stone-800">Click to upload or drag and drop</p>
                      <p className="mt-1 text-xs text-stone-500">
                        PDF, DOC, DOCX, XLSX, PPT, TXT, JPG, PNG, ZIP (max 10MB)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border border-fundex-gold/20 bg-fundex-gold/10 p-4">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-6 w-6 text-fundex-forest" />
                      <div>
                        <p className="text-sm font-medium text-stone-900">{file.name}</p>
                        <p className="text-xs text-stone-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-stone-400 transition-colors hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-fundex-gold py-3 text-sm font-medium text-fundex-forest shadow-sm transition-colors hover:bg-fundex-gold/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Announcement'}
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {expandedBroadcast && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-lg">
            <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-5 py-4 md:px-8">
              <button
                type="button"
                onClick={() => setExpandedBroadcast(null)}
                className="flex items-center gap-2 text-sm font-normal text-stone-600 transition-colors hover:text-stone-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              {isAdmin && expandedBroadcast.admin_id === userId && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteBroadcast(expandedBroadcast.id);
                    setExpandedBroadcast(null);
                  }}
                  className="border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  Delete
                </button>
              )}
            </div>
          </header>

          <div className="mx-auto max-w-screen-2xl px-5 py-8 md:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-fundex-gold font-display text-lg font-bold text-fundex-forest">
                  {(expandedBroadcast.admin_name || 'A')
                    .split(' ')
                    .map((n) => n.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                    {expandedBroadcast.title}
                  </h1>
                  <p className="mt-1 text-sm text-stone-500">
                    Sent by{' '}
                    <span className="font-medium text-stone-700">
                      {expandedBroadcast.admin_name || 'Admin'}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-stone-400">
                    {new Date(expandedBroadcast.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border border-stone-100 bg-stone-50/80 p-6 md:p-8">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-800">
                  {expandedBroadcast.message}
                </p>
              </div>

              {expandedBroadcast.file_url && expandedBroadcast.file_name && (
                <div className="mt-8">
                  <h2 className="mb-4 text-base font-medium text-stone-900">Attached Document</h2>
                  <div className="flex flex-col gap-4 border border-stone-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-fundex-gold/10 p-3">
                        <FileIcon className="h-8 w-8 text-fundex-forest" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">{expandedBroadcast.file_name}</p>
                        <p className="text-sm text-stone-500">Download to view</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = expandedBroadcast.file_url!;
                        link.download = expandedBroadcast.file_name!;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-fundex-gold px-6 py-3 text-sm font-medium text-fundex-forest shadow-sm transition-colors hover:bg-fundex-gold/85"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-10 border-t border-stone-100 pt-8">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(expandedBroadcast.message);
                  }}
                  className="inline-flex items-center gap-2 border border-stone-200 bg-white px-5 py-2.5 text-sm font-normal text-stone-600 transition-colors hover:bg-stone-50"
                >
                  <Copy className="h-4 w-4" />
                  Copy Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getTimeDisplay(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
