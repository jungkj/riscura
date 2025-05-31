"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { User } from '@/types';

// Components
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import TeamChatPanel from '@/components/collaboration/TeamChatPanel';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  // Handle sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Handle chat panel toggle
  const toggleChat = () => setChatOpen(!chatOpen);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <Navbar toggleSidebar={toggleSidebar} toggleChat={toggleChat} />
      
      <div className="flex flex-1 relative">
        {/* Sidebar - Fixed positioning */}
        <div className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border transition-all duration-300 z-20",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <Sidebar isOpen={sidebarOpen} user={user as User | undefined} />
        </div>
        
        {/* Main Content Area */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-16"
        )}>
          <div className="container mx-auto px-6 py-6 max-w-7xl">
            {children}
          </div>
        </main>
        
        {/* Team Chat Panel (conditionally rendered) */}
        <TeamChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  );
}