'use client';

import { motion } from 'framer-motion';
import { Layers, Building2, Users, Lock, BarChart3, FileText, Settings, Eye } from 'lucide-react';

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-4 h-4 text-border'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);

function BentoCard({ title, description, icon, className = '', span = '' }: {
  title: string; description: string; icon: React.ReactNode; className?: string; span?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative bg-background clean-border rounded-2xl p-8 hover:shadow-lg gentle-animation group ${span} ${className}`}
    >
      <PlusIcon className="absolute top-3 left-3 w-3 h-3 text-border" />
      <PlusIcon className="absolute top-3 right-3 w-3 h-3 text-border" />
      <PlusIcon className="absolute bottom-3 left-3 w-3 h-3 text-border" />
      <PlusIcon className="absolute bottom-3 right-3 w-3 h-3 text-border" />
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
        {icon}
      </div>
      <h3 className="font-display font-black text-lg text-foreground mb-2">{title}</h3>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

export function ProductBreakdown() {
  const layers = [
    {
      label: 'Platform Layer',
      sublabel: 'Fundex Core',
      cards: [
        { icon: <Lock className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Auth & Permissions', description: 'SSO, role-based access, and team management across your entire organization.' },
        { icon: <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Analytics Engine', description: 'Real-time data pipelines powering dashboards, reports, and automated alerts.' },
        { icon: <Settings className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Infrastructure', description: 'Cloud-native architecture with 99.9% uptime, automatic scaling, and enterprise security.' },
      ],
    },
    {
      label: 'Firm Layer',
      sublabel: 'Internal Workspace',
      cards: [
        { icon: <FileText className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Deals & Contracts', description: 'End-to-end deal pipeline management, term sheets, and contract lifecycle tracking.' },
        { icon: <Users className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Team Collaboration', description: 'Shared workspaces, task assignments, and internal communication tools for your lending team.' },
        { icon: <Building2 className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Loan Servicing', description: 'Payment processing, escrow management, and automated borrower communications.' },
      ],
    },
    {
      label: 'Investor Layer',
      sublabel: 'Investor-Facing',
      cards: [
        { icon: <Eye className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Investor Dashboards', description: 'White-labeled portals giving investors real-time visibility into their positions and returns.' },
        { icon: <Layers className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Portfolio & Positions', description: 'Comprehensive position tracking, NAV calculations, and distribution waterfalls.' },
        { icon: <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Reporting & Statements', description: 'Automated K-1s, monthly statements, and custom reporting for LP communications.' },
      ],
    },
  ];

  return (
    <section id="product" className="relative py-32 w-full">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight mb-4">
            The OS <span style={{ color: 'var(--accent-emerald)' }}>Layers</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete operating system built in three powerful layers
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-16">
          {layers.map((layer, li) => (
            <motion.div key={layer.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: li * 0.15 }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-sm uppercase tracking-widest text-foreground">{layer.label}</span>
                  <span className="font-body text-xs text-muted-foreground">— {layer.sublabel}</span>
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {layer.cards.map((card) => (
                  <BentoCard key={card.title} {...card} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="font-display font-black text-xl text-foreground mb-2">Built for performance. Designed for flexibility.</p>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            Fundex gives you the tools to build and scale your lending business with enterprise-grade infrastructure.
          </p>
        </div>
      </div>
    </section>
  );
}
