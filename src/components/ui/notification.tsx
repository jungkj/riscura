import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Clock, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  metadata?: {
    source?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    case 'info':
      return Info;
    case 'system':
      return Bell;
    default:
      return Info;
  }
};

const getNotificationColors = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-800',
        message: 'text-green-700'
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-800',
        message: 'text-yellow-700'
      };
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-800',
        message: 'text-red-700'
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-800',
        message: 'text-blue-700'
      };
    case 'system':
      return {
        bg: 'bg-secondary/20',
        border: 'border-border',
        icon: 'text-[#191919]',
        title: 'text-[#191919]',
        message: 'text-muted-foreground'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        title: 'text-gray-800',
        message: 'text-gray-700'
      };
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  showActions = true,
  compact = false
}) => {
  const Icon = getNotificationIcon(notification.type);
  const colors = getNotificationColors(notification.type);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-200',
        colors.bg,
        colors.border,
        compact ? 'p-3' : 'p-4',
        !notification.read && 'shadow-sm'
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-blue-500" />
      )}

      <div className={cn('flex items-start space-x-3', !notification.read && 'ml-4')}>
        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-0.5', colors.icon)}>
          <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-semibold font-inter',
                compact ? 'text-sm' : 'text-base',
                colors.title
              )}>
                {notification.title}
              </h4>
              
              <p className={cn(
                'mt-1 font-inter',
                compact ? 'text-xs' : 'text-sm',
                colors.message
              )}>
                {notification.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500 font-inter">
                  {formatTimeAgo(notification.timestamp)}
                </span>
                
                {notification.metadata?.source && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 font-inter">
                      {notification.metadata.source}
                    </span>
                  </>
                )}
                
                {notification.metadata?.priority && ['high', 'critical'].includes(notification.metadata.priority) && (
                  <Badge className={cn(
                    'text-xs px-2 py-0 h-5',
                    notification.metadata.priority === 'critical' 
                      ? 'bg-red-100 text-red-700 border-red-200' 
                      : 'bg-orange-100 text-orange-700 border-orange-200'
                  )}>
                    {notification.metadata.priority} priority
                  </Badge>
                )}
              </div>

              {/* Actions */}
              {showActions && notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center space-x-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={action.variant === 'primary' ? 'default' : 'outline'}
                      onClick={action.onClick}
                      className={cn(
                        'h-7 text-xs font-inter',
                        action.variant === 'primary'
                          ? 'bg-[#191919] text-white hover:bg-[#191919]/90'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex items-center space-x-1 ml-2">
              {!notification.read && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  title="Mark as read"
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface NotificationListProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  maxHeight?: string;
  compact?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  maxHeight = '400px',
  compact = false
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-inter">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            {unreadCount > 0 && `, ${unreadCount} unread`}
          </p>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs text-gray-500 hover:text-gray-700 font-inter"
              >
                Mark all as read
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 font-inter"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Notification items */}
      <div 
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight }}
      >
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-gray-600 font-inter mb-1">
                No notifications
              </h4>
              <p className="text-xs text-gray-500 font-inter">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                onMarkAsRead={onMarkAsRead}
                compact={compact}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface ToastNotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onDismiss,
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const Icon = getNotificationIcon(notification.type);
  const colors = getNotificationColors(notification.type);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-4 right-4 z-50';
      case 'top-left':
        return 'fixed top-4 left-4 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-50';
      default:
        return 'fixed top-4 right-4 z-50';
    }
  };

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [notification.id, onDismiss, autoHide, autoHideDelay]);

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: position.includes('top') ? -50 : 50,
        scale: 0.95 
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1 
      }}
      exit={{ 
        opacity: 0, 
        y: position.includes('top') ? -50 : 50,
        scale: 0.95 
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        getPositionClasses(),
        'max-w-sm w-full bg-white border rounded-lg shadow-lg',
        colors.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={cn('flex-shrink-0 mt-0.5', colors.icon)}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold font-inter text-sm', colors.title)}>
              {notification.title}
            </h4>
            
            <p className={cn('mt-1 text-sm font-inter', colors.message)}>
              {notification.message}
            </p>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {notification.actions.slice(0, 2).map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant === 'primary' ? 'default' : 'outline'}
                    onClick={() => {
                      action.onClick();
                      onDismiss(notification.id);
                    }}
                    className="h-7 text-xs font-inter"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(notification.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar for auto-hide */}
      {autoHide && (
        <motion.div
          className={cn('h-1 rounded-b-lg', colors.bg)}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: autoHideDelay / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}; 