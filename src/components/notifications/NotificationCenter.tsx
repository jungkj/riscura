'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Filter, Settings } from 'lucide-react';
import {
import { DaisyTabsTrigger, DaisyDropdownMenu, DaisyDropdownMenuTrigger, DaisyDropdownMenuContent, DaisyDropdownMenuItem } from '@/components/ui/daisy-components';
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
// import { format } from 'date-fns'
import { useToast } from '@/components/ui/DaisyToast';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferences } from './NotificationPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  type: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  iconUrl?: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const { toast } = useToast();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('read', 'false');
      
      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      // console.error('Failed to fetch notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread')
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      // console.error('Failed to fetch unread count:', error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // console.error('Failed to mark as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      }
    } catch (error) {
      // console.error('Failed to mark all as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  }

  // Dismiss notification
  const dismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast({
          title: 'Dismissed',
          description: 'Notification removed',
        });
      }
    } catch (error) {
      // console.error('Failed to dismiss notification:', error)
    }
  }

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Set up polling for new notifications
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 60000); // Poll every minute
    
    return () => clearInterval(interval);
  }, [filter]);

  return (
    <>
      <DaisyDropdownMenu >
          <DaisyDropdownMenuTrigger asChild >
            <DaisyButton variant="ghost" shape="square" size="md" className="relative" >
  <Bell className="h-5 w-5" />
</DaisyDropdownMenu>
            {unreadCount > 0 && (
              <DaisyBadge
                variant="error"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center" >
  {unreadCount > 99 ? '99+' : unreadCount}
</DaisyBadge>
              </DaisyBadge>
            )}
          </DaisyButton>
        </DaisyDropdownMenuTrigger>
        <DaisyDropdownMenuContent align="end" className="w-[400px]" >
            <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)} />
                <Settings className="h-4 w-4" />
              </DaisyDropdownMenuContent>
              {unreadCount > 0 && (
                <DaisyButton variant="ghost" size="sm" onClick={markAllAsRead} >
  <Check className="h-4 w-4 mr-1" />
</DaisyButton>
                  Mark all read
                </DaisyButton>
              )}
            </div>
          </div>

          <DaisyTabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} />
            <DaisyTabsList className="grid w-full grid-cols-2" >
                <DaisyTabsTrigger value="all">All</DaisyTabs>
              <DaisyTabsTrigger value="unread" >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
              </DaisyTabsTrigger>
            </DaisyTabsList>
            
            <DaisyTabsContent value={filter} className="mt-0" >
                <DaisyScrollArea className="h-[400px]" >
                  {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={() => markAsRead(notification.id)}
                        onDismiss={() => dismissNotification(notification.id)} />
                    ))}
                  </div>
                )}
              </DaisyTabsContent>
            </DaisyTabsContent>
          </DaisyTabs>

          <DaisyDropdownMenuSeparator />
<DaisyDropdownMenuItem asChild >
              <a
              href="/notifications"
              className="w-full text-center py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              View all notifications
            </a>
          </DaisyDropdownMenuSeparator>
        </DaisyDropdownMenuContent>
      </DaisyDropdownMenu>

      {Boolean(showPreferences) && (
        <NotificationPreferences
          open={showPreferences}
          onClose={() => setShowPreferences(false)}
          isSubscribed={isSubscribed}
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
          pushSupported={isSupported} />
      )}
    </>
  );
}