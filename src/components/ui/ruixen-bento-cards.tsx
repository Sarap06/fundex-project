'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CardContent {
  title: string;
  description: string;
}

interface BentoCardsProps {
  cards?: CardContent[];
  footerHeading?: string;
  footerDescription?: string;
}

const PlusCard: React.FC<{
  className?: string;
  title: string;
  description: string;
}> = ({ className = '', title, description }) => {
  return (
    <div className={cn('relative p-6 md:p-8 border border-border/30 group hover:bg-accent/30 transition-colors', className)}>
      <CornerPlusIcons />
      <div className="relative z-10">
        <h3 className="font-display font-black text-lg md:text-xl text-foreground mb-3">
          {title}
        </h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const CornerPlusIcons = () => (
  <>
    <PlusIcon className="absolute top-[-7px] left-[-7px] opacity-30" />
    <PlusIcon className="absolute top-[-7px] right-[-7px] opacity-30" />
    <PlusIcon className="absolute bottom-[-7px] left-[-7px] opacity-30" />
    <PlusIcon className="absolute bottom-[-7px] right-[-7px] opacity-30" />
  </>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 15 15" className={className} style={{ color: 'var(--accent-emerald)' }}>
    <path d="M7.5 0.5V14.5M0.5 7.5H14.5" stroke="currentColor" />
  </svg>
);

export default function RuixenBentoCards({ cards, footerHeading, footerDescription }: BentoCardsProps) {
  const defaultCards: CardContent[] = [
    {
      title: 'Loan Origination Engine',
      description: 'Submit, underwrite, and close loans digitally. Automated document collection, credit checks, and term sheet generation in minutes.',
    },
    {
      title: 'Investor Portal',
      description: 'White-labeled dashboards giving LPs real-time visibility into positions, distributions, and fund performance metrics.',
    },
    {
      title: 'Portfolio Analytics',
      description: 'Deep insights into portfolio performance, risk metrics, default rates, and market trends. Track every dollar across your lending operations with real-time dashboards, automated reporting, and predictive risk modeling.',
    },
    {
      title: 'Compliance & Reporting',
      description: 'Automated regulatory reporting, audit trails, and compliance workflows that keep your firm ahead of requirements.',
    },
    {
      title: 'Capital Markets',
      description: 'Connect with secondary markets, warehouse lenders, and institutional buyers for rapid liquidity and capital deployment.',
    },
  ];

  const items = cards || defaultCards;
  const heading = footerHeading || 'Built for scale. Designed for lenders.';
  const desc = footerDescription || 'Fundex provides the infrastructure to power every stage of your lending operations — from origination to servicing.';

  return (
    <div className="py-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <PlusCard className="md:col-span-1" title={items[0].title} description={items[0].description} />
          <PlusCard className="md:col-span-1" title={items[1].title} description={items[1].description} />
          <PlusCard className="md:col-span-1 md:row-span-2" title={items[2].title} description={items[2].description} />
          <PlusCard className="md:col-span-1" title={items[3].title} description={items[3].description} />
          <PlusCard className="md:col-span-1" title={items[4].title} description={items[4].description} />
        </div>

        {/* Footer Heading */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-4">
            {heading}
          </h3>
          <p className="font-body text-muted-foreground leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}
