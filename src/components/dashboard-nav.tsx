'use client';

import { Home, FileText, Briefcase, Users, Megaphone, PieChart, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logOut } from '@/lib/auth';

interface DashboardNavProps {
  activeTab: 'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast';
  onTabChange: (tab: 'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast') => void;
  userRole?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

interface TabConfig {
  id: 'home' | 'investors' | 'deals' | 'allocations' | 'documents' | 'broadcast';
  label: string;
  icon: React.ReactNode;
}

export function DashboardNav({ activeTab, onTabChange, isExpanded = false, onExpandChange }: DashboardNavProps) {
  const router = useRouter();

  const handleToggle = () => {
    const newState = !isExpanded;
    onExpandChange?.(newState);
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState));
  };

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  const tabs: TabConfig[] = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'investors', label: 'Investors', icon: <Users size={18} /> },
    { id: 'deals', label: 'Deals', icon: <Briefcase size={18} /> },
    { id: 'allocations', label: 'Allocations', icon: <PieChart size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
    { id: 'broadcast', label: 'Broadcast', icon: <Megaphone size={18} /> },
  ];

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-stone-100 bg-white font-sans transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-20'
    }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center  bg-fundex-gold font-display text-sm font-bold text-fundex-forest">
          F
        </div>
        {isExpanded && (
          <div className="min-w-0">
            <p className="font-display text-base font-normal text-stone-900">Fundex</p>
            <p className="text-[11px] text-stone-400">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              className={`flex w-full items-center gap-3  px-3 py-2.5 text-sm font-normal transition-colors ${
                isExpanded ? 'justify-start' : 'justify-center'
              } ${
                isActive
                  ? 'bg-fundex-gold/10 text-fundex-forest border-l-2 border-fundex-gold -ml-px'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              {isExpanded && <span>{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-2">
        <button
          onClick={handleToggle}
          className="flex w-full items-center justify-center  p-2 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* User section */}
      <div className="border-t border-stone-100 px-4 py-4">
        <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-fundex-gold/20 text-xs font-medium text-fundex-forest">
            JD
          </div>
          {isExpanded && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-normal text-stone-900">John Doe</p>
              <p className="truncate text-[11px] text-stone-400">Admin</p>
            </div>
          )}
          {isExpanded && (
            <button
              onClick={handleLogout}
              className=" p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
