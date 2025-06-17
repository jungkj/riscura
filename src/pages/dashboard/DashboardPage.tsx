'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import GuidedTour from '@/components/help/GuidedTour';
import { DashboardStatsModal } from '@/components/dashboard/DashboardStatsModal';

import {
  Shield,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  Settings,
  Activity,
  Zap,
  Upload,
  Target,
  Plus,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Grid3X3,
  Users,
  MessageSquare,
  UserPlus,
  Share2,
  Bell,
  Briefcase
} from 'lucide-react';
import Image from 'next/image';

// Import the interactive risk heat map component
import { RiskHeatMap as InteractiveRiskHeatMap } from '@/components/ui/interactive-risk-heatmap';

// Types
interface DashboardStats {
  totalRisks: number;
  highRisks: number;
  complianceScore: number;
  activeControls: number;
  pendingActions: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  badge?: string;
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  avatar?: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'compliance' | 'opportunity' | 'alert';
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRisks: 23,
    highRisks: 4,
    complianceScore: 94,
    activeControls: 18,
    pendingActions: 7
  });
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [selectedStatsModal, setSelectedStatsModal] = useState<any>(null);

  // Simulate loading for demonstration
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check if user is new and should see the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour && !loading) {
      // Auto-start tour for new users after a short delay
      const tourTimer = setTimeout(() => {
        setShowTour(true);
      }, 2000);
      return () => clearTimeout(tourTimer);
    }
  }, [loading]);

  const quickActions: QuickAction[] = [
    {
      id: 'new-risk',
      title: 'Add New Risk',
      description: 'Document and assess a new risk',
      icon: Shield,
      href: '/dashboard/risks/new',
      color: 'text-red-600',
      badge: 'Quick'
    },
    {
      id: 'import-rcsa',
      title: 'Import RCSA',
      description: 'Upload risk assessment data',
      icon: Upload,
      href: '/dashboard/import/rcsa',
      color: 'text-blue-600'
    },
    {
      id: 'ask-aria',
      title: 'Ask ARIA',
      description: 'Get AI-powered insights',
      icon: () => <Image src="/images/logo/riscura.png" alt="Riscura" width={20} height={20} />,
      href: '/dashboard/aria',
      color: 'text-[#199BEC]',
      badge: 'AI'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create compliance reports',
      icon: FileText,
      href: '/dashboard/reporting',
      color: 'text-green-600'
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Conduct risk evaluation',
      icon: Target,
      href: '/dashboard/risks/assessment',
      color: 'text-orange-600'
    },
    {
      id: 'compliance-check',
      title: 'Compliance Check',
      description: 'Review framework status',
      icon: CheckCircle2,
      href: '/dashboard/compliance',
      color: 'text-emerald-600'
    },
    {
      id: 'create-spreadsheet',
      title: 'Create Spreadsheet',
      description: 'Build RCSA matrix or risk register',
      icon: Grid3X3,
      href: '/dashboard/spreadsheets',
      color: 'text-indigo-600',
      badge: 'New'
    },
    {
      id: 'team-assign',
      title: 'Assign Team Member',
      description: 'Delegate risk ownership',
      icon: UserPlus,
      href: '/dashboard/team/assign',
      color: 'text-purple-600',
      badge: 'Team'
    },
    {
      id: 'team-share',
      title: 'Share Risk Report',
      description: 'Collaborate with team members',
      icon: Share2,
      href: '/dashboard/team/share',
      color: 'text-teal-600',
      badge: 'Team'
    }
  ];

  const recentActivity: RecentActivity[] = [
    { 
      id: 1, 
      action: 'Risk assessment completed for "Data Breach Scenario"', 
      user: 'Sarah Chen', 
      time: '2 hours ago', 
      type: 'success',
      module: 'Risk Management',
      avatar: 'SC'
    },
    { 
      id: 2, 
      action: 'New control "Multi-Factor Authentication" added', 
      user: 'John Smith', 
      time: '4 hours ago', 
      type: 'info',
      module: 'Controls',
      avatar: 'JS'
    },
    { 
      id: 3, 
      action: 'Compliance report generated for SOC 2', 
      user: 'Lisa Wang', 
      time: '6 hours ago', 
      type: 'success',
      module: 'Compliance',
      avatar: 'LW'
    },
    { 
      id: 4, 
      action: 'High-risk vulnerability detected in payment system', 
      user: 'System Alert', 
      time: '8 hours ago', 
      type: 'warning',
      module: 'Monitoring',
      avatar: 'SA'
    },
    { 
      id: 5, 
      action: 'Quarterly risk review meeting scheduled', 
      user: 'Mike Johnson', 
      time: '1 day ago', 
      type: 'info',
      module: 'Planning',
      avatar: 'MJ'
    }
  ];

  const insights: Insight[] = [
    {
      id: '1',
      title: 'Critical Risk Trend',
      description: 'High-risk incidents have increased by 15% this month. Consider reviewing security protocols.',
      type: 'risk',
      priority: 'high',
      action: 'Review Security'
    },
    {
      id: '2',
      title: 'Compliance Opportunity',
      description: 'Your SOC 2 compliance score has improved. Consider pursuing additional certifications.',
      type: 'opportunity',
      priority: 'medium',
      action: 'Explore Certifications'
    },
    {
      id: '3',
      title: 'Control Effectiveness',
      description: 'Multi-factor authentication controls are performing exceptionally well.',
      type: 'compliance',
      priority: 'low'
    }
  ];

  const handleQuickAction = (href: string, actionId?: string) => {
    if (actionId === 'guided-tour') {
      setShowTour(true);
      return;
    }
    
    router.push(href);
    
    // Show success toast for certain actions
    if (actionId === 'new-risk') {
      toast({
        title: "Risk Creation",
        description: "Opening risk creation form...",
      });
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
    toast({
      title: "Tour Complete!",
      description: "You're ready to start managing risks effectively.",
    });
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
  };

  const getStatsModalData = (type: string) => {
    switch (type) {
      case 'totalRisks':
        return {
          type: 'totalRisks' as const,
          title: 'Total Risks',
          value: stats.totalRisks,
          description: 'Complete overview of all identified risks across your organization',
          details: {
            overview: 'Your organization currently has 23 identified risks spanning across various categories and business units. This represents a comprehensive risk landscape that requires ongoing monitoring and management.',
            breakdown: [
              { label: 'Critical Risks', value: 2, color: '#ef4444', percentage: 9 },
              { label: 'High Risks', value: 4, color: '#f97316', percentage: 17 },
              { label: 'Medium Risks', value: 12, color: '#eab308', percentage: 52 },
              { label: 'Low Risks', value: 5, color: '#22c55e', percentage: 22 }
            ],
            recentItems: [
              { id: 'RSK-001', title: 'Critical System Failure', status: 'Under Review', date: '2 hours ago', priority: 'high' as const },
              { id: 'RSK-002', title: 'Data Privacy Compliance', status: 'Mitigated', date: '1 day ago', priority: 'medium' as const },
              { id: 'RSK-003', title: 'Vendor Risk Assessment', status: 'In Progress', date: '3 days ago', priority: 'medium' as const }
            ],
            insights: [
              { text: 'Risk count has decreased by 8% over the last quarter', type: 'positive' as const },
              { text: 'Technology risks represent 35% of total risk exposure', type: 'neutral' as const },
              { text: 'Three new risks identified in the last week', type: 'negative' as const }
            ]
          },
          actions: [
            { label: 'View All Risks', href: '/dashboard/risks', variant: 'default' as const },
            { label: 'Add New Risk', href: '/dashboard/risks/new', variant: 'secondary' as const },
            { label: 'Risk Reports', href: '/dashboard/reporting', variant: 'secondary' as const }
          ]
        };
      case 'highRisks':
        return {
          type: 'highRisks' as const,
          title: 'High Priority Risks',
          value: stats.highRisks,
          description: 'Critical and high-priority risks requiring immediate attention',
          details: {
            overview: 'You have 4 high-priority risks that require immediate attention and management. These risks pose significant threats to your organization and should be addressed promptly.',
            breakdown: [
              { label: 'Critical Risks', value: 2, color: '#dc2626', percentage: 50 },
              { label: 'High Risks', value: 2, color: '#ea580c', percentage: 50 }
            ],
            recentItems: [
              { id: 'RSK-001', title: 'Critical System Failure', status: 'Active', date: 'Today', priority: 'high' as const },
              { id: 'RSK-004', title: 'Supply Chain Disruption', status: 'Escalated', date: 'Yesterday', priority: 'high' as const }
            ],
            insights: [
              { text: 'Average resolution time for high-priority risks: 5.2 days', type: 'neutral' as const },
              { text: 'Two critical risks require executive attention', type: 'negative' as const }
            ]
          },
          actions: [
            { label: 'View High Priority', href: '/dashboard/risks?priority=high', variant: 'default' as const },
            { label: 'Risk Assessment', href: '/dashboard/risks/assessment', variant: 'secondary' as const }
          ]
        };
      case 'compliance':
        return {
          type: 'compliance' as const,
          title: 'Compliance Score',
          value: `${stats.complianceScore}%`,
          description: 'Overall compliance status across all regulatory frameworks',
          details: {
            overview: 'Your organization maintains a strong 94% compliance score across all applicable regulatory frameworks. This reflects excellent adherence to industry standards and regulations.',
            breakdown: [
              { label: 'SOC 2 Type II', value: 98, color: '#16a34a', percentage: 98 },
              { label: 'ISO 27001', value: 95, color: '#16a34a', percentage: 95 },
              { label: 'GDPR', value: 92, color: '#16a34a', percentage: 92 },
              { label: 'HIPAA', value: 89, color: '#eab308', percentage: 89 }
            ],
            insights: [
              { text: 'Compliance score improved by 3% this quarter', type: 'positive' as const },
              { text: 'All major frameworks maintain >90% compliance', type: 'positive' as const },
              { text: 'HIPAA compliance needs attention', type: 'negative' as const }
            ]
          },
          actions: [
            { label: 'Compliance Dashboard', href: '/dashboard/compliance', variant: 'default' as const },
            { label: 'Generate Report', href: '/dashboard/reporting', variant: 'secondary' as const }
          ]
        };
      case 'activeControls':
        return {
          type: 'activeControls' as const,
          title: 'Active Controls',
          value: stats.activeControls,
          description: 'Security controls currently active and protecting your organization',
          details: {
            overview: 'Your organization has 18 active security controls deployed across various domains, providing comprehensive protection against identified risks.',
            breakdown: [
              { label: 'Preventive Controls', value: 8, color: '#3b82f6', percentage: 44 },
              { label: 'Detective Controls', value: 6, color: '#8b5cf6', percentage: 33 },
              { label: 'Corrective Controls', value: 4, color: '#06b6d4', percentage: 23 }
            ],
            recentItems: [
              { id: 'CTL-001', title: 'Multi-Factor Authentication', status: 'Active', date: 'Running', priority: 'high' as const },
              { id: 'CTL-002', title: 'Endpoint Detection', status: 'Active', date: 'Running', priority: 'high' as const },
              { id: 'CTL-003', title: 'Access Reviews', status: 'Scheduled', date: 'Next week', priority: 'medium' as const }
            ],
            insights: [
              { text: 'All critical controls are functioning properly', type: 'positive' as const },
              { text: 'Control effectiveness rated at 92%', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'View Controls', href: '/dashboard/controls', variant: 'default' as const },
            { label: 'Control Testing', href: '/dashboard/controls/testing', variant: 'secondary' as const }
          ]
        };
      case 'pendingActions':
        return {
          type: 'pendingActions' as const,
          title: 'Pending Actions',
          value: stats.pendingActions,
          description: 'Outstanding actions and tasks requiring completion',
          details: {
            overview: 'You have 7 pending actions that require attention. These include risk assessments, control implementations, and compliance reviews.',
            breakdown: [
              { label: 'Risk Assessments', value: 3, color: '#ef4444', percentage: 43 },
              { label: 'Control Updates', value: 2, color: '#f97316', percentage: 29 },
              { label: 'Compliance Reviews', value: 2, color: '#eab308', percentage: 28 }
            ],
            recentItems: [
              { id: 'ACT-001', title: 'Quarterly Risk Review', status: 'Due Today', date: 'Today', priority: 'high' as const },
              { id: 'ACT-002', title: 'Update Access Controls', status: 'Overdue', date: '2 days ago', priority: 'high' as const },
              { id: 'ACT-003', title: 'Vendor Assessment', status: 'In Progress', date: 'Due Tomorrow', priority: 'medium' as const }
            ],
            insights: [
              { text: 'Two actions are overdue and require immediate attention', type: 'negative' as const },
              { text: 'Average completion time has improved by 15%', type: 'positive' as const }
            ]
          },
          actions: [
            { label: 'View All Actions', href: '/dashboard/actions', variant: 'default' as const },
            { label: 'Create Action', href: '/dashboard/actions/new', variant: 'secondary' as const }
          ]
        };
      default:
        return null;
    }
  };

  const handleStatsCardClick = (type: string) => {
    const modalData = getStatsModalData(type);
    setSelectedStatsModal(modalData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-tour="dashboard-main">
      {/* Guided Tour Component */}
      {showTour && (
        <GuidedTour
          tourId="platform-overview"
          autoStart={true}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
          showProgress={true}
          allowSkip={true}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between" data-tour="dashboard-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#191919]">Dashboard</h1>
            <Badge variant="secondary" className="bg-[#D8C3A5] text-[#191919] font-semibold">
              Live
            </Badge>
          </div>
          <p className="text-[#A8A8A8] font-semibold">Welcome back! Here's your risk management overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setShowTour(true)}
            className="text-sm border-[#D8C3A5] text-[#191919] hover:bg-[#D8C3A5]"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Take Tour
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/risks/new')}
            className="bg-[#191919] text-white hover:bg-[#333333]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" data-tour="dashboard-stats">
        <Card 
          className="bg-white border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-gray-300"
          onClick={() => handleStatsCardClick('totalRisks')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Risks</p>
                <p className="text-3xl font-bold text-[#191919]">{stats.totalRisks}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-gray-300"
          onClick={() => handleStatsCardClick('highRisks')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">High Priority</p>
                <p className="text-3xl font-bold text-[#191919]">{stats.highRisks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-gray-300"
          onClick={() => handleStatsCardClick('compliance')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Compliance</p>
                <p className="text-3xl font-bold text-[#191919]">{stats.complianceScore}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-gray-300"
          onClick={() => handleStatsCardClick('activeControls')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Controls</p>
                <p className="text-3xl font-bold text-[#191919]">{stats.activeControls}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-gray-300"
          onClick={() => handleStatsCardClick('pendingActions')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Actions</p>
                <p className="text-3xl font-bold text-[#191919]">{stats.pendingActions}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-4" data-tour="quick-actions">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="text-[#191919] font-bold">Quick Actions</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold text-xs">
                  {quickActions.length} Available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <QuickActionCard
                  key={action.id}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  color={action.color}
                  badge={action.badge}
                  onClick={() => handleQuickAction(action.href, action.id)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Risk Heat Map - Expanded */}
        <div className="lg:col-span-8" data-tour="risk-heatmap">
          <InteractiveRiskHeatMap />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card data-tour="recent-activity" className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-[#191919] font-bold">Recent Activity</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold text-xs">
                {recentActivity.length} Updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  action={activity.action}
                  user={activity.user}
                  time={activity.time}
                  type={activity.type}
                  module={activity.module}
                  avatar={activity.avatar}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card data-tour="ai-insights" className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image 
                  src="/images/logo/riscura.png" 
                  alt="Riscura" 
                  width={20} 
                  height={20}
                />
                <span className="text-[#191919] font-bold">AI Insights</span>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold text-xs">
                {insights.length} Insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      {insight.action && (
                        <Button variant="secondary" size="sm">
                          {insight.action}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Collaboration Section - Small Team Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Status */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-[#191919] font-bold">Team Status</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold text-xs">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#191919]">Sarah Chen</p>
                    <p className="text-xs text-gray-500">Risk Manager • Online</p>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 text-xs">3 Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#191919]">John Smith</p>
                    <p className="text-xs text-gray-500">Compliance Officer • Away</p>
                  </div>
                </div>
                <Badge className="bg-orange-50 text-orange-700 text-xs">2 Pending</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#191919]">Lisa Wang</p>
                    <p className="text-xs text-gray-500">IT Security • Online</p>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 text-xs">1 Review</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Team Actions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <span className="text-[#191919] font-bold">Team Actions</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold text-xs">
                Small Team
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => router.push('/dashboard/team/delegate')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <UserPlus className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[#191919]">Delegate Risk</p>
                  <p className="text-xs text-gray-500">Assign ownership to team member</p>
                </div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => router.push('/dashboard/team/chat')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[#191919]">Team Chat</p>
                  <p className="text-xs text-gray-500">Discuss risks and controls</p>
                </div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
              onClick={() => router.push('/dashboard/team/notifications')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Bell className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[#191919]">Team Alerts</p>
                  <p className="text-xs text-gray-500">Set up notifications for team</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Small Team Insights */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-[#191919] font-bold">Team Efficiency</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold text-xs">
                Optimized
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Risk Resolution Rate</span>
                <span className="text-sm font-bold text-green-600">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Team Collaboration</span>
                <span className="text-sm font-bold text-blue-600">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Response Time</span>
                <span className="text-sm font-bold text-purple-600">2.1 hrs</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Team efficiency improved by 12% this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Modal */}
      <DashboardStatsModal
        isOpen={!!selectedStatsModal}
        onClose={() => setSelectedStatsModal(null)}
        data={selectedStatsModal}
      />
    </div>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  badge,
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group bg-white"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
          <Icon className={`w-5 h-5 ${color} transition-colors`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[#191919] transition-colors">{title}</h3>
            {badge && (
              <Badge 
                variant="secondary" 
                className={`text-xs font-semibold ${
                  badge === 'Quick' ? 'bg-green-100 text-green-800' :
                  badge === 'AI' ? 'bg-blue-100 text-blue-800' :
                  badge === 'New' ? 'bg-orange-100 text-orange-800' :
                  badge === 'Team' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#A8A8A8] font-semibold">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ 
  action, 
  user, 
  time, 
  type,
  module,
  avatar
}: { 
  action: string; 
  user: string; 
  time: string; 
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  avatar?: string;
}) {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const getModuleBadgeColor = (module: string) => {
    const moduleLower = module.toLowerCase();
    switch (moduleLower) {
      case 'risk management':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'compliance':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'monitoring':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'controls':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'planning':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 mb-1">{action}</p>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-gray-500">{user}</p>
          <span className="text-xs text-gray-400">•</span>
          <p className="text-xs text-gray-500">{time}</p>
          <span className="text-xs text-gray-400">•</span>
          <Badge className={`text-xs border ${getModuleBadgeColor(module)}`}>
            {module}
          </Badge>
        </div>
      </div>
      <div className={`p-1 rounded-full ${config.bg} flex-shrink-0`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
      </div>
    </div>
  );
}