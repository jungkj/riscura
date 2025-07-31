'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Shield, FileText, CheckCircle,
  AlertTriangle, Clock, Users, Target, BarChart3, PieChart as PieChartIcon,
  Download, RefreshCw, Calendar, Filter, ArrowUpRight, ArrowDownRight,
  Zap, Eye, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

// Enhanced metric card component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color = 'blue',
  loading = false 
}: any) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DaisyCard className="hover:shadow-md transition-shadow" >
  <DaisyCardContent className="p-6" >
  </DaisyCard>
</DaisyCardContent>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2" />
              ) : (
                <h3 className="text-2xl font-bold mt-2">{value}</h3>
              )}
              {change !== undefined && (
                <div className="flex items-center mt-2 space-x-1">
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(change)}%
                  </span>
                  <span className="text-sm text-gray-500">vs last period</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </motion.div>
  );
};

// Chart color palette
const COLORS = {
  blue: '#2383e2',
  green: '#34a853',
  orange: '#f57c00',
  red: '#ea4335',
  purple: '#6f42c1',
  teal: '#00796b',
  amber: '#fbc02d',
  pink: '#e91e63',
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?type=dashboard&timeRange=${timeRange}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setAnalyticsData(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform data for charts
  const getRiskTrendData = () => {
    if (!analyticsData?.trends?.risks) return [];
    return analyticsData.trends.risks.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.count,
    }));
  };

  const getRiskDistributionData = () => {
    if (!analyticsData?.compliance?.byCategory) return [];
    return analyticsData.compliance.byCategory.map((item: any) => ({
      name: item.category,
      value: item.count,
    }));
  };

  const getActivityData = () => {
    if (!analyticsData?.recentActivity) return [];
    return analyticsData.recentActivity.slice(0, 5);
  };

  return (
    <ProtectedRoute>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive insights and metrics</p>
            </div>
            <div className="flex items-center space-x-3">
              <DaisySelect value={timeRange} onValueChange={setTimeRange} />
                <DaisySelectTrigger className="w-40" />
                  <DaisySelectValue /></DaisySelect>
                <DaisySelectContent />
                  <DaisySelectItem value="7d">Last 7 days</DaisySelectContent>
                  <DaisySelectItem value="30d">Last 30 days</DaisySelectItem>
                  <DaisySelectItem value="90d">Last 90 days</DaisySelectItem>
                </DaisySelectContent>
              </DaisySelect>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={fetchAnalytics}
                disabled={loading} >
  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
</DaisyButton>
                Refresh
              </DaisyButton>
              <DaisyButton size="sm" >
  <Download className="h-4 w-4 mr-2" />
</DaisyButton>
                Export
              </DaisyButton>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Risks"
            value={analyticsData?.totals?.risks || 0}
            change={analyticsData?.changes?.risks}
            trend={analyticsData?.changes?.risks > 0 ? "up" : "down"}
            icon={AlertTriangle}
            color="red"
            loading={loading}
          />
          <MetricCard
            title="Active Controls"
            value={analyticsData?.totals?.controls || 0}
            change={analyticsData?.changes?.controls}
            trend={analyticsData?.changes?.controls > 0 ? "up" : "down"}
            icon={Shield}
            color="green"
            loading={loading}
          />
          <MetricCard
            title="Documents"
            value={analyticsData?.totals?.documents || 0}
            change={analyticsData?.changes?.documents}
            trend={analyticsData?.changes?.documents > 0 ? "up" : "down"}
            icon={FileText}
            color="blue"
            loading={loading}
          />
          <MetricCard
            title="Questionnaires"
            value={analyticsData?.totals?.questionnaires || 0}
            change={analyticsData?.changes?.questionnaires}
            trend={analyticsData?.changes?.questionnaires > 0 ? "up" : "down"}
            icon={CheckCircle}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Main Analytics Content */}
        <DaisyTabs defaultValue="overview" className="space-y-4" />
          <DaisyTabsList className="grid grid-cols-4 w-fit" />
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
            <DaisyTabsTrigger value="risks">Risk Analysis</DaisyTabsTrigger>
            <DaisyTabsTrigger value="controls">Control Effectiveness</DaisyTabsTrigger>
            <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Overview Tab */}
          <DaisyTabsContent value="overview" className="space-y-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risk Trends Chart */}
              <DaisyCard >
  <DaisyCardHeader className="flex flex-row items-center justify-between" />
</DaisyTabsContent>
                  <DaisyCardTitle className="text-lg">Risk Trends</DaisyCardTitle>
                  <DaisyBadge variant="outline" >
  <TrendingUp className="h-3 w-3 mr-1" />
</DaisyBadge>
                    Trending
                  </DaisyBadge>
                
                <DaisyCardContent >
  <div className="h-64">
</DaisyCardContent>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getRiskTrendData()}>
                        <defs>
                          <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.red} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} />
                        <DaisyTooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={COLORS.red}
                          fillOpacity={1}
                          fill="url(#colorRisk)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </DaisyTooltip>
              </DaisyCard>

              {/* Risk Distribution */}
              <DaisyCard >
  <DaisyCardHeader className="flex flex-row items-center justify-between" />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Risk Distribution</DaisyCardTitle>
                  <DaisyBadge variant="outline" >
  <PieChartIcon className="h-3 w-3 mr-1" />
</DaisyBadge>
                    Categories
                  </DaisyBadge>
                
                <DaisyCardContent >
  <div className="h-64">
