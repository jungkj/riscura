'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { User } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar isOpen={sidebarOpen} user={user as User | undefined} />
      </div>
      
      {/* Main Content Area - No top navbar */}
      <main className="flex-1 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
} 