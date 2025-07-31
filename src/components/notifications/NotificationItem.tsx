'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
  CreditCard,
  Settings,
  X,
} from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
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
  };
  onRead: () => void;
  onDismiss: () => void;
}

const categoryIcons: Record<string, any> = {
  RISK: AlertTriangle,
  COMPLIANCE: Shield,
  REPORT: FileText,
  CHAT: MessageSquare,
  BILLING: CreditCard,
  SYSTEM: Settings,
  SECURITY: Shield,
  TEAM: Users,
};

const typeColors: Record<string, string> = {
  INFO: 'text-blue-600 bg-blue-50',
  SUCCESS: 'text-green-600 bg-green-50',
  WARNING: 'text-yellow-600 bg-yellow-50',
  ERROR: 'text-red-600 bg-red-50',
  ACTION_REQUIRED: 'text-purple-600 bg-purple-50',
};

const typeIcons: Record<string, any> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  ACTION_REQUIRED: AlertCircle,
};

export function NotificationItem({ notification, onRead, onDismiss }: NotificationItemProps) {
  const CategoryIcon = categoryIcons[notification.category] || Info;
  const TypeIcon = typeIcons[notification.type] || Info;
  const typeColor = typeColors[notification.type] || 'text-gray-600 bg-gray-50';

  const handleClick = () => {
    if (!notification.read) {
      onRead();
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      className={cn(
        'relative p-4 hover:bg-muted/50 cursor-pointer transition-colors',
        !notification.read && 'bg-blue-50/50'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className={cn('p-2 rounded-lg', typeColor)}>
          <CategoryIcon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p
                className={cn(
                  'font-medium text-sm',
                  !notification.read && 'text-foreground',
                  notification.read && 'text-muted-foreground'
                )}
              >
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            </div>

            <DaisyButton
              variant="ghost"
              shape="square"
              size="md"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <X className="h-3 w-3" />
            </DaisyButton>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>

            {notification.priority === 'URGENT' && (
              <span className="text-xs font-medium text-red-600">Urgent</span>
            )}

            {notification.priority === 'HIGH' && (
              <span className="text-xs font-medium text-orange-600">High Priority</span>
            )}
          </div>
        </div>
      </div>

      {!notification.read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
      )}
    </div>
  );
}