</DaisyCardContent>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getRiskDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getRiskDistributionData().map((entry: { name: string; value: number }, index: number) => (
                            <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                          ))}
                        </Pie>
                        <DaisyTooltip /></DaisyTooltip>
                    </ResponsiveContainer>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </div>

            {/* Control Effectiveness */}
            <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                <DaisyCardTitle className="text-lg">Control Effectiveness Overview</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Effectiveness</span>
                    <span className="text-2xl font-bold text-green-600">
                      {analyticsData?.trends?.controlEffectiveness?.average?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analyticsData?.trends?.controlEffectiveness?.average || 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData?.trends?.controlEffectiveness?.total || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Controls</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((analyticsData?.trends?.controlEffectiveness?.average || 0) * 
                          (analyticsData?.trends?.controlEffectiveness?.total || 0) / 100)}
                      </p>
                      <p className="text-sm text-gray-600">Effective</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {(analyticsData?.trends?.controlEffectiveness?.total || 0) - 
                          Math.round((analyticsData?.trends?.controlEffectiveness?.average || 0) * 
                          (analyticsData?.trends?.controlEffectiveness?.total || 0) / 100)}
                      </p>
                      <p className="text-sm text-gray-600">Need Review</p>
                    </div>
                  </div>
                </div>
              </DaisyCardContent>
            </DaisyCard>

            {/* Recent Activity */}
            <DaisyCard >
  <DaisyCardHeader className="flex flex-row items-center justify-between" />
</DaisyCard>
                <DaisyCardTitle className="text-lg">Recent Activity</DaisyCardTitle>
                <DaisyBadge variant="outline" >
  <Activity className="h-3 w-3 mr-1" />
</DaisyBadge>
                  Live
                </DaisyBadge>
              
              <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                  {getActivityData().map((activity: any, index: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">by {activity.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </DaisyTabsContent>

          {/* Risk Analysis Tab */}
          <DaisyTabsContent value="risks" className="space-y-4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DaisyCard className="lg:col-span-2" >
  <DaisyCardHeader />
</DaisyTabsContent>
                  <DaisyCardTitle className="text-lg">Risk Level Distribution</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="h-64">
</DaisyCardContent>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { level: 'Critical', count: 4, color: COLORS.red },
                        { level: 'High', count: 12, color: COLORS.orange },
                        { level: 'Medium', count: 23, color: COLORS.amber },
                        { level: 'Low', count: 15, color: COLORS.green },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <DaisyTooltip />
                        <Bar dataKey="count">
                          {[
                            { level: 'Critical', count: 4, color: COLORS.red },
                            { level: 'High', count: 12, color: COLORS.orange },
                            { level: 'Medium', count: 23, color: COLORS.amber },
                            { level: 'Low', count: 15, color: COLORS.green },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </DaisyTooltip>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Risk Metrics</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-4" >
  <div className="space-y-2">
</DaisyCardContent>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Critical Risks</span>
                      <span className="text-sm font-bold text-red-600">4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">High Risks</span>
                      <span className="text-sm font-bold text-orange-600">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Medium Risks</span>
                      <span className="text-sm font-bold text-amber-600">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Low Risks</span>
                      <span className="text-sm font-bold text-green-600">15</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Risk Reduction</span>
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm font-bold text-green-600">15%</span>
                      </div>
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </div>
          </DaisyTabsContent>

          {/* Control Effectiveness Tab */}
          <DaisyTabsContent value="controls" className="space-y-4" />
            <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                <DaisyCardTitle className="text-lg">Control Performance Matrix</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="h-80">
</DaisyCardContent>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={[
                      { type: 'Preventive', effectiveness: 85, count: 45 },
                      { type: 'Detective', effectiveness: 78, count: 32 },
                      { type: 'Corrective', effectiveness: 92, count: 28 },
                      { type: 'Compensating', effectiveness: 70, count: 15 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="type" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <DaisyTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill={COLORS.blue} name="Count" />
                      <Line yAxisId="right" type="monotone" dataKey="effectiveness" stroke={COLORS.green} name="Effectiveness %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </DaisyTooltip>
            </DaisyCard>
          </DaisyTabsContent>

          {/* Compliance Tab */}
          <DaisyTabsContent value="compliance" className="space-y-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                  <DaisyCardTitle className="text-lg">Framework Compliance</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="h-64">
</DaisyCardContent>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={[
                        { name: 'SOC 2', value: 92, fill: COLORS.blue },
                        { name: 'ISO 27001', value: 87, fill: COLORS.green },
                        { name: 'GDPR', value: 95, fill: COLORS.purple },
                        { name: 'HIPAA', value: 78, fill: COLORS.orange },
                      ]}>
                        <RadialBar dataKey="value" />
                        <Legend />
                        <DaisyTooltip /></DaisyTooltip>
                    </ResponsiveContainer>
                  </div>
                </DaisyCardContent>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Compliance Score Trend</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="h-64">
</DaisyCardContent>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', score: 82 },
                        { month: 'Feb', score: 84 },
                        { month: 'Mar', score: 86 },
                        { month: 'Apr', score: 88 },
                        { month: 'May', score: 91 },
                        { month: 'Jun', score: 89 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[75, 100]} />
                        <DaisyTooltip />
                        <Line type="monotone" dataKey="score" stroke={COLORS.purple} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </DaisyTooltip>
              </DaisyCard>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </div>
    </ProtectedRoute>
  );
}