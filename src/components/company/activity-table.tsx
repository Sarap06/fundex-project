'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, SlidersHorizontal, DollarSign, FileText, TrendingUp, Users, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Activity {
  id: string;
  type: string;
  description: string;
  dealName?: string;
  investorName?: string;
  timestamp: string;
}

interface ActivityTableProps {
  companyId: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof DollarSign; bg: string; text: string; label: string }> = {
  allocation_created: { icon: DollarSign, bg: 'bg-fundex-gold/15', text: 'text-fundex-forest', label: 'Allocation' },
  deal_created: { icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Deal' },
  investor_created: { icon: Users, bg: 'bg-blue-50', text: 'text-blue-600', label: 'Investor' },
  document_uploaded: { icon: FileText, bg: 'bg-violet-50', text: 'text-violet-600', label: 'Document' },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || { icon: TrendingUp, bg: 'bg-stone-100', text: 'text-stone-500', label: 'Update' };
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ActivityTable({ companyId }: ActivityTableProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!companyId) return;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/activities/recent?companyId=${companyId}&limit=10`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const json = await res.json();
        setActivities(json.activities || []);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const filtered = activities.filter(
    (a) =>
      a.description?.toLowerCase().includes(search.toLowerCase()) ||
      a.dealName?.toLowerCase().includes(search.toLowerCase()) ||
      a.investorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-stone-100 bg-white font-sans shadow-sm">
      {/* Header — matches reference: title left, search + filter right */}
      <div className="flex flex-col gap-3 border-b border-stone-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-stone-900">
          Recent Activity
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Search by Name or Deal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-fundex-gold focus:ring-1 focus:ring-fundex-gold/30 sm:w-60"
            />
          </div>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* Table — matches reference columns: checkbox, Activity, Category, Date, Amount, menu */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-0 px-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-stone-50 py-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-stone-400">
            No recent activity
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="w-10 py-3 pl-6 pr-2">
                  <input type="checkbox" disabled className="h-4 w-4 rounded border-stone-300 opacity-40" />
                </th>
                <th className="py-3 pl-2 pr-4 text-left text-xs font-medium text-stone-400">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400">
                  Categories
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-400">
                  Deal
                </th>
                <th className="w-10 py-3 pl-4 pr-6" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((activity) => {
                const config = getTypeConfig(activity.type);
                const Icon = config.icon;
                return (
                  <tr
                    key={activity.id}
                    className="border-b border-stone-50 transition-colors last:border-0 hover:bg-stone-50/50"
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 pl-6 pr-2">
                      <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-fundex-gold focus:ring-fundex-gold/30" />
                    </td>
                    {/* Activity: icon + description */}
                    <td className="py-3.5 pl-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                          <Icon className={`h-4 w-4 ${config.text}`} />
                        </div>
                        <span className="max-w-[200px] truncate text-sm font-medium text-stone-800">
                          {activity.description}
                        </span>
                      </div>
                    </td>
                    {/* Category badge */}
                    <td className="px-4 py-3.5">
                      <Badge
                        variant="outline"
                        className="border-stone-200 text-xs font-medium text-stone-600"
                      >
                        {config.label}
                      </Badge>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3.5 text-sm tabular-nums text-stone-500">
                      {formatDate(activity.timestamp)}
                    </td>
                    {/* Deal name */}
                    <td className="max-w-[140px] truncate px-4 py-3.5 text-sm text-stone-500">
                      {activity.dealName || '—'}
                    </td>
                    {/* Menu */}
                    <td className="py-3.5 pl-4 pr-6">
                      <button
                        type="button"
                        className="rounded-md p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
