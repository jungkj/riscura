'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

import {
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  BarChart3,
  Clock,
  Target,
  Search,
  Bell,
  ChevronRight,
  Home,
  Activity,
  Zap,
  Brain,
  Eye,
  Calendar,
  Settings,
  MoreHorizontal,
  ExternalLink,
  BookOpen,
  Upload
} from 'lucide-react';

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
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: 'success' | 'info' | 'warning';
  module: string;
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
  const [loading, setLoading] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'new-risk',
      title: 'Add New Risk',
      description: 'Document and assess a new risk',
      icon: Shield,
      href: '/dashboard/risks/new',
      color: 'text-red-600'
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
      icon: Brain,
      href: '/dashboard/aria',
      color: 'text-purple-600'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create compliance reports',
      icon: FileText,
      href: '/dashboard/reporting',
      color: 'text-green-600'
    }
  ];

  const recentActivity: RecentActivity[] = [
    { 
      id: 1, 
      action: 'Risk assessment completed for "Data Breach Scenario"', 
      user: 'Sarah Chen', 
      time: '2 hours ago', 
      type: 'success',
      module: 'Risk Management'
    },
    { 
      id: 2, 
      action: 'New control "Multi-Factor Authentication" added', 
      user: 'John Smith', 
      time: '4 hours ago', 
      type: 'info',
      module: 'Controls'
    },
    { 
      id: 3, 
      action: 'High-risk item flagged in compliance review', 
      user: 'Alex Johnson', 
      time: '6 hours ago', 
      type: 'warning',
      module: 'Compliance'
    },
    { 
      id: 4, 
      action: 'SOX compliance report generated successfully', 
      user: 'Maria Garcia', 
      time: '1 day ago', 
      type: 'success',
      module: 'Reports'
    },
    { 
      id: 5, 
      action: 'ARIA provided 12 new risk recommendations', 
      user: 'AI Assistant', 
      time: '1 day ago', 
      type: 'info',
      module: 'AI Insights'
    }
  ];

  const handleQuickAction = (href: string) => {
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-inter">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#191919] font-medium">Dashboard</span>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#191919] font-inter mb-2">
                Good morning, Sarah 👋
              </h1>
              <p className="text-gray-600 font-inter">
                Here's what's happening with your risk management today.
              </p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2 w-80 bg-[#FAFAFA] border-gray-200 focus:border-[#199BEC] focus:ring-[#199BEC]/20 rounded-xl font-inter"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-[#191919] hover:bg-[#FAFAFA]">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>

              {/* Profile */}
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/avatars/sarah.jpg" />
                  <AvatarFallback className="bg-[#199BEC] text-white text-sm font-semibold">SC</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#191919] font-inter">Sarah Chen</p>
                  <p className="text-xs text-gray-500">Risk Analyst</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="Total Risks"
            value={stats.totalRisks}
            icon={Shield}
            color="text-blue-600"
            trend="+2 this week"
            onClick={() => handleQuickAction('/dashboard/risks')}
          />
          <MetricCard
            title="High Risk Items"
            value={stats.highRisks}
            icon={AlertTriangle}
            color="text-red-600"
            urgent={stats.highRisks > 3}
            trend="↑ 1 since yesterday"
            onClick={() => handleQuickAction('/dashboard/risks?filter=high')}
          />
          <MetricCard
            title="Compliance Score"
            value={`${stats.complianceScore}%`}
            icon={Target}
            color="text-green-600"
            trend="+3% this month"
            onClick={() => handleQuickAction('/dashboard/compliance')}
          />
          <MetricCard
            title="Active Controls"
            value={stats.activeControls}
            icon={CheckCircle}
            color="text-green-600"
            trend="All operational"
            onClick={() => handleQuickAction('/dashboard/controls')}
          />
          <MetricCard
            title="Pending Actions"
            value={stats.pendingActions}
            icon={Clock}
            color="text-orange-600"
            urgent={stats.pendingActions > 5}
            trend="3 due today"
            onClick={() => handleQuickAction('/dashboard/workflows')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Quick Actions & AI Insights */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card className="bg-[#FAFAFA] border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#191919] font-inter font-bold">
                  <Zap className="h-5 w-5 text-[#199BEC]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.id} {...action} onClick={() => handleQuickAction(action.href)} />
                ))}
              </CardContent>
            </Card>

            {/* AI Insights Panel */}
            <Card className="bg-[#FAFAFA] border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#191919] font-inter font-bold">
                  <Brain className="h-5 w-5 text-[#199BEC]" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#199BEC] rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#191919] font-inter mb-1">Risk Trend Alert</h4>
                      <p className="text-sm text-gray-600 font-inter leading-relaxed">
                        ARIA detected a 15% increase in cybersecurity risks this month. Consider reviewing access controls.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#191919] font-inter mb-1">Compliance Improvement</h4>
                      <p className="text-sm text-gray-600 font-inter leading-relaxed">
                        Your SOX compliance score improved by 8% after implementing new controls.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleQuickAction('/dashboard/aria')}
                  className="w-full bg-[#199BEC] hover:bg-[#0f7dc7] text-white border-0 font-inter font-medium"
                >
                  Chat with ARIA
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Compliance Overview */}
          <div className="space-y-6">
            
            {/* Compliance Overview */}
            <Card className="bg-[#FAFAFA] border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#191919] font-inter font-bold">
                  <BarChart3 className="h-5 w-5 text-[#199BEC]" />
                  Compliance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Score */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#191919] font-inter">Overall Score</span>
                    <span className="text-2xl font-bold text-[#191919] font-inter">{stats.complianceScore}%</span>
                  </div>
                  <Progress value={stats.complianceScore} className="h-3 bg-gray-200" />
                  <p className="text-xs text-gray-500 font-inter">+3% improvement from last month</p>
                </div>
                
                {/* Framework Status */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-[#191919] font-inter">Framework Status</h4>
                  <div className="space-y-3">
                    <ComplianceItem label="SOC 2 Type II" status="compliant" percentage={98} />
                    <ComplianceItem label="ISO 27001" status="in-progress" percentage={85} />
                    <ComplianceItem label="GDPR" status="compliant" percentage={96} />
                    <ComplianceItem label="HIPAA" status="needs-review" percentage={78} />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-[#199BEC] text-[#199BEC] hover:bg-[#199BEC] hover:text-white font-inter font-medium"
                  onClick={() => handleQuickAction('/dashboard/compliance')}
                >
                  View Detailed Reports
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Risk Heatmap Preview */}
            <Card className="bg-[#FAFAFA] border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#191919] font-inter font-bold">
                  <Activity className="h-5 w-5 text-[#199BEC]" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-2xl font-bold text-red-600 font-inter">4</p>
                    <p className="text-xs text-red-600 font-medium font-inter">High Risk</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-2xl font-bold text-orange-600 font-inter">12</p>
                    <p className="text-xs text-orange-600 font-medium font-inter">Medium Risk</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-2xl font-bold text-green-600 font-inter">7</p>
                    <p className="text-xs text-green-600 font-medium font-inter">Low Risk</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full text-[#191919] hover:bg-gray-100 font-inter font-medium"
                  onClick={() => handleQuickAction('/dashboard/risks/heatmap')}
                >
                  View Risk Heatmap
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <Card className="bg-[#FAFAFA] border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-[#191919] font-inter font-bold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#199BEC]" />
                    Recent Activity
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#191919]">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} {...activity} />
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-[#191919] hover:bg-gray-100 font-inter font-medium"
                  onClick={() => handleQuickAction('/dashboard/activity')}
                >
                  View All Activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="bg-[#FAFAFA] border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#191919] font-inter font-bold">
                  <Calendar className="h-5 w-5 text-[#199BEC]" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919] font-inter">Quarterly risk review</p>
                      <p className="text-xs text-gray-500 font-inter">Due tomorrow</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919] font-inter">Control testing for MFA</p>
                      <p className="text-xs text-gray-500 font-inter">Due in 3 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191919] font-inter">SOC 2 audit preparation</p>
                      <p className="text-xs text-gray-500 font-inter">Due next week</p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-[#191919] hover:bg-gray-100 font-inter font-medium"
                  onClick={() => handleQuickAction('/dashboard/workflows/tasks')}
                >
                  View All Tasks
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Helper Components
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  urgent = false,
  trend,
  onClick 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  urgent?: boolean;
  trend?: string;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-[#FAFAFA] border-gray-200 ${
        urgent ? 'ring-2 ring-red-200 border-red-300' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {urgent && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 font-inter mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#191919] font-inter mb-2">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 font-inter">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="p-4 bg-white border border-gray-100 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#199BEC]/30 hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-[#191919] font-inter text-sm mb-1">{title}</h4>
          <p className="text-xs text-gray-600 font-inter leading-relaxed">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

function ComplianceItem({ 
  label, 
  status,
  percentage 
}: { 
  label: string; 
  status: 'compliant' | 'in-progress' | 'needs-review';
  percentage: number;
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'compliant':
        return { 
          color: 'bg-green-50 text-green-700 border-green-200', 
          text: 'Compliant',
          progressColor: 'bg-green-500'
        };
      case 'in-progress':
        return { 
          color: 'bg-orange-50 text-orange-700 border-orange-200', 
          text: 'In Progress',
          progressColor: 'bg-orange-500'
        };
      case 'needs-review':
        return { 
          color: 'bg-red-50 text-red-700 border-red-200', 
          text: 'Needs Review',
          progressColor: 'bg-red-500'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#191919] font-inter">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#191919] font-inter">{percentage}%</span>
          <Badge className={`${config.color} border text-xs font-medium`}>
            {config.text}
          </Badge>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${config.progressColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function ActivityItem({ 
  action, 
  user, 
  time, 
  type,
  module 
}: { 
  action: string; 
  user: string; 
  time: string; 
  type: 'success' | 'info' | 'warning';
  module: string;
}) {
  const getTypeConfig = () => {
    switch (type) {
      case 'success': 
        return { 
          color: 'bg-green-500', 
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100'
        };
      case 'warning': 
        return { 
          color: 'bg-orange-500', 
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-100'
        };
      case 'info': 
        return { 
          color: 'bg-blue-500', 
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className={`p-4 bg-white rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full ${config.color} mt-2 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#191919] font-inter leading-relaxed mb-1">{action}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-inter">
            <span>by {user}</span>
            <span>•</span>
            <span>{time}</span>
            <span>•</span>
            <Badge variant="outline" className="text-xs font-medium">
              {module}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}