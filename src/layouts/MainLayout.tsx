"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { User } from '@/types';

// Components
import Sidebar from '@/components/layout/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // For dashboard pages, we don't show the traditional layout as they have their own navigation
  if (!showSidebar) {
    return <div className="min-h-screen bg-[#F5F1E9]">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-[#F5F1E9] font-inter">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <Sidebar isOpen={sidebarOpen} user={user as User | undefined} />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-screen bg-[#F5F1E9]">
        {/* Header for non-dashboard pages */}
        <header className="bg-[#FAFAFA] border-b border-[#D8C3A5] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 rounded-lg transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-[#191919]">Riscura</h1>
          </div>
          
          {/* User info for non-dashboard pages */}
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-[#191919]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[#A8A8A8]">
                  {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <div className="w-8 h-8 bg-[#D8C3A5] rounded-full flex items-center justify-center">
                <span className="text-[#191919] text-sm font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
            </div>
          )}
        </header>
        
        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}