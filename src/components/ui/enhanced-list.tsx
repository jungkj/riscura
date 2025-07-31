import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyAvatar, DaisyAvatarFallback } from '@/components/ui/DaisyAvatar';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySelect } from '@/components/ui/DaisySelect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDevice } from '@/lib/responsive/hooks';
import {
  Search,
  MoreHorizontal,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  MessageSquare,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Copy,
  Archive,
  FileText,
  MapPin,
  Phone,
  Mail,
  X,
  ChevronDown,
} from 'lucide-react';

// Types
export interface EnhancedListItem {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'draft';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  dueDate?: Date | string;
  progress?: number;
  tags?: string[];
  metadata?: {
    department?: string;
    location?: string;
    phone?: string;
    lastActivity?: Date | string;
    completedTasks?: number;
    totalTasks?: number;
  };
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EnhancedListProps {
  title?: string;
  subtitle?: string;
  items: EnhancedListItem[];
  variant?: 'compact' | 'default' | 'detailed';
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  onItemAction?: (action: string, item: EnhancedListItem) => void;
  onItemSelect?: (item: EnhancedListItem) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  showHeader?: boolean;
}

interface SortOption {
  value: string;
  label: string;
}

interface FilterOption {
  value: string;
  label: string;
}

// Status Configuration
const statusConfig = {
  active: { variant: 'success' as const, icon: CheckCircle, label: 'Active' },
  inactive: { variant: 'secondary' as const, icon: AlertTriangle, label: 'Inactive' },
  pending: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
  completed: { variant: 'success' as const, icon: CheckCircle, label: 'Completed' },
  error: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Error' },
  draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
};

// Priority Configuration
const priorityConfig = {
  low: { variant: 'success' as const, label: 'LOW', color: 'text-green-700' },
  medium: { variant: 'default' as const, label: 'MEDIUM', color: 'text-yellow-800' },
  high: { variant: 'destructive' as const, label: 'HIGH', color: 'text-red-700' },
  critical: { variant: 'destructive' as const, label: 'CRITICAL', color: 'text-red-800' },
};

// Risk Level Configuration
const riskConfig = {
  low: { variant: 'success' as const, color: 'text-green-600' },
  medium: { variant: 'default' as const, color: 'text-blue-600' },
  high: { variant: 'warning' as const, color: 'text-orange-600' },
  critical: { variant: 'destructive' as const, color: 'text-red-600' },
};

// Status Badge Component
const StatusBadge: React.FC<{ status: EnhancedListItem['status'] }> = ({ status }) => {
  const config = statusConfig[status];
  const IconComponent = config.icon;
  
  return (
    <DaisyBadge variant={config.variant} className="text-xs font-medium" >
  <IconComponent className="h-3 w-3 mr-1" />
</DaisyBadge>
      {config.label}
    </DaisyBadge>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: NonNullable<EnhancedListItem['priority']> }> = ({ priority }) => {
  const config = priorityConfig[priority];
  
  return (
    <DaisyBadge variant={config.variant} className="text-xs font-medium" >
  {config.label}
</DaisyBadge>
    </DaisyBadge>
  );
};

// Risk Level Badge Component
const RiskBadge: React.FC<{ riskLevel: NonNullable<EnhancedListItem['riskLevel']> }> = ({ riskLevel }) => {
  const config = riskConfig[riskLevel];
  
  return (
    <div className="flex items-center gap-1">
      <Shield className={cn("h-3 w-3", config.color)} />
      <span className={cn("text-xs font-semibold uppercase tracking-wider", config.color)}>
        {riskLevel}
      </span>
    </div>
  );
};

// User Avatar Component (responsive)
const UserAvatar: React.FC<{ 
  user: NonNullable<EnhancedListItem['assignee']>; 
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ user, showDetails = true, size = 'md' }) => {
  const device = useDevice();
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <div className="flex items-center gap-2">
      <DaisyAvatar className={sizeClasses[size]} />
        <DaisyAvatarFallback className="bg-[#199BEC]/10 text-[#199BEC] text-xs font-medium" />
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </DaisyAvatar>
      </DaisyAvatar>
      {showDetails && (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-[#191919] font-inter truncate">
            {user.name}
          </span>
          {user.role && device.type !== 'mobile' && (
            <span className="text-xs text-gray-500 font-inter truncate">
              {user.role}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Contact Information Component (responsive)
const ContactInfo: React.FC<{ 
  user: NonNullable<EnhancedListItem['assignee']>;
  metadata?: EnhancedListItem['metadata'];
}> = ({ user, metadata }) => {
  const device = useDevice();
  
  if (device.type === 'mobile') {
    return (
      <div className="flex items-center gap-3">
        {user.email && (
          <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <Mail className="h-3 w-3 text-gray-500" />
</DaisyButton>
          </DaisyButton>
        )}
        {metadata?.phone && (
          <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <Phone className="h-3 w-3 text-gray-500" />
</DaisyButton>
          </DaisyButton>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {user.email && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Mail className="h-3 w-3" />
          <span className="font-inter">{user.email}</span>
        </div>
      )}
      {metadata?.phone && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Phone className="h-3 w-3" />
          <span className="font-inter">{metadata.phone}</span>
        </div>
      )}
      {metadata?.location && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin className="h-3 w-3" />
          <span className="font-inter">{metadata.location}</span>
        </div>
      )}
    </div>
  );
};

// Progress Component (responsive)
const ProgressIndicator: React.FC<{ 
  progress: number;
  metadata?: EnhancedListItem['metadata'];
}> = ({ progress, metadata }) => {
  const device = useDevice();
  
  const getProgressColor = (prog: number) => {
    if (prog >= 80) return 'bg-green-500';
    if (prog >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-3", device.type === 'mobile' ? "min-w-[120px]" : "")}>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 font-medium font-inter min-w-[2rem]">
          {progress}%
        </span>
      </div>
      {metadata && (metadata.completedTasks !== undefined && metadata.totalTasks !== undefined) && (
        <div className="text-xs text-gray-500 font-inter">
          {metadata.completedTasks} of {metadata.totalTasks} tasks
        </div>
      )}
    </div>
  );
};

// Date Display Component (responsive)
const DateDisplay: React.FC<{ date: Date | string; label?: string }> = ({ date, label }) => {
  const device = useDevice();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const isOverdue = dateObj < new Date();
  const isUpcoming = dateObj < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex items-center gap-2">
      <DaisyCalendar className={cn("h-3 w-3 flex-shrink-0",
        isOverdue ? 'text-red-500' : 
        isUpcoming ? 'text-yellow-500' : 
        'text-gray-400'
      )} />
      <div className="flex flex-col">
        {label && device.type !== 'mobile' && (
          <span className="text-xs text-gray-500 font-inter">{label}</span>
        )}
        <span className={cn("text-xs font-inter",
          isOverdue ? 'text-red-600 font-medium' : 
          isUpcoming ? 'text-yellow-600' : 
          'text-gray-600'
        )}>
          {device.type === 'mobile' 
            ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : dateObj.toLocaleDateString()
          }
        </span>
      </div>
    </div>
  );
};

// Tags Component (responsive)
const TagsDisplay: React.FC<{ tags: string[] }> = ({ tags }) => {
  const device = useDevice();
  const displayTags = device.type === 'mobile' ? tags.slice(0, 2) : tags.slice(0, 3);
  const remainingCount = tags.length - displayTags.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayTags.map((tag, index) => (
        <DaisyBadge key={index} variant="secondary" className="text-xs" >
  {tag}
</DaisyCalendar>
        </DaisyBadge>
      ))}
      {remainingCount > 0 && (
        <DaisyBadge variant="outline" className="text-xs" >
  +{remainingCount}
</DaisyBadge>
        </DaisyBadge>
      )}
    </div>
  );
};

// Actions Menu Component (responsive)
const ActionsMenu: React.FC<{ 
  item: EnhancedListItem; 
  onAction: (action: string, item: EnhancedListItem) => void;
}> = ({ item, onAction }) => {
  const device = useDevice();
  
  return (
    <DaisyDropdownMenu />
      <DaisyDropdownMenuTrigger asChild />
        <DaisyButton 
          variant="ghost" 
          size="sm" 
          className={cn(
            "p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity",
            device.type === 'mobile' ? "h-10 w-10 opacity-100" : "h-8 w-8"
          )} >
  <MoreHorizontal className="h-4 w-4" />
</DaisyDropdownMenu>
        </DaisyButton>
      </DaisyDropdownMenuTrigger>
      <DaisyDropdownMenuContent align="end" className="w-48" />
        <DaisyDropdownMenuItem onClick={() => onAction('view', item)} />
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DaisyDropdownMenuContent>
        <DaisyDropdownMenuItem onClick={() => onAction('edit', item)} />
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DaisyDropdownMenuItem>
        <DaisyDropdownMenuItem onClick={() => onAction('copy', item)} />
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DaisyDropdownMenuItem>
        <DaisyDropdownMenuSeparator />
        <DaisyDropdownMenuItem onClick={() => onAction('archive', item)} />
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </DaisyDropdownMenuSeparator>
        <DaisyDropdownMenuItem 
          onClick={() => onAction('delete', item)}
          className="text-red-600 focus:text-red-600" />
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DaisyDropdownMenuItem>
      </DaisyDropdownMenuContent>
    </DaisyDropdownMenu>
  );
};

// Compact List Item Component (mobile-first)
const CompactListItem: React.FC<{
  item: EnhancedListItem;
  onItemAction?: (action: string, item: EnhancedListItem) => void;
  onItemSelect?: (item: EnhancedListItem) => void;
}> = ({ item, onItemAction, onItemSelect }) => {
  const device = useDevice();
  
  return (
    <div 
      className={cn(
        "group flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer",
        device.type === 'mobile' ? "p-4" : ""
      )}
      onClick={() => onItemSelect?.(item)}
    >
      {/* Left side - Status and basic info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <StatusBadge status={item.status} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#191919] font-inter text-sm truncate">
            {item.title}
          </h3>
          {item.assignee && device.type !== 'mobile' && (
            <p className="text-xs text-gray-600 font-inter truncate">
              Assigned to {item.assignee.name}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Priority and actions */}
      <div className="flex items-center gap-2">
        {item.priority && (
          <PriorityBadge priority={item.priority} />
        )}
        {item.dueDate && (
          <DateDisplay date={item.dueDate} />
        )}
        {onItemAction && (
          <ActionsMenu item={item} onAction={onItemAction} />
        )}
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

// Default List Item Component
const DefaultListItem: React.FC<{
  item: EnhancedListItem;
  onItemAction?: (action: string, item: EnhancedListItem) => void;
  onItemSelect?: (item: EnhancedListItem) => void;
}> = ({ item, onItemAction, onItemSelect }) => {
  const device = useDevice();
  
  return (
    <div 
      className={cn(
        "group border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer",
        device.type === 'mobile' ? "p-4" : "p-4"
      )}
      onClick={() => onItemSelect?.(item)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#191919] font-inter text-base truncate mb-1">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600 font-inter line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
        {onItemAction && (
          <ActionsMenu item={item} onAction={onItemAction} />
        )}
      </div>

      {/* Content Grid */}
      <div className={cn(
        "grid gap-4",
        device.type === 'mobile' ? "grid-cols-1 gap-3" : "grid-cols-2 lg:grid-cols-3"
      )}>
        {/* Status and Priority */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            {item.priority && (
              <PriorityBadge priority={item.priority} />
            )}
          </div>
          {item.riskLevel && (
            <RiskBadge riskLevel={item.riskLevel} />
          )}
        </div>

        {/* Assignee */}
        {item.assignee && (
          <div>
            <UserAvatar user={item.assignee} size={device.type === 'mobile' ? 'md' : 'sm'} />
          </div>
        )}

        {/* Progress */}
        {item.progress !== undefined && (
          <div>
            <DaisyProgressIndicator progress={item.progress} metadata={item.metadata} />
          </div>
        )}

        {/* Due Date */}
        {item.dueDate && (
          <div>
            <DateDisplay date={item.dueDate} label="Due" />
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className={device.type === 'mobile' ? "col-span-1" : "col-span-2 lg:col-span-3"}>
            <TagsDisplay tags={item.tags} />
          </div>
        )}
      </div>
    </div>
  );
};

// Detailed List Item Component
const DetailedListItem: React.FC<{
  item: EnhancedListItem;
  onItemAction?: (action: string, item: EnhancedListItem) => void;
  onItemSelect?: (item: EnhancedListItem) => void;
}> = ({ item, onItemAction, onItemSelect }) => {
  const device = useDevice();
  
  return (
    <div 
      className={cn(
        "group border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer",
        device.type === 'mobile' ? "p-4" : "p-6"
      )}
      onClick={() => onItemSelect?.(item)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {item.assignee && (
            <UserAvatar user={item.assignee} size="lg" showDetails={false} />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#191919] font-inter text-lg mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600 font-inter mb-3 line-clamp-3">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={item.status} />
              {item.priority && (
                <PriorityBadge priority={item.priority} />
              )}
              {item.riskLevel && (
                <RiskBadge riskLevel={item.riskLevel} />
              )}
            </div>
          </div>
        </div>
        {onItemAction && (
          <ActionsMenu item={item} onAction={onItemAction} />
        )}
      </div>

      {/* Content Grid */}
      <div className={cn(
        "grid gap-6",
        device.type === 'mobile' ? "grid-cols-1 gap-4" : "grid-cols-2 lg:grid-cols-3"
      )}>
        {/* Assignee Details */}
        {item.assignee && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-inter">
              Assigned To
            </h4>
            <UserAvatar user={item.assignee} />
            {device.type !== 'mobile' && (
              <div className="mt-2">
                <ContactInfo user={item.assignee} metadata={item.metadata} />
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {item.progress !== undefined && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-inter">
              Progress
            </h4>
            <DaisyProgressIndicator progress={item.progress} metadata={item.metadata} />
          </div>
        )}

        {/* Important Dates */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-inter">
            Timeline
          </h4>
          <div className="space-y-2">
            {item.dueDate && (
              <DateDisplay date={item.dueDate} label="Due Date" />
            )}
            {item.metadata?.lastActivity && (
              <DateDisplay date={item.metadata.lastActivity} label="Last Activity" />
            )}
            {item.createdAt && device.type !== 'mobile' && (
              <DateDisplay date={item.createdAt} label="Created" />
            )}
          </div>
        </div>

        {/* Metadata */}
        {item.metadata && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-inter">
              Details
            </h4>
            <div className="space-y-1">
              {item.metadata.department && (
                <div className="text-sm text-gray-600 font-inter">
                  <span className="font-medium">Department:</span> {item.metadata.department}
                </div>
              )}
              {item.category && (
                <div className="text-sm text-gray-600 font-inter">
                  <span className="font-medium">Category:</span> {item.category}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className={device.type === 'mobile' ? "col-span-1" : "col-span-2 lg:col-span-3"}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-inter">
              Tags
            </h4>
            <TagsDisplay tags={item.tags} />
          </div>
        )}
      </div>
    </div>
  );
};

// Main Enhanced List Component
export const EnhancedList: React.FC<EnhancedListProps> = ({
  title,
  subtitle,
  items,
  variant = 'default',
  searchable = true,
  filterable = true,
  sortable = true,
  selectable = false,
  onItemAction,
  onItemSelect,
  className,
  emptyMessage = "No items found",
  loading = false,
  showHeader = true,
}) => {
  const device = useDevice();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filter and sort data
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Apply search
    if (searchQuery) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.assignee && item.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(item => item.priority === priorityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          aValue = a.priority || '';
          bValue = b.priority || '';
          break;
        case 'assignee':
          aValue = a.assignee?.name || '';
          bValue = b.assignee?.name || '';
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date(0);
          bValue = b.dueDate ? new Date(b.dueDate) : new Date(0);
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, sortBy, sortDirection, statusFilter, priorityFilter]);

  const sortOptions: SortOption[] = [
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'progress', label: 'Progress' },
  ];

  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'error', label: 'Error' },
    { value: 'draft', label: 'Draft' },
  ];

  const priorityOptions: FilterOption[] = [
    { value: 'all', label: 'All Priority' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const renderItem = (item: EnhancedListItem) => {
    switch (variant) {
      case 'compact':
        return (
          <CompactListItem
            key={item.id}
            item={item}
            onItemAction={onItemAction}
            onItemSelect={onItemSelect}
          />
        );
      case 'detailed':
        return (
          <DetailedListItem
            key={item.id}
            item={item}
            onItemAction={onItemAction}
            onItemSelect={onItemSelect}
          />
        );
      default:
        return (
          <DefaultListItem
            key={item.id}
            item={item}
            onItemAction={onItemAction}
            onItemSelect={onItemSelect}
          />
        );
    }
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  return (
    <div className={cn("space-y-4 bg-white", device.type === 'mobile' ? 'space-y-3' : 'space-y-6', className)}>
      {/* Header */}
      {showHeader && (title || subtitle) && (
        <div className={cn("space-y-1", device.type === 'mobile' ? 'px-4' : '')}>
          {title && (
            <h2 className={cn("font-bold text-[#191919] font-inter", device.type === 'mobile' ? 'text-xl' : 'text-2xl')}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 font-inter">{subtitle}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className={cn(
        "flex flex-col gap-3",
        device.type === 'mobile' ? 'px-4' : 'flex-row items-center justify-between gap-4'
      )}>
        <div className={cn("flex gap-3", device.type === 'mobile' ? 'flex-col' : 'items-center')}>
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DaisyInput
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-10", device.type === 'mobile' ? 'w-full' : 'w-64')}
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {filterable && (
              <>
                <DaisySelect value={statusFilter} onValueChange={setStatusFilter} />
                  <DaisySelectTrigger className={cn("gap-2", device.type === 'mobile' ? 'w-full' : 'w-36')} />
                    <Filter className="h-4 w-4" />
                    <DaisySelectValue /></DaisyProgressIndicator>
                  <DaisySelectContent />
                    {statusOptions.map(option => (
                      <DaisySelectItem key={option.value} value={option.value} />
                        {option.label}
                      </DaisySelectContent>
                    ))}
                  </DaisySelectContent>
                </DaisySelect>

                <DaisySelect value={priorityFilter} onValueChange={setPriorityFilter} />
                  <DaisySelectTrigger className={cn("gap-2", device.type === 'mobile' ? 'w-full' : 'w-36')} />
                    <Star className="h-4 w-4" />
                    <DaisySelectValue /></DaisySelect>
                  <DaisySelectContent />
                    {priorityOptions.map(option => (
                      <DaisySelectItem key={option.value} value={option.value} />
                        {option.label}
                      </DaisySelectContent>
                    ))}
                  </DaisySelectContent>
                </DaisySelect>
              </>
            )}

            {/* Active Filter Indicators */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                {statusFilter !== 'all' && (
                  <DaisyBadge variant="secondary" className="text-xs" >
  Status: {statusOptions.find(o => o.value === statusFilter)?.label}
</DaisyBadge>
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => setStatusFilter('all')} />
                      <X className="h-2 w-2" />
                    </DaisyButton>
                  </DaisyBadge>
                )}
                {priorityFilter !== 'all' && (
                  <DaisyBadge variant="secondary" className="text-xs" >
  Priority: {priorityOptions.find(o => o.value === priorityFilter)?.label}
</DaisyBadge>
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => setPriorityFilter('all')} />
                      <X className="h-2 w-2" />
                    </DaisyButton>
                  </DaisyBadge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sort Controls */}
        {sortable && device.type !== 'mobile' && (
          <div className="flex items-center gap-2">
            <DaisySelect value={sortBy} onValueChange={setSortBy} />
              <DaisySelectTrigger className="w-32 gap-2" />
                <ArrowUpDown className="h-4 w-4" />
                <DaisySelectValue /></DaisySelect>
              <DaisySelectContent />
                {sortOptions.map(option => (
                  <DaisySelectItem key={option.value} value={option.value} />
                    {option.label}
                  </DaisySelectContent>
                ))}
              </DaisySelectContent>
            </DaisySelect>

            <DaisyButton
              variant="tertiary"
              size="sm"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} />
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </DaisyButton>
          </div>
        )}
      </div>

      {/* Items */}
      <div className={cn(
        "space-y-3",
        device.type === 'mobile' ? 'px-4' : '',
        variant === 'compact' ? 'space-y-2' : '',
        variant === 'detailed' ? 'space-y-4' : ''
      )}>
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#199BEC]" />
            <p className="text-sm text-gray-500 mt-2 font-inter">Loading...</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 inline-block mb-3">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-inter">{emptyMessage}</p>
          </div>
        ) : (
          filteredAndSortedItems.map(renderItem)
        )}
      </div>

      {/* Results Summary */}
      {!loading && filteredAndSortedItems.length > 0 && (
        <div className={cn("text-sm text-gray-600 font-inter", device.type === 'mobile' ? 'px-4' : '')}>
          Showing {filteredAndSortedItems.length} of {items.length} items
        </div>
      )}
    </div>
  );
}; 