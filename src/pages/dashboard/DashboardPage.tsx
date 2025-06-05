'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Target
} from 'lucide-react';

// Types
interface DashboardStats {
  totalRisks: number;
  highRisks: number;
  complianceScore: number;
  activeControls: number;
  pendingActions: number;
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

  const quickActions = [
    {
      title: 'Add Risk',
      description: 'Document a new risk',
      icon: Shield,
      href: '/dashboard/risks',
      color: 'text-red-600'
    },
    {
      title: 'View Reports',
      description: 'Create reports',
      icon: FileText,
      href: '/dashboard/reporting',
      color: 'text-blue-600'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'Risk assessment completed', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'New control added', user: 'Jane Smith', time: '4 hours ago', type: 'info' },
    { id: 3, action: 'High-risk item flagged', user: 'Bob Wilson', time: '6 hours ago', type: 'warning' },
    { id: 4, action: 'Compliance report generated', user: 'Alice Johnson', time: '1 day ago', type: 'success' }
  ];

  const handleQuickAction = (href: string) => {
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Risk Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your organization's risk posture and compliance status</p>
        </div>
        <Button 
          onClick={() => handleQuickAction('/dashboard/risks')}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Risk
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Risks"
          value={stats.totalRisks}
          icon={Shield}
          color="text-blue-600"
          onClick={() => handleQuickAction('/dashboard/risks')}
        />
        <MetricCard
          title="High Risk Items"
          value={stats.highRisks}
          icon={AlertTriangle}
          color="text-red-600"
          urgent={stats.highRisks > 0}
          onClick={() => handleQuickAction('/dashboard/risks')}
        />
        <MetricCard
          title="Compliance Score"
          value={`${stats.complianceScore}%`}
          icon={Target}
          color="text-green-600"
          onClick={() => handleQuickAction('/dashboard/reporting')}
        />
        <MetricCard
          title="Active Controls"
          value={stats.activeControls}
          icon={CheckCircle}
          color="text-green-600"
          onClick={() => handleQuickAction('/dashboard/controls')}
        />
        <MetricCard
          title="Pending Actions"
          value={stats.pendingActions}
          icon={Clock}
          color="text-orange-600"
          urgent={stats.pendingActions > 5}
          onClick={() => handleQuickAction('/dashboard/workflows')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                onClick={() => handleQuickAction('/dashboard/risks')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Add Risk
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleQuickAction('/dashboard/reporting')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Score</span>
                <span className="font-semibold">{stats.complianceScore}%</span>
              </div>
              <Progress value={stats.complianceScore} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <ComplianceItem label="SOC 2" status="compliant" />
              <ComplianceItem label="ISO 27001" status="in-progress" />
              <ComplianceItem label="GDPR" status="compliant" />
              <ComplianceItem label="HIPAA" status="needs-review" />
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleQuickAction('/dashboard/reporting')}
            >
              View Full Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} {...activity} />
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => handleQuickAction('/dashboard/workflows')}
          >
            View All Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  urgent = false,
  onClick 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  urgent?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${urgent ? 'ring-2 ring-red-200' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
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
      className="p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-foreground/20"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 ${color} mt-1`} />
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ComplianceItem({ 
  label, 
  status 
}: { 
  label: string; 
  status: 'compliant' | 'in-progress' | 'needs-review' 
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'compliant':
        return { color: 'bg-green-100 text-green-800', text: 'Compliant' };
      case 'in-progress':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' };
      case 'needs-review':
        return { color: 'bg-red-100 text-red-800', text: 'Needs Review' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <Badge className={`${config.color} border-0 text-xs`}>
        {config.text}
      </Badge>
    </div>
  );
}

function ActivityItem({ 
  action, 
  user, 
  time, 
  type 
}: { 
  action: string; 
  user: string; 
  time: string; 
  type: 'success' | 'info' | 'warning' 
}) {
  const getTypeColor = () => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'info': return 'text-blue-600';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <div className={`w-2 h-2 rounded-full ${getTypeColor().replace('text-', 'bg-')}`} />
      <div className="flex-1">
        <p className="text-sm text-foreground">{action}</p>
        <p className="text-xs text-muted-foreground">by {user} • {time}</p>
      </div>
    </div>
  );
}