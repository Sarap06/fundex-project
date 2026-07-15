'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MoreHorizontal, Paperclip, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  admin_name?: string;
}

interface BroadcastPreviewProps {
  companyId: string;
}

function formatTimeAgo(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BroadcastPreview({ companyId }: BroadcastPreviewProps) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    (async () => {
      try {
        const res = await fetch(`/api/broadcasts?companyId=${companyId}`);
        const data = await res.json();
        const fetched = (data || []).slice(0, 4);
        setBroadcasts(fetched);
      } catch {
        setBroadcasts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="flex flex-col  border border-stone-100 bg-white font-sans shadow-sm">
      {/* Header — matches reference "My Card" header style */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
        <h3 className="text-base font-medium text-stone-900">Broadcasts</h3>
        <button
          type="button"
          className=" p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Subheader label */}
      <div className="px-6 pt-4">
        <p className="text-sm text-stone-400">Latest Announcements</p>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-3">
        {loading ? (
          <div className="space-y-1 px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3  px-2 py-3">
                <Skeleton className="mt-0.5 h-9 w-9 " />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="flex h-12 w-12 items-center justify-center  bg-stone-100">
              <Megaphone className="h-5 w-5 text-stone-400" />
            </div>
            <p className="mt-3 text-sm text-stone-400">No broadcasts yet</p>
          </div>
        ) : (
          broadcasts.map((broadcast, i) => (
            <Link
              key={broadcast.id}
              href="/company/broadcast"
              className={`flex items-start gap-3  px-2 py-3 transition-colors hover:bg-stone-50 ${
                i !== broadcasts.length - 1 ? 'border-b border-stone-50' : ''
              }`}
            >
              {/* Icon — colored initials circle like reference transaction icons */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center  bg-gradient-to-br from-fundex-gold/20 to-fundex-cream/40">
                <Megaphone className="h-4 w-4 text-fundex-forest" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-normal text-stone-800">
                  {broadcast.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs text-stone-400">
                    {broadcast.admin_name || 'Admin'}
                  </span>
                  <span className="text-xs text-stone-300">&middot;</span>
                  <span className="text-xs text-stone-400">
                    {formatTimeAgo(broadcast.created_at)}
                  </span>
                  {broadcast.file_url && (
                    <Paperclip className="ml-1 h-3 w-3 text-stone-300" />
                  )}
                </div>
              </div>

              {/* Unread indicator */}
              <span className="mt-2 h-2 w-2 shrink-0 bg-fundex-gold" />
            </Link>
          ))
        )}
      </div>

      {/* Footer link */}
      <div className="border-t border-stone-100 px-6 py-3">
        <Link
          href="/company/broadcast"
          className="text-sm font-normal text-fundex-forest transition-colors hover:text-fundex-green"
        >
          View All Broadcasts &rarr;
        </Link>
      </div>
    </div>
  );
}
