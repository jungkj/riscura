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
      
      {/* Main Content Area - No header navbar */}
      <main className="flex-1 min-h-screen bg-[#F5F1E9]">
        {children}
      </main>
    </div>
  );
}