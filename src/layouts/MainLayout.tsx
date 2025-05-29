import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// Components
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import TeamChatPanel from '@/components/collaboration/TeamChatPanel';

export default function MainLayout() {
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
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} user={user} />
        
        {/* Main Content Area */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-0"
        )}>
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
        
        {/* Team Chat Panel (conditionally rendered) */}
        <TeamChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  );
}