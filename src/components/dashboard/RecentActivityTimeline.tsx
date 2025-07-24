import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  type: 'risk' | 'control' | 'document' | 'workflow';
}

interface RecentActivityTimelineProps {
  isLoading?: boolean;
}

export default function RecentActivityTimeline({ isLoading = false }: RecentActivityTimelineProps) {
  // Mock activities data
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      title: 'New Risk Identified',
      description: 'Cybersecurity vulnerability in payment system',
      timestamp: '2 hours ago',
      user: {
        name: 'Alex Johnson',
        initials: 'AJ'
      },
      type: 'risk'
    },
    {
      id: '2',
      title: 'Control Updated',
      description: 'Improved firewall configuration for data center',
      timestamp: '5 hours ago',
      user: {
        name: 'Maria Garcia',
        initials: 'MG'
      },
      type: 'control'
    },
    {
      id: '3',
      title: 'Document Analyzed',
      description: 'Risk assessment report processed by AI',
      timestamp: '1 day ago',
      user: {
        name: 'David Kim',
        initials: 'DK'
      },
      type: 'document'
    },
    {
      id: '4',
      title: 'Workflow Approved',
      description: 'Risk mitigation plan approved by committee',
      timestamp: '2 days ago',
      user: {
        name: 'Sarah Wilson',
        initials: 'SW'
      },
      type: 'workflow'
    },
    {
      id: '5',
      title: 'Control Testing Completed',
      description: 'Annual review of access controls',
      timestamp: '3 days ago',
      user: {
        name: 'Robert Chen',
        initials: 'RC'
      },
      type: 'control'
    }
  ]);

  // Get icon for activity type
  const getActivityTypeClass = (type: Activity['type']) => {
    switch (type) {
      case 'risk':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'control':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'document':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'workflow':
        return 'bg-secondary/20 text-foreground dark:bg-secondary/20 dark:text-foreground';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px] pr-3">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-border ml-[0.625rem]" />
        
        {activities.map((activity) => (
          <div key={activity.id} className="flex mb-6 relative">
            {/* Timeline dot */}
            <div className="absolute left-4 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary ml-[0.4rem]" />
            
            {/* Activity content */}
            <div className="ml-10 flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium">{activity.title}</h4>
                <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
              
              <div className="flex items-center">
                <DaisyAvatar className="h-6 w-6 mr-2">
                  <DaisyAvatarImage src={activity.user.avatar} />
                  <DaisyAvatarFallback className="text-[10px]">{activity.user.initials}</DaisyAvatarFallback>
                </DaisyAvatar>
                
                <span className="text-xs">{activity.user.name}</span>
                
                <span className={cn(
                  "ml-auto text-[10px] py-0.5 px-2 rounded-full",
                  getActivityTypeClass(activity.type)
                )}>
                  {activity.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}