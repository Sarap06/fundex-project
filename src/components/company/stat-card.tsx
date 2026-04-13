import { MoreHorizontal } from 'lucide-react';

interface CompanyStatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  change?: string | null;
  changeLabel?: string;
  featured?: boolean;
}

export function CompanyStatCard({
  label,
  value,
  sublabel,
  change,
  changeLabel,
  featured = false,
}: CompanyStatCardProps) {
  const isPositive = change?.startsWith('+');

  // Featured card: no container, just raw text
  if (featured) {
    return (
      <div className="flex flex-col justify-end py-2 font-sans">
        <p className="text-sm font-normal text-stone-500">{label}</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-stone-900 md:text-[2.75rem]">
          {value}
        </p>
        {change && (
          <p className="mt-2 text-sm">
            <span className="font-medium text-emerald-500">{change}</span>
            {changeLabel && (
              <span className="ml-1.5 font-normal text-stone-400">{changeLabel}</span>
            )}
          </p>
        )}
        {!change && sublabel && (
          <p className="mt-2 text-sm font-normal text-stone-400">{sublabel}</p>
        )}
      </div>
    );
  }

  // Secondary cards: bordered container with warm corner glow
  return (
    <div className="relative flex flex-col overflow-hidden  border border-stone-100 bg-white p-5 font-sans shadow-sm">
      {/* Warm corner glow — cream tint */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fundex-cream/30 blur-2xl" />

      {/* Label + menu */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-normal text-stone-500">{label}</p>
        <button
          type="button"
          className="-mr-1 p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
          aria-label="Options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Value */}
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-stone-900 md:text-[1.7rem]">
        {value}
      </p>

      {/* Sublabel + change on same row */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-normal text-stone-400">{sublabel || 'Growth Rate'}</p>
        {change && (
          <span className={`text-[13px] font-medium tabular-nums ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '↑ ' : '↓ '}
            {change.replace(/^[+-]/, '')}
          </span>
        )}
      </div>
    </div>
  );
}
