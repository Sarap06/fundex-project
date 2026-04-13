import { Skeleton } from '@/components/ui/skeleton';

export default function CompanyBroadcastLoading() {
  return (
    <div className="space-y-7 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="py-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-12 w-20" />
          <Skeleton className="mt-2 h-4 w-36" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden border border-stone-100 bg-white p-5 shadow-sm"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 bg-fundex-cream/30 blur-2xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-3 h-4 w-full" />
          </div>
        ))}
      </div>

      <div className="border border-stone-100 bg-white font-sans shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-9 w-full sm:w-72" />
        </div>
        <div className="divide-y divide-stone-50 px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Skeleton className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
