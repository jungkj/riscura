import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  CheckCircle, 
  X, 
  Filter,
  Search,
  MoreHorizontal,
  Archive,
  Trash2,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationList, Notification } from './notification';

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onArchive?: (id: string) => void;
  onSettingsOpen?: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onArchive,
  onSettingsOpen,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTab, setSelectedTab] = React.useState('all');
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tab
    switch (selectedTab) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'system':
        filtered = filtered.filter(n => n.type === 'system');
        break;
      case 'alerts':
        filtered = filtered.filter(n => ['error', 'warning'].includes(n.type));
        break;
      case 'success':
        filtered = filtered.filter(n => n.type === 'success');
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, searchQuery, selectedTab]);

  const tabCounts = React.useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      system: notifications.filter(n => n.type === 'system').length,
      alerts: notifications.filter(n => ['error', 'warning'].includes(n.type)).length,
      success: notifications.filter(n => n.type === 'success').length
    };
  }, [notifications]);

  React.useEffect(() => {
    // Close notification center when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-notification-center]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} data-notification-center>
      {/* Notification Bell Trigger */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 transition-all duration-200',
          isOpen && 'text-[#191919] bg-[#D8C3A5]/20'
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </Button>

      {/* Notification Center Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white border border-[#D8C3A5]/30 rounded-xl shadow-2xl shadow-black/10 backdrop-blur-sm z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#D8C3A5]/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#191919] font-inter">Notifications</h3>
                  <p className="text-sm text-[#A8A8A8] font-inter">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Sound Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="h-8 w-8 p-0 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>

                  {/* Settings */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSettingsOpen}
                    className="h-8 w-8 p-0 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  {/* More Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {unreadCount > 0 && (
                        <DropdownMenuItem onClick={onMarkAllAsRead}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark all as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={onClearAll}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear all notifications
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.location.reload()}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Refresh notifications
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A8A8A8]" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-[#FAFAFA] border-[#D8C3A5]/60 focus:border-[#191919] focus:ring-2 focus:ring-[#D8C3A5]/30 font-inter text-sm"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="p-4">
              <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-[#F5F1E9] rounded-lg">
                <TabsTrigger 
                  value="all" 
                  className="text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-[#191919] data-[state=active]:shadow-sm"
                >
                  All
                  {tabCounts.all > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-xs bg-[#D8C3A5]/30 text-[#191919] border-0">
                      {tabCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="unread"
                  className="text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-[#191919] data-[state=active]:shadow-sm"
                >
                  Unread
                  {tabCounts.unread > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-xs bg-red-500 text-white border-0">
                      {tabCounts.unread}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="system"
                  className="text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-[#191919] data-[state=active]:shadow-sm"
                >
                  System
                  {tabCounts.system > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-xs bg-blue-500 text-white border-0">
                      {tabCounts.system}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts"
                  className="text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-[#191919] data-[state=active]:shadow-sm"
                >
                  Alerts
                  {tabCounts.alerts > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-xs bg-orange-500 text-white border-0">
                      {tabCounts.alerts}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="success"
                  className="text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-[#191919] data-[state=active]:shadow-sm"
                >
                  Success
                  {tabCounts.success > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-xs bg-green-500 text-white border-0">
                      {tabCounts.success}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Notification List Content */}
              <div className="mt-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-[#A8A8A8] mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-[#191919] font-inter mb-1">
                      {searchQuery ? 'No matching notifications' : 'No notifications'}
                    </h4>
                    <p className="text-xs text-[#A8A8A8] font-inter">
                      {searchQuery ? 'Try adjusting your search terms' : "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="relative group"
                        >
                          {/* Enhanced notification item for notification center */}
                          <div className={cn(
                            'relative rounded-lg border transition-all duration-200 hover:shadow-md p-3',
                            notification.read 
                              ? 'bg-[#FAFAFA] border-[#D8C3A5]/30 opacity-75' 
                              : 'bg-white border-[#D8C3A5]/60 shadow-sm'
                          )}>
                            {/* Unread indicator */}
                            {!notification.read && (
                              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-blue-500" />
                            )}

                            <div className={cn('flex items-start space-x-3', !notification.read ? 'ml-4' : '')}>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-[#191919] font-inter text-sm">
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center space-x-1 ml-2">
                                    <span className="text-xs text-[#A8A8A8] font-inter">
                                      {formatTimeAgo(notification.timestamp)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDismiss(notification.id)}
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9]"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-sm text-[#A8A8A8] font-inter mt-1 line-clamp-2">
                                  {notification.message}
                                </p>

                                {/* Priority badge */}
                                {notification.metadata?.priority && ['high', 'critical'].includes(notification.metadata.priority) && (
                                  <Badge className={cn(
                                    'mt-2 text-xs border-0',
                                    notification.metadata.priority === 'critical' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-orange-100 text-orange-700'
                                  )}>
                                    {notification.metadata.priority} priority
                                  </Badge>
                                )}

                                {/* Quick action for unread notifications */}
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="mt-2 text-xs text-[#A8A8A8] hover:text-[#191919] font-inter p-0 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Mark as read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Tabs>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-4 border-t border-[#D8C3A5]/30 bg-[#FAFAFA] rounded-b-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#A8A8A8] font-inter">
                    Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-[#A8A8A8] hover:text-[#191919] font-inter"
                  >
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to format time ago (reused from notification.tsx)
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}; 