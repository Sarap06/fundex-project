'use client';

import { motion } from 'framer-motion';
import { Zap, TrendingUp, Globe, Layers, ArrowRight } from 'lucide-react';
import { FeatureCarousel, type ImageSet } from '@/components/ui/animated-feature-carousel';
import { StickyFeatureSection } from '@/components/ui/sticky-scroll-cards-section';

export function WhyFundex() {
  const reasons = [
    { icon: <Zap className="w-6 h-6" style={{ color: 'var(--primary)' }} />, title: 'Speed to Close', description: 'Our infrastructure eliminates bottlenecks. Go from application to funded in days, not months.' },
    { icon: <TrendingUp className="w-6 h-6" style={{ color: 'var(--primary)' }} />, title: 'Scale Without Limits', description: 'Whether you manage 10 loans or 10,000, the platform scales with your firm seamlessly.' },
    { icon: <Globe className="w-6 h-6" style={{ color: 'var(--primary)' }} />, title: 'Miami-Native', description: "Built by and for South Florida's unique real estate lending ecosystem. We understand the market." },
    { icon: <Layers className="w-6 h-6" style={{ color: 'var(--primary)' }} />, title: 'Full-Stack OS', description: 'Not just a tool — a complete operating system for your lending business, from origination to servicing.' },
  ];

  const carouselImages: ImageSet = {
    alt: 'Fundex platform feature',
    step1img1: 'https://images.unsplash.com/photo-1560472355-536de3962603?q=80&w=800&auto=format&fit=crop',
    step1img2: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
    step2img1: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    step2img2: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
    step3img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
    step4img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop',
  };

  const carouselSteps = [
    { id: '1', name: 'Originate', title: 'Fast Loan Origination', description: 'Submit and process loan applications in minutes with automated document collection and underwriting.' },
    { id: '2', name: 'Analyze', title: 'Portfolio Analytics', description: 'Real-time dashboards with deep insights into portfolio performance, risk metrics, and market trends.' },
    { id: '3', name: 'Manage', title: 'Deal Management', description: 'Track every deal from application through funding with collaborative team workspaces.' },
    { id: '4', name: 'Scale', title: 'Automated Servicing', description: 'Automate payment processing, investor distributions, and compliance reporting at scale.' },
  ];

  return (
    <section id="why-fundex" className="relative py-32 w-full">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight mb-4">
            Why <span style={{ color: 'var(--primary)' }}>Fundex</span>
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
            The modern operating system for private lending firms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card clean-border rounded-2xl p-8 hover:shadow-lg gentle-animation group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(40, 105, 75, 0.1)' }}>
                {reason.icon}
              </div>
              <h3 className="font-display font-black text-xl text-foreground mb-3">{reason.title}</h3>
              <p className="font-sans text-muted-foreground leading-relaxed mb-4">{reason.description}</p>
              <span className="inline-flex items-center gap-2 font-sans text-sm font-semibold opacity-0 group-hover:opacity-100 gentle-animation" style={{ color: 'var(--primary)' }}>
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          ))}
        </div>

        {/* Feature Carousel */}
        <FeatureCarousel image={carouselImages} steps={carouselSteps} />
      </div>

      {/* Sticky Scroll Cards */}
      <StickyFeatureSection />
    </section>
  );
}
