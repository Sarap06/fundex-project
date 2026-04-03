'use client';

import React from 'react';
import { Timeline } from '@/components/ui/timeline';
import { Building2, TrendingUp, Shield, Banknote, BarChart3, Users } from 'lucide-react';

export function Services() {
  const data = [
    {
    title: "Investor Management",
      content: (
        <div>
          <p className="font-sans text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
            Track all your investors, commitments, and allocations in one place.Eliminate spreadsheets and manual tracking
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-card clean-border rounded-xl p-5">
              <Building2 className="w-6 h-6 mb-3" style={{ color: 'var(--primary)' }} />
              <h4 className="font-display font-bold text-foreground mb-1">Up to $25M</h4>
              <p className="font-sans text-muted-foreground text-sm">Per transaction</p>
            </div>
            <div className="bg-card clean-border rounded-xl p-5">
              <TrendingUp className="w-6 h-6 mb-3" style={{ color: 'var(--primary)' }} />
              <h4 className="font-display font-bold text-foreground mb-1">7-Day Close</h4>
              <p className="font-sans text-muted-foreground text-sm">Average turnaround</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop',
            ].map((src, i) => (
              <img key={i} src={src} alt="Bridge loan property" className="rounded-lg w-full h-24 md:h-32 object-cover" />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Deal & Allocation Tracking",
      content: (
        <div>
          <p className="font-sans text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
            Manage deals, capital deployment, and investor participation with full clarity. Know exactly where every dollar is allocated.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-card clean-border rounded-xl p-5">
              <Shield className="w-6 h-6 mb-3" style={{ color: 'var(--primary)' }} />
              <h4 className="font-display font-bold text-foreground mb-1">Up to 90% LTC</h4>
              <p className="font-sans text-muted-foreground text-sm">Loan-to-cost ratio</p>
            </div>
            <div className="bg-card clean-border rounded-xl p-5">
              <Banknote className="w-6 h-6 mb-3" style={{ color: 'var(--primary)' }} />
              <h4 className="font-display font-bold text-foreground mb-1">100% Rehab</h4>
              <p className="font-sans text-muted-foreground text-sm">Construction costs covered</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&h=400&fit=crop',
            ].map((src, i) => (
              <img key={i} src={src} alt="Fix and flip renovation" className="rounded-lg w-full h-24 md:h-32 object-cover" />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Payments & Distributions",
      content: (
        <div>
          <p className="font-sans text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
            Track interest, payment schedules, and distributions automatically. Ensure accurate and transparent payouts.          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-card clean-border rounded-xl p-5">
              <BarChart3 className="w-6 h-6 mb-3" style={{ color: 'var(--primary)' }} />
              <h4 className="font-display font-bold text-foreground mb-1">No Tax Returns</h4>
              <p className="font-sans text-muted-foreground text-sm">Qualify on rental income</p>
            </div>
            <div className="bg-card clean-border rounded-xl p-5">
              <Users className="w-6 h-6 mb-3" style={{ color: 'var(--primary)' }} />
              <h4 className="font-display font-bold text-foreground mb-1">30-Year Terms</h4>
              <p className="font-sans text-muted-foreground text-sm">Fixed & adjustable rates</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
            ].map((src, i) => (
              <img key={i} src={src} alt="Rental property" className="rounded-lg w-full h-24 md:h-32 object-cover" />
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative py-20 w-full">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight">
            Platform <span style={{ color: 'var(--primary)' }}>Capabilities</span>
          </h2>
          <p className="font-sans text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Tailored lending solutions for every stage of your real estate investment journey.
          </p>
        </div>
        <Timeline data={data} />
      </div>
    </div>
  );
}
