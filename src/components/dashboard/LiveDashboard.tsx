import React, { useState, useEffect } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
import { DaisyCardTitle, DaisyCardDescription, DaisyTabsTrigger, DaisyTooltip } from '@/components/ui/daisy-components';
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
// import {
  AlertTriangle,
  Shield,
  FileText,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface DashboardData {
  summary: {
    risks: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      breakdown: Array<{ level: string; count: number }>;
      byCategory: Array<{ category: string; count: number }>;
    }
    controls: {
      total: number;
      operational: number;
      planned: number;
      testing: number;
      implemented: number;
      breakdown: Array<{ status: string; count: number }>;
      byType: Array<{ type: string; count: number }>;
      averageEffectiveness: number;
    }
    documents: number;
    questionnaires: number;
    compliance: {
      overall: number;
      frameworks: Record<string, number>;
    }
  }
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
  recentRisks: Array<{
    id: string;
    title: string;
    riskLevel: string;
    category: string;
    status: string;
    createdAt: string;
  }>;
  recentControls: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    effectiveness: number;
    createdAt: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const getRiskLevelColor = (level: string) => {
  switch (level.toUpperCase()) {
    case 'CRITICAL': return 'destructive';
    case 'HIGH': return 'destructive';
    case 'MEDIUM': return 'default';
    case 'LOW': return 'secondary';
    default: return 'default';
  }
}

const getControlStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'OPERATIONAL': return 'default';
    case 'IMPLEMENTED': return 'default';
    case 'TESTING': return 'secondary';
    case 'PLANNED': return 'secondary';
    default: return 'secondary';
  }
}

export function LiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get the token from storage
      const _token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      
      if (!token) {
        // If no token, silently skip fetching (user not authenticated yet)
        setLoading(false)
        return;
      }

      const response = await fetch(`/api/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear stored tokens if they're invalid
          localStorage.removeItem('accessToken')
          sessionStorage.removeItem('accessToken');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const _result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      // console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  if (loading) {

  return (
    <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <DaisyTabs value={timeRange} onValueChange={setTimeRange} className="w-[400px]" >
              <DaisyTabsList >
                <DaisyTabsTrigger value="7d">7 days</DaisyTabs>
              <DaisyTabsTrigger value="30d">30 days</DaisyTabsTrigger>
              <DaisyTabsTrigger value="90d">90 days</DaisyTabsTrigger>
            </DaisyTabsList>
          </DaisyTabs>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <DaisyCard key={i} className="animate-pulse" >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              
              <DaisyCardBody >
  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2">
</DaisyCardBody></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </DaisyCardBody>
            </DaisyCard>
          ))}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <DaisyCard className="col-span-4 animate-pulse" >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle>Risk Distribution</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="pl-2" >
  <div className="h-80 bg-gray-200 rounded">
</DaisyCardBody></div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard className="col-span-3 animate-pulse" >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle>Recent Activity</DaisyCardTitle>
              <DaisyCardDescription >
  Latest updates in your organization
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <div className="h-80 bg-gray-200 rounded">
</DaisyCardBody></div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DaisyCard className="col-span-full" >
  <DaisyCardBody className="flex items-center justify-center py-8" >
  </DaisyCard>
</DaisyCardBody>
          <div className="text-center">
            <DaisyAlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" >
  <p className="text-sm text-muted-foreground">
</DaisyAlertCircle>{error}</p>
            <DaisyButton onClick={fetchDashboardData} variant="outline" className="mt-2">
          Retry

        </DaisyButton>
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <DaisyTabs value={timeRange} onValueChange={setTimeRange} className="w-[400px]" >
            <DaisyTabsList >
              <DaisyTabsTrigger value="7d">7 days</DaisyTabs>
            <DaisyTabsTrigger value="30d">30 days</DaisyTabsTrigger>
            <DaisyTabsTrigger value="90d">90 days</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
            <DaisyCardTitle className="text-sm font-medium">Total Risks</DaisyCardTitle>
            <DaisyAlertTriangle className="h-4 w-4 text-muted-foreground" >
  <DaisyCardBody >
</DaisyAlertTriangle>
  <div className="text-2xl font-bold">
</DaisyCard>{data.summary.risks.total}</div>
            <div className="flex gap-2 mt-2">
              <DaisyBadge variant={getRiskLevelColor('critical')} className="text-xs" >
  {data.summary.risks.critical} Critical
</DaisyBadge>
              </DaisyBadge>
              <DaisyBadge variant={getRiskLevelColor('high')} className="text-xs" >
  {data.summary.risks.high} High
</DaisyBadge>
              </DaisyBadge>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
            <DaisyCardTitle className="text-sm font-medium">Controls</DaisyCardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>{data.summary.controls.total}</div>
            <div className="flex gap-2 mt-2">
              <DaisyBadge variant={getControlStatusColor('operational')} className="text-xs" >
  {data.summary.controls.operational} Operational
</DaisyBadge>
              </DaisyBadge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg. Effectiveness: {Math.round(data.summary.controls.averageEffectiveness * 100)}%
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
            <DaisyCardTitle className="text-sm font-medium">Documents</DaisyCardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>{data.summary.documents}</div>
            <p className="text-xs text-muted-foreground">
              Policies, procedures & reports
            </p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
            <DaisyCardTitle className="text-sm font-medium">Compliance Score</DaisyCardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>{data.summary.compliance.overall}%</div>
            <DaisyProgress value={data.summary.compliance.overall} className="mt-2" / / /> </DaisyCard>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <DaisyCard className="col-span-4" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Risk Distribution</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="pl-2" >
  <ResponsiveContainer width="100%" height={350}>
</DaisyCardBody>
              <BarChart data={data.summary.risks.breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <DaisyTooltip>
                  <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </DaisyTooltip>
        </DaisyCard>

        <DaisyCard className="col-span-3" >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Recent Activity</DaisyCardTitle>
            <DaisyCardDescription >
  Latest updates in your organization
</DaisyCardDescription>
            </p>
          
          <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
              {data.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'} • {' '}
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Recent Items */}
      <div className="grid gap-4 md:grid-cols-2">
        <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Recent Risks</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
              {data.recentRisks.map((risk) => (
                <div key={risk.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{risk.title}</p>
                    <p className="text-xs text-muted-foreground">{risk.category}</p>
                  </div>
                  <DaisyBadge variant={getRiskLevelColor(risk.riskLevel)} >
  {risk.riskLevel}
</DaisyBadge>
                  </DaisyBadge>
                </div>
              ))}
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Recent Controls</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
              {data.recentControls.map((control) => (
                <div key={control.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{control.title}</p>
                    <p className="text-xs text-muted-foreground">{control.type}</p>
                  </div>
                  <div className="text-right">
                    <DaisyBadge variant={getControlStatusColor(control.status)} >
  {control.status}
</DaisyBadge>
                    </DaisyBadge>
                    {control.effectiveness && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(control.effectiveness * 100)}% effective
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
} 