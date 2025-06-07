'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ResponsiveDataTable } from '@/components/ui/ResponsiveDataTable';
import { 
  TouchButton, 
  SwipeableCard, 
  TouchSlider,
  PullToRefresh,
  TouchChip 
} from '@/components/ui/TouchElements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Calendar,
  Settings,
  Filter,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  FileText,
  Activity,
  Clock,
  MapPin,
  Star,
  Archive,
  Share2,
  Flag,
  Bookmark,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Bell,
  Info,
  Zap,
  Globe,
  Lock,
  Unlock,
  DollarSign,
  Percent,
  Hash,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  Link,
  Heart,
  MessageSquare,
  Tag,
  Layers,
  Grid,
  List,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  Navigation,
  Compass,
  Anchor,
  Award,
  Briefcase,
  Building,
  Camera,
  Car,
  Cloud,
  Coffee,
  Command,
  Database,
  Folder,
  Gift,
  Home,
  Image,
  Laptop,
  Lightbulb,
  Monitor,
  Package,
  PieChart,
  Printer,
  Server,
  Smartphone,
  Tablet,
  Truck,
  Tv,
  Umbrella,
  Watch,
  Wifi,
  Wrench,
} from 'lucide-react';

// Sample Data
const riskMetrics = [
  {
    id: 'total-risks',
    title: 'Total Risks',
    value: 156,
    previousValue: 144,
    trend: 8.3,
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'high-priority',
    title: 'High Priority',
    value: 23,
    previousValue: 26,
    trend: -11.5,
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'completed',
    title: 'Completed Assessments',
    value: 89,
    previousValue: 74,
    trend: 20.3,
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'controls',
    title: 'Active Controls',
    value: 342,
    previousValue: 328,
    trend: 4.3,
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

const riskData = [
  {
    id: 'RISK-001',
    title: 'Data Breach Vulnerability',
    category: 'Cybersecurity',
    probability: 'High',
    impact: 'Critical',
    riskScore: 85,
    status: { label: 'Open', variant: 'destructive' },
    owner: { name: 'Sarah Johnson', avatar: '', role: 'CISO' },
    lastReview: '2024-01-15',
    nextReview: '2024-02-15',
    controls: 3,
    department: 'IT Security',
    tags: ['Critical', 'Urgent', 'Compliance'],
    progress: { value: 25, label: 'Mitigation Progress' },
  },
  {
    id: 'RISK-002',
    title: 'Regulatory Compliance Gap',
    category: 'Compliance',
    probability: 'Medium',
    impact: 'High',
    riskScore: 72,
    status: { label: 'In Progress', variant: 'default' },
    owner: { name: 'Michael Chen', avatar: '', role: 'Compliance Officer' },
    lastReview: '2024-01-20',
    nextReview: '2024-02-20',
    controls: 5,
    department: 'Legal',
    tags: ['Regulatory', 'SOX', 'GDPR'],
    progress: { value: 60, label: 'Compliance Progress' },
  },
  {
    id: 'RISK-003',
    title: 'Supply Chain Disruption',
    category: 'Operational',
    probability: 'Medium',
    impact: 'Medium',
    riskScore: 58,
    status: { label: 'Monitoring', variant: 'secondary' },
    owner: { name: 'Emily Rodriguez', avatar: '', role: 'Operations Manager' },
    lastReview: '2024-01-18',
    nextReview: '2024-02-18',
    controls: 7,
    department: 'Operations',
    tags: ['Supply Chain', 'Vendor', 'Business Continuity'],
    progress: { value: 80, label: 'Mitigation Progress' },
  },
  {
    id: 'RISK-004',
    title: 'Market Volatility Impact',
    category: 'Financial',
    probability: 'High',
    impact: 'Medium',
    riskScore: 65,
    status: { label: 'Open', variant: 'destructive' },
    owner: { name: 'David Kim', avatar: '', role: 'CFO' },
    lastReview: '2024-01-22',
    nextReview: '2024-02-22',
    controls: 4,
    department: 'Finance',
    tags: ['Market Risk', 'Financial', 'Economic'],
    progress: { value: 15, label: 'Analysis Progress' },
  },
  {
    id: 'RISK-005',
    title: 'Talent Retention Risk',
    category: 'Human Resources',
    probability: 'Medium',
    impact: 'Medium',
    riskScore: 45,
    status: { label: 'Closed', variant: 'outline' },
    owner: { name: 'Lisa Thompson', avatar: '', role: 'HR Director' },
    lastReview: '2024-01-25',
    nextReview: '2024-03-25',
    controls: 6,
    department: 'Human Resources',
    tags: ['HR', 'Retention', 'Culture'],
    progress: { value: 100, label: 'Resolution Complete' },
  },
];

const riskColumns = [
  {
    id: 'title',
    header: 'Risk Title',
    accessor: 'title',
    priority: 1,
    sortable: true,
    searchable: true,
    cellRenderer: (value: string, item: any) => (
      <div className="space-y-1">
        <div className="font-medium text-body-sm">{value}</div>
        <div className="text-caption text-text-secondary">{item.id}</div>
      </div>
    ),
  },
  {
    id: 'riskScore',
    header: 'Risk Score',
    accessor: 'riskScore',
    priority: 2,
    sortable: true,
    align: 'center' as const,
    cellRenderer: (value: number) => (
      <div className="text-center">
        <div className={cn(
          "inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold",
          value >= 80 ? "bg-red-100 text-red-800" :
          value >= 60 ? "bg-orange-100 text-orange-800" :
          value >= 40 ? "bg-yellow-100 text-yellow-800" :
          "bg-green-100 text-green-800"
        )}>
          {value}
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    priority: 3,
    type: 'badge',
    align: 'center' as const,
  },
  {
    id: 'owner',
    header: 'Owner',
    accessor: 'owner',
    priority: 4,
    type: 'user',
  },
  {
    id: 'category',
    header: 'Category',
    accessor: 'category',
    priority: 5,
    searchable: true,
    cellRenderer: (value: string) => (
      <TouchChip size="sm" variant="outline">
        {value}
      </TouchChip>
    ),
  },
  {
    id: 'progress',
    header: 'Progress',
    accessor: 'progress',
    priority: 6,
    type: 'progress',
  },
  {
    id: 'nextReview',
    header: 'Next Review',
    accessor: 'nextReview',
    priority: 7,
    type: 'date',
    cellRenderer: (value: string) => (
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-text-secondary" />
        <span className="text-body-sm">{new Date(value).toLocaleDateString()}</span>
      </div>
    ),
  },
  {
    id: 'controls',
    header: 'Controls',
    accessor: 'controls',
    priority: 8,
    align: 'center' as const,
    cellRenderer: (value: number) => (
      <Badge variant="secondary" className="font-mono">
        {value}
      </Badge>
    ),
  },
];

// Metric Card Component
const MetricCard: React.FC<{
  metric: typeof riskMetrics[0];
  onClick?: () => void;
}> = ({ metric, onClick }) => {
  const Icon = metric.icon;
  const isPositive = metric.trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <SwipeableCard
      leftAction={{
        icon: <Star className="h-4 w-4" />,
        label: 'Favorite',
        color: 'bg-yellow-500',
      }}
      rightAction={{
        icon: <Share2 className="h-4 w-4" />,
        label: 'Share',
        color: 'bg-blue-500',
      }}
      onSwipeLeft={() => console.log('Share metric', metric.id)}
      onSwipeRight={() => console.log('Favorite metric', metric.id)}
    >
      <Card className="hover:shadow-notion-sm transition-all duration-200 cursor-pointer">
        <CardContent className="p-enterprise-4" onClick={onClick}>
          <div className="flex items-center justify-between">
            <div className="space-y-enterprise-2">
              <div className="flex items-center space-x-enterprise-3">
                <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                  <Icon className={cn("h-5 w-5", metric.color)} />
                </div>
                <div>
                  <p className="text-caption font-medium text-text-secondary uppercase tracking-wide">
                    {metric.title}
                  </p>
                  <p className="text-heading-md font-bold text-text-primary">
                    {metric.value.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-enterprise-2">
                <div className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-caption font-medium",
                  isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(metric.trend)}%</span>
                </div>
                <span className="text-caption text-text-secondary">
                  vs previous period
                </span>
              </div>
            </div>
            
            <div className="text-right space-y-enterprise-1">
              <BarChart3 className="h-5 w-5 text-text-secondary ml-auto" />
              <div className="text-caption text-text-secondary">
                {metric.previousValue} → {metric.value}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
};

// Risk Filter Component
const RiskFilters: React.FC<{
  onFiltersChange: (filters: any) => void;
}> = ({ onFiltersChange }) => {
  const [riskScore, setRiskScore] = useState(50);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const categories = ['Cybersecurity', 'Compliance', 'Operational', 'Financial', 'Human Resources'];
  const statuses = ['Open', 'In Progress', 'Monitoring', 'Closed'];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  useEffect(() => {
    onFiltersChange({
      riskScore,
      categories: selectedCategories,
      statuses: selectedStatuses,
    });
  }, [riskScore, selectedCategories, selectedStatuses, onFiltersChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-enterprise-2">
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-enterprise-6">
        {/* Risk Score Slider */}
        <div>
          <TouchSlider
            value={riskScore}
            onChange={setRiskScore}
            min={0}
            max={100}
            step={5}
            showValue={true}
            aria-label="Minimum Risk Score"
          />
        </div>

        {/* Categories */}
        <div className="space-y-enterprise-3">
          <h4 className="text-body-sm font-medium">Categories</h4>
          <div className="flex flex-wrap gap-enterprise-2">
            {categories.map((category) => (
              <TouchChip
                key={category}
                onClick={() => handleCategoryToggle(category)}
                variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                size="sm"
              >
                {category}
              </TouchChip>
            ))}
          </div>
        </div>

        {/* Statuses */}
        <div className="space-y-enterprise-3">
          <h4 className="text-body-sm font-medium">Status</h4>
          <div className="flex flex-wrap gap-enterprise-2">
            {statuses.map((status) => (
              <TouchChip
                key={status}
                onClick={() => handleStatusToggle(status)}
                variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
                size="sm"
              >
                {status}
              </TouchChip>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <TouchButton
          variant="outline"
          className="w-full"
          onClick={() => {
            setRiskScore(50);
            setSelectedCategories([]);
            setSelectedStatuses([]);
          }}
        >
          Clear Filters
        </TouchButton>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActions: React.FC = () => {
  const actions = [
    {
      id: 'new-risk',
      label: 'New Risk',
      icon: <Plus className="h-4 w-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => console.log('Create new risk'),
    },
    {
      id: 'assessment',
      label: 'Assessment',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => console.log('Start assessment'),
    },
    {
      id: 'report',
      label: 'Generate Report',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => console.log('Generate report'),
    },
    {
      id: 'import',
      label: 'Import Data',
      icon: <Download className="h-4 w-4" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => console.log('Import data'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-enterprise-2">
          <Zap className="h-5 w-5" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-enterprise-3">
          {actions.map((action) => (
            <TouchButton
              key={action.id}
              variant="default"
              className={cn("h-16 flex-col space-y-1", action.color)}
              onClick={action.onClick}
              hapticFeedback
            >
              {action.icon}
              <span className="text-caption">{action.label}</span>
            </TouchButton>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export const ResponsiveRiskDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({});

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleMetricClick = (metric: typeof riskMetrics[0]) => {
    console.log('Metric clicked:', metric.id);
    // Navigate to detailed view
  };

  const handleRiskClick = (risk: any) => {
    console.log('Risk clicked:', risk.id);
    // Navigate to risk detail
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Risk Management' }
  ];

  const pageActions = (
    <div className="flex items-center space-x-enterprise-2">
      <TouchButton variant="outline" size="sm">
        <Settings className="h-4 w-4" />
      </TouchButton>
      <TouchButton variant="outline" size="sm">
        <Download className="h-4 w-4" />
        Export
      </TouchButton>
      <TouchButton size="sm" hapticFeedback>
        <Plus className="h-4 w-4" />
        New Risk
      </TouchButton>
    </div>
  );

  return (
    <ResponsiveLayout
      pageTitle="Risk Management Dashboard"
      pageDescription="Monitor, assess, and manage organizational risks"
      breadcrumbs={breadcrumbs}
      actions={pageActions}
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-enterprise-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-enterprise-4">
            {riskMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                onClick={() => handleMetricClick(metric)}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:inline-flex">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-enterprise-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-enterprise-6">
                {/* Risk Table */}
                <div className="lg:col-span-3">
                  <ResponsiveDataTable
                    data={riskData}
                    columns={riskColumns}
                    searchable={true}
                    sortable={true}
                    selectable={true}
                    pagination={true}
                    pageSize={10}
                    exportable={true}
                    onRowClick={handleRiskClick}
                    mobileLayout="cards"
                    variant="comfortable"
                  />
                </div>

                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <RiskFilters onFiltersChange={setFilters} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-enterprise-6">
              {/* Full Risk Management Interface */}
              <ResponsiveDataTable
                data={riskData}
                columns={riskColumns}
                searchable={true}
                sortable={true}
                selectable={true}
                pagination={true}
                pageSize={20}
                exportable={true}
                filterable={true}
                onRowClick={handleRiskClick}
                mobileLayout="cards"
                variant="default"
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-enterprise-6">
              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-surface-secondary rounded-lg">
                      <div className="text-center space-y-enterprise-2">
                        <PieChart className="h-12 w-12 text-text-secondary mx-auto" />
                        <p className="text-body-sm text-text-secondary">Chart placeholder</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-surface-secondary rounded-lg">
                      <div className="text-center space-y-enterprise-2">
                        <BarChart3 className="h-12 w-12 text-text-secondary mx-auto" />
                        <p className="text-body-sm text-text-secondary">Chart placeholder</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-enterprise-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-enterprise-4">
                {[
                  {
                    id: 1,
                    action: 'Risk Assessment Completed',
                    description: 'Data Breach Vulnerability assessment updated',
                    time: '2 hours ago',
                    user: 'Sarah Johnson',
                    type: 'assessment',
                  },
                  {
                    id: 2,
                    action: 'New Control Added',
                    description: 'Multi-factor authentication control implemented',
                    time: '4 hours ago',
                    user: 'Michael Chen',
                    type: 'control',
                  },
                  {
                    id: 3,
                    action: 'Risk Status Updated',
                    description: 'Supply Chain Disruption moved to Monitoring',
                    time: '6 hours ago',
                    user: 'Emily Rodriguez',
                    type: 'status',
                  },
                ].map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-enterprise-3 pb-enterprise-3 border-b border-border last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {activity.type === 'assessment' && <FileText className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'control' && <Shield className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'status' && <Flag className="h-4 w-4 text-blue-600" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium">{activity.action}</p>
                      <p className="text-caption text-text-secondary">{activity.description}</p>
                      <div className="flex items-center space-x-enterprise-4 mt-enterprise-1">
                        <span className="text-caption text-text-secondary">{activity.time}</span>
                        <span className="text-caption text-text-secondary">by {activity.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PullToRefresh>
    </ResponsiveLayout>
  );
};

export default ResponsiveRiskDashboard;
