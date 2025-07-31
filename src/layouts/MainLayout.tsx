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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out fixed h-full z-30",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <Sidebar 
          isOpen={sidebarOpen} 
          user={user as User | undefined} 
          onToggle={toggleSidebar}
        />
      </div>
      
      {/* Main Content Area - Apple-inspired design */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <div className="relative min-h-screen">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}