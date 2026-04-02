'use client'
import React, { useEffect, useRef, useState } from 'react';

interface LinkItem {
  href: string;
  label: string;
}

interface FooterProps {
  leftLinks: LinkItem[];
  rightLinks: LinkItem[];
  copyrightText: string;
  barCount?: number;
}

const AnimatedFooter: React.FC<FooterProps> = ({
  leftLinks,
  rightLinks,
  copyrightText,
  barCount = 23,
}) => {
  const waveRefs = useRef<(HTMLDivElement | null)[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let t = 0;

    const animateWave = () => {
      const waveElements = waveRefs.current;
      let offset = 0;

      waveElements.forEach((element, index) => {
        if (element) {
          offset += Math.max(0, 20 * Math.sin((t + index) * 0.3));
          element.style.transform = `translateY(${index + offset}px)`;
        }
      });

      t += 0.1;
      animationFrameRef.current = requestAnimationFrame(animateWave);
    };

    if (isVisible) {
      animateWave();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isVisible]);

  return (
    <footer ref={footerRef} className="relative w-full" style={{ backgroundColor: 'var(--foreground)' }}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <div className="font-bagel text-3xl tracking-wider" style={{ color: 'var(--background)' }}>
              FUNDEX
            </div>
            {leftLinks.map((link, index) => (
              <div key={index}>
                <a
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {link.label}
                </a>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-xs">{copyrightText}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4 items-start md:items-end">
            {rightLinks.map((link, index) => (
              <div key={index}>
                <a
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {link.label}
                </a>
              </div>
            ))}
            <div className="mt-4">
              <a
                href="#hero"
                className="text-xs font-semibold uppercase tracking-widest transition-colors hover:opacity-80"
                style={{ color: 'var(--accent-emerald)' }}
              >
                Back to top ↑
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Animated wave bars */}
      <div className="w-full overflow-hidden">
        <div className="flex flex-col">
          {Array.from({ length: barCount }).map((_, index) => (
            <div
              key={index}
              ref={(el) => { waveRefs.current[index] = el; }}
              style={{
                height: `${index + 1}px`,
                backgroundColor: 'var(--accent-emerald)',
                transition: 'transform 0.1s ease',
                willChange: 'transform',
                marginTop: '-2px',
              }}
            />
          ))}
        </div>
      </div>
    </footer>
  );
};

export default AnimatedFooter;
