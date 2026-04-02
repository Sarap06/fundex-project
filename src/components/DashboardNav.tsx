'use client';

import { Home, FileText, Briefcase, ShoppingBag, Megaphone, PieChart } from 'lucide-react';

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
  comingSoon?: boolean;
}

export function DashboardNav({ activeTab, onTabChange, userRole, isExpanded = false, onExpandChange }: DashboardNavProps) {
  const handleToggle = () => {
    const newState = !isExpanded;
    onExpandChange?.(newState);
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState));
  };

  const tabs: TabConfig[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'investors', label: 'Investors', icon: <ShoppingBag size={20} /> },
    { id: 'deals', label: 'Deals', icon: <Briefcase size={20} /> },
    { id: 'allocations', label: 'Allocations', icon: <PieChart size={20} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={20} /> },
    { id: 'broadcast', label: 'Broadcast', icon: <Megaphone size={20} /> },
  ];

  return (
    <aside className={`bg-gray-900 border-r border-gray-800 fixed left-0 top-0 h-screen overflow-y-auto z-40 transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-20'
    }`}>
      <nav className="p-6 flex flex-col gap-2">
        {/* Logo Section */}
        {isExpanded && (
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fundex</h2>
              <p className="text-xs text-gray-400">Pinnacle Capital</p>
            </div>
          </div>
        )}
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              disabled={tab.comingSoon}
              title={tab.label}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 justify-center ${
                isExpanded ? 'w-full justify-start' : 'w-12 justify-center'
              } ${
                isActive
                  ? 'bg-green-600 text-white'
                  : tab.comingSoon
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.comingSoon && <span className="text-xs bg-gray-700 px-2 py-1 rounded">soon</span>}
                </>
              )}
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section - User Profile */}
        {isExpanded && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                JD
              </div>
              <div>
                <p className="text-sm text-white font-semibold">John Doe</p>
                <p className="text-xs text-gray-400">Managing Partner</p>
              </div>
            </div>
            <button className="w-full text-left text-gray-400 hover:text-white text-sm flex items-center gap-2 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
