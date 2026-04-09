'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';

type TabId = 'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast';

function getActiveTab(pathname: string): TabId {
  if (pathname.includes('/investors')) return 'investors';
  if (pathname.includes('/deals')) return 'deals';
  if (pathname.includes('/allocations')) return 'allocations';
  if (pathname.includes('/documents')) return 'documents';
  if (pathname.includes('/broadcast')) return 'broadcast';
  return 'home';
}

function getDashboardBase(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/company')) return '/company';
  if (pathname.startsWith('/investor')) return '/investor';
  return '/admin';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved) setIsSidebarExpanded(JSON.parse(saved));
  }, []);

  const activeTab = getActiveTab(pathname);
  const base = getDashboardBase(pathname);

  const handleTabChange = (tab: TabId) => {
    if (tab === 'home') {
      router.push(base);
    } else {
      router.push(`${base}/${tab}`);
    }
  };

  // Investor and Company have their own layouts (no sidebar)
  if (pathname.startsWith('/investor') || pathname.startsWith('/company')) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-white font-sans">
      {/* Warm radial gradient glow */}
      <div
        className="fdx-page-glow-tr"
        style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(192,184,122,0.13) 0%, rgba(242,227,187,0.08) 40%, transparent 70%)' }}
      />
      <div
        className="fdx-page-glow-bl"
        style={{ background: 'radial-gradient(ellipse at 15% 80%, rgba(192,184,122,0.06) 0%, transparent 60%)' }}
      />

      <DashboardNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isExpanded={isSidebarExpanded}
        onExpandChange={setIsSidebarExpanded}
      />
      <div
        className={`relative z-10 min-h-screen transition-all duration-300 ${
          isSidebarExpanded ? 'ml-64' : 'ml-20'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
