'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Megaphone, Download, FileIcon, X, Copy, Share2, ChevronRight, ArrowLeft } from 'lucide-react';

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
}

export function Broadcasts({ companyId, userRole, userName, userId }: BroadcastsProps) {
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

  // Filter broadcasts based on search query
  const filteredBroadcasts = broadcasts.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.admin_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadBroadcasts();
    
    // Subscribe to real-time updates
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
            setBroadcasts((prev) => prev.filter((b) => b.id !== (payload.old as Record<string, unknown>).id));
          }
        }
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
      
      // Validate file size (max 10MB)
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

    console.log('=== SENDING BROADCAST ===');
    console.log('Company ID:', companyId);
    console.log('User Role:', userRole);
    console.log('User ID:', userId);

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
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setTitle('');
        setMessage('');
        setFile(null);
        setSuccessMessage('Broadcast sent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
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
          'Authorization': `Bearer ${session.access_token}`,
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
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading broadcasts...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pt-6">
        {/* Tabs and Search */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-2 font-medium transition ${
                activeTab === 'all'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Announcements
            </button>
            {!isAdmin && (
              <button
                onClick={() => setActiveTab('unread')}
                className={`pb-3 px-2 font-medium transition ${
                  activeTab === 'unread'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Unread
              </button>
            )}
          </div>

          {/* Search Bar and Button */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search announcements or updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Create Update Button */}
            {isAdmin && (
              <button 
                onClick={() => setShowSendForm(!showSendForm)}
                className="bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary/90 transition whitespace-nowrap"
              >
                {showSendForm ? 'Close' : 'Create Update'}
              </button>
            )}
          </div>
        </div>

        {/* Send Broadcast Modal - Only for Admins and when Show Form is True */}
        {isAdmin && showSendForm && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 pointer-events-none">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 pointer-events-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-foreground">Create Announcement</h2>
                <button
                  onClick={() => setShowSendForm(false)}
                  className="text-muted-foreground hover:text-muted-foreground transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 bg-fundex-cream/30 border border-primary/20 rounded-lg text-primary flex items-center gap-2">
                    <CheckCircle size={18} />
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Announcement title"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your announcement description here..."
                      rows={5}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Upload Document (Optional)
                    </label>
                    {!file ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-gray-400 transition">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                          className="hidden"
                          id="file-input"
                        />
                        <label htmlFor="file-input" className="cursor-pointer">
                          <FileIcon className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLSX, PPT, TXT, JPG, PNG, ZIP (max 10MB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="bg-fundex-cream/30 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-6 w-6 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted-foreground transition"
                  >
                    {sending ? 'Sending...' : 'Send Announcement'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Broadcasts List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <div className="bg-background rounded-lg p-12 text-center border border-border">
            <Megaphone className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground text-lg">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBroadcasts.map((broadcast) => {
              const initials = (broadcast.admin_name || 'A')
                .split(' ')
                .map((n) => n.charAt(0))
                .join('')
                .toUpperCase();

              return (
                <div
                  key={broadcast.id}
                  onClick={() => setExpandedBroadcast(broadcast)}
                  className="bg-background rounded-lg border border-border p-4 hover:shadow-md hover:border-primary/20 transition cursor-pointer"
                >
                  <div className="flex gap-4 items-start">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-fundex-cream0 to-green-600">
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div>
                          <h3 className="font-bold text-foreground text-base">{broadcast.title}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {broadcast.admin_name || 'Unknown Admin'}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {getTimeDisplay(broadcast.created_at)}
                        </span>
                      </div>

                      {/* Status/Type */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Announcement
                        </span>
                        {broadcast.file_url && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            📎 Document
                          </span>
                        )}
                      </div>

                      {/* Message Preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {broadcast.message}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="flex-shrink-0 text-gray-300 mt-1" size={20} />
                  </div>

                  {/* Delete Button for Admin */}
                  {isAdmin && broadcast.admin_id === userId && (
                    <div className="mt-2 pt-2 border-t border-border flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBroadcast(broadcast.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded Full-Screen View */}
      {expandedBroadcast && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-background border-b border-border shadow-sm z-40">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setExpandedBroadcast(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft size={24} />
                <span className="text-lg font-medium">Back</span>
              </button>
              {isAdmin && expandedBroadcast.admin_id === userId && (
                <button
                  onClick={() => {
                    handleDeleteBroadcast(expandedBroadcast.id);
                    setExpandedBroadcast(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition font-medium"
                >
                  <X size={18} />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-fundex-cream0 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {(expandedBroadcast.admin_name || 'A')
                    .split(' ')
                    .map((n) => n.charAt(0))
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">{expandedBroadcast.title}</h1>
                  <p className="text-muted-foreground mt-1">
                    Sent by <span className="font-semibold">{expandedBroadcast.admin_name || 'Admin'}</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(expandedBroadcast.created_at).toLocaleString()}
              </p>
            </div>

            {/* Message Content */}
            <div className="bg-muted rounded-lg p-8 mb-8 border border-border">
              <div className="prose prose-sm max-w-none">
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {expandedBroadcast.message}
                </p>
              </div>
            </div>

            {/* File Section */}
            {expandedBroadcast.file_url && expandedBroadcast.file_name && (
              <div className="mb-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">Attached Document</h2>
                <div className="bg-background border-2 border-primary/20 rounded-lg p-6 flex items-center justify-between hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <FileIcon className="text-primary" size={32} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{expandedBroadcast.file_name}</p>
                      <p className="text-sm text-muted-foreground">Click download to view</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = expandedBroadcast.file_url!;
                      link.download = expandedBroadcast.file_name!;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-lg transition font-medium whitespace-nowrap"
                  >
                    <Download size={20} />
                    Download
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 py-8 border-t border-border">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(expandedBroadcast.message);
                  alert('Message copied to clipboard!');
                }}
                className="flex items-center gap-2 px-6 py-3 text-muted-foreground bg-muted hover:bg-muted rounded-lg transition font-medium"
              >
                <Copy size={20} />
                Copy Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to format time display
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
