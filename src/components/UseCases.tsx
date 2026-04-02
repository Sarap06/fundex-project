'use client';

import { motion } from 'framer-motion';
import { Building, Landmark, PiggyBank, Briefcase, ArrowRight } from 'lucide-react';
import { Gallery6 } from '@/components/ui/gallery6';
import { Feature73 } from '@/components/ui/feature-73';
import RuixenBentoCards from '@/components/ui/ruixen-bento-cards';

export function UseCases() {
  const cases = [
    {
      icon: <Building className="w-7 h-7" />,
      title: 'Private Lenders',
      description: 'Manage your entire loan lifecycle from origination through servicing. Automate underwriting, document collection, and investor reporting.',
      features: ['Loan origination workflows', 'Automated document collection', 'Portfolio analytics'],
    },
    {
      icon: <Landmark className="w-7 h-7" />,
      title: 'Real Estate Syndicators',
      description: 'Streamline capital raises, investor communications, and deal management. One platform for all your syndication operations.',
      features: ['Capital raise tracking', 'Investor portal', 'Distribution waterfall modeling'],
    },
    {
      icon: <PiggyBank className="w-7 h-7" />,
      title: 'Capital Allocators',
      description: 'Deploy capital efficiently across multiple lending programs. Real-time visibility into portfolio performance and risk metrics.',
      features: ['Multi-fund management', 'Risk analytics dashboard', 'Automated reporting'],
    },
    {
      icon: <Briefcase className="w-7 h-7" />,
      title: 'Investment Firms',
      description: 'Institutional-grade infrastructure for managing debt investments. Comprehensive position tracking and investor-facing dashboards.',
      features: ['Position management', 'LP reporting', 'Compliance workflows'],
    },
  ];

  const galleryItems = [
    {
      id: 'g1',
      title: 'Miami Skyline Development',
      summary: 'High-rise development financing in the heart of Brickell, backed by Fundex infrastructure.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&h=600&fit=crop',
    },
    {
      id: 'g2',
      title: 'Commercial Portfolio Analytics',
      summary: 'Real-time dashboards tracking loan performance across your entire commercial portfolio.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    },
    {
      id: 'g3',
      title: 'Waterfront Investment',
      summary: 'Bridge loan financing for luxury waterfront properties in South Florida.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
    },
    {
      id: 'g4',
      title: 'Digital Loan Processing',
      summary: 'Streamlined digital workflows replacing manual underwriting processes.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    },
    {
      id: 'g5',
      title: 'Investor Portal',
      summary: 'White-labeled investor dashboards with real-time position and return tracking.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    },
  ];

  const feature73Data = [
    {
      id: 'f1',
      title: 'Loan Origination Platform',
      description: 'End-to-end digital origination from application intake through closing. Automated document collection, credit analysis, and term sheet generation.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
    },
    {
      id: 'f2',
      title: 'Investor Relations Portal',
      description: 'White-labeled dashboards giving LPs real-time visibility into positions, distributions, and fund performance.',
      image: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=800&h=400&fit=crop',
    },
    {
      id: 'f3',
      title: 'Capital Markets Integration',
      description: 'Seamlessly connect with secondary markets, warehouse lenders, and institutional buyers for rapid liquidity.',
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop',
    },
  ];

  return (
    <section id="use-cases" className="relative py-32 w-full">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight mb-4">
            Who It's <span style={{ color: 'var(--accent-emerald)' }}>For</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for every player in the private lending ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-20">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background clean-border rounded-2xl p-8 hover:shadow-lg gentle-animation group"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-white" style={{ backgroundColor: 'var(--accent-emerald)' }}>
                {c.icon}
              </div>
              <h3 className="font-display font-black text-xl text-foreground mb-3">{c.title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-5">{c.description}</p>
              <ul className="space-y-2 mb-5">
                {c.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 font-body text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent-emerald)' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 font-body text-sm font-semibold opacity-0 group-hover:opacity-100 gentle-animation cursor-pointer" style={{ color: 'var(--accent-emerald)' }}>
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature 73 section */}
      <Feature73
        heading="Platform Capabilities"
        description="From loan origination to investor reporting, Fundex provides the infrastructure to power every stage of your lending operations."
        linkUrl="#book-demo-section"
        linkText="Book a demo"
        features={feature73Data}
      />

      {/* Bento Cards */}
      <RuixenBentoCards />

      {/* Gallery carousel */}
      <Gallery6
        heading="Use Cases"
        demoUrl="#book-demo-section"
        items={galleryItems}
      />
    </section>
  );
}
