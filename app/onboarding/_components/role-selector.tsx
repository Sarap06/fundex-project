'use client';

import { BriefcaseBusiness, TrendingUp } from 'lucide-react';

type RoleSelectorProps = {
  onSelect: (role: 'investor' | 'firm') => void;
};

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
        How will you use Fundex?
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        This helps us personalize your experience
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('firm')}
          className="group flex flex-col items-center gap-4 rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all hover:border-fundex-gold hover:shadow-md"
        >
          <div className="rounded-xl bg-fundex-gold/10 p-4 text-fundex-forest transition-colors group-hover:bg-fundex-gold/20">
            <BriefcaseBusiness className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-900">Firm / Operator</p>
            <p className="mt-1.5 text-sm text-stone-500">
              I manage deals, investors, and capital operations
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('investor')}
          className="group flex flex-col items-center gap-4 rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all hover:border-fundex-gold hover:shadow-md"
        >
          <div className="rounded-xl bg-fundex-gold/10 p-4 text-fundex-forest transition-colors group-hover:bg-fundex-gold/20">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-900">Investor</p>
            <p className="mt-1.5 text-sm text-stone-500">
              I invest capital and track my portfolio returns
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
