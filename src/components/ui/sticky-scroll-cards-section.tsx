import React, { useState, useEffect, useRef } from 'react';

interface FeatureData {
  title: string;
  description: string;
  imageUrl: string;
}

interface StickyFeatureSectionProps {
  heading?: string;
  subheading?: string;
  features?: FeatureData[];
}

const useScrollAnimation = (): [React.RefObject<HTMLDivElement | null>, boolean] => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
};

export function StickyFeatureSection({ heading, subheading, features }: StickyFeatureSectionProps) {
  const [headerRef, headerInView] = useScrollAnimation();
  const [pRef, pInView] = useScrollAnimation();

  const defaultFeatures: FeatureData[] = [
    {
      title: 'Speed to Close',
      description: 'Our infrastructure eliminates bottlenecks. Go from application to funded in days, not months. Automated workflows handle document collection, underwriting, and approvals.',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    },
    {
      title: 'Scale Without Limits',
      description: 'Whether you manage 10 loans or 10,000, the platform scales with your firm seamlessly. Built on modern cloud infrastructure for unlimited growth.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    },
    {
      title: 'Miami-Native Platform',
      description: "Built by and for South Florida's unique real estate lending ecosystem. We understand the market dynamics, regulatory landscape, and deal flow of the region.",
      imageUrl: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&h=600&fit=crop',
    },
    {
      title: 'Full-Stack Operating System',
      description: 'Not just a tool — a complete operating system for your lending business. Origination, servicing, investor management, and compliance in one unified platform.',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    },
  ];

  const items = features || defaultFeatures;
  const h = heading || 'The Fundex Advantage';
  const sub = subheading || 'Infrastructure built for modern private lenders';

  return (
    <div className="py-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h3
            ref={headerRef}
            className="font-display text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight mb-4 transition-all duration-700"
            style={{
              opacity: headerInView ? 1 : 0,
              transform: headerInView ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            {h}
          </h3>
          <p
            ref={pRef}
            className="font-sans text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-200"
            style={{
              opacity: pInView ? 1 : 0,
              transform: pInView ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            {sub}
          </p>
        </div>

        {/* Sticky cards */}
        <div className="relative">
          {items.map((feature, index) => (
            <div
              key={index}
              className="sticky top-24 mb-8"
              style={{ zIndex: index + 1 }}
            >
              <div
                className=" overflow-hidden clean-border grid grid-cols-1 md:grid-cols-2 gap-0"
                style={{
                  backgroundColor: index % 2 === 0 ? 'var(--background)' : 'rgba(40, 105, 75, 0.05)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                }}
              >
                {/* Text */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h4 className="font-display font-black text-2xl text-foreground mb-4">{feature.title}</h4>
                  <p className="font-sans text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
                {/* Image */}
                <div className="h-64 md:h-80 overflow-hidden">
                  <img
                    src={feature.imageUrl}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/28694B/ffffff?text=Fundex';
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
