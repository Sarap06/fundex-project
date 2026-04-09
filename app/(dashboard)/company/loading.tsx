import { Skeleton } from '@/components/ui/skeleton';

export default function CompanyLoading() {
  return (
    <div className="space-y-6 pb-10">
      {/* Greeting */}
      <div className="pt-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-9 w-32" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Chart + overview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-6 h-[260px] w-full rounded-lg" />
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-6 w-40" />
          <Skeleton className="mx-auto mt-6 h-[140px] w-[140px] rounded-full" />
        </div>
      </div>

      {/* Activity + broadcasts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
