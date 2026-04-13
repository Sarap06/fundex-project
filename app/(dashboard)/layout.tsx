'use client';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Company and investor have their own layout shells with gradient backgrounds
  if (pathname.startsWith('/investor') || pathname.startsWith('/company')) {
    return <>{children}</>;
  }

  // Admin layout — white canvas with warm gold/cream gradient atmosphere
  return (
    <div className="relative min-h-screen bg-white font-sans">
      {/* Top-right warm bloom — gold fading into cream */}
      <div
        className="pointer-events-none fixed right-0 top-0 z-0 h-[800px] w-[900px]"
        style={{ background: 'radial-gradient(ellipse at 90% 10%, rgba(192,184,122,0.12) 0%, rgba(242,227,187,0.07) 35%, transparent 65%)' }}
      />
      {/* Bottom-left whisper — subtle warmth for balance */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 z-0 h-[600px] w-[700px]"
        style={{ background: 'radial-gradient(ellipse at 10% 85%, rgba(242,227,187,0.09) 0%, rgba(192,184,122,0.04) 40%, transparent 65%)' }}
      />
      {/* Mid-page accent — faint gold wash */}
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(192,184,122,0.05) 0%, transparent 60%)' }}
      />

      {children}
    </div>
  );
}
