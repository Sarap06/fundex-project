interface CompanyStatCardProps {
  label: string;
  value: string;
  featured?: boolean;
}

export function CompanyStatCard({
  label,
  value,
  featured = false,
}: CompanyStatCardProps) {
  // Featured card: no container, just raw text
  if (featured) {
    return (
      <div className="flex flex-col justify-end py-2 font-sans">
        <p className="text-sm font-normal text-stone-500">{label}</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-stone-900 md:text-[2.75rem]">
          {value}
        </p>
      </div>
    );
  }

  // Secondary cards: bordered container with warm corner glow
  return (
    <div className="relative flex flex-col overflow-hidden  border border-stone-100 bg-white p-5 font-sans shadow-sm">
      {/* Warm corner glow — cream tint */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24  bg-fundex-cream/30 blur-2xl" />

      {/* Label */}
      <p className="text-sm font-normal text-stone-500">{label}</p>

      {/* Value */}
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-stone-900 md:text-[1.7rem]">
        {value}
      </p>
    </div>
  );
}
