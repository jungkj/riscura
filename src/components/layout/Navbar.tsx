import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RiskIcon } from '@/components/icons/RiskIcon';

// UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Icons
import { Menu, Moon, Sun, MessageSquare, Bell, Settings, LogOut, User } from 'lucide-react';

interface NavbarProps {
  toggleSidebar: () => void;
  toggleChat: () => void;
}

export default function Navbar({ toggleSidebar, toggleChat }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userInitials = user ? 
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="md:hidden h-8 w-8 notion-button-ghost"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <RiskIcon className="h-6 w-6 text-foreground" />
            <span className="font-semibold text-lg text-foreground">Riscura</span>
          </a>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-8 w-8 notion-button-ghost"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Chat Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleChat}
            className="h-8 w-8 notion-button-ghost"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="sr-only">Team Chat</span>
          </Button>
          
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 notion-button-ghost"
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full notion-button-ghost">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 notion-card border-border/50 shadow-notion-lg" 
              align="end" 
              forceMount
            >
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => router.push('/profile')}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/settings')}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-sm">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}