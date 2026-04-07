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

  // Investor has its own nested layout with a different sidebar
  if (pathname.startsWith('/investor')) {
    return <>{children}</>;
  }

  return (
    <>
      <DashboardNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isExpanded={isSidebarExpanded}
        onExpandChange={setIsSidebarExpanded}
      />
      <div
        className={`min-h-screen bg-muted transition-all duration-300 ${
          isSidebarExpanded ? 'ml-64' : 'ml-20'
        }`}
      >
        {children}
      </div>
    </>
  );
}
