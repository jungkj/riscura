'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import {
  DaisySelect,
  DaisySelectTrigger,
  DaisySelectValue,
  DaisySelectContent,
  DaisySelectItem,
} from '@/components/ui/DaisySelect';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Eye,
  Briefcase,
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
  loading = false,
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
      <DaisyCard className="hover:shadow-md transition-shadow">
        <DaisyCardBody className="p-6">
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
                  <span
                    className={`text-sm font-medium ${
                      trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
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
        </DaisyCardBody>
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
              <DaisySelect value={timeRange} onValueChange={setTimeRange}>
                <DaisySelectTrigger className="w-40">
                  <DaisySelectValue />
                <DaisySelectContent>
                  <DaisySelectItem value="7d">Last 7 days</DaisySelectItem>
                  <DaisySelectItem value="30d">Last 30 days</DaisySelectItem>
                  <DaisySelectItem value="90d">Last 90 days</DaisySelectItem>
                </DaisySelectContent>
              </DaisySelect>
              <DaisyButton variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </DaisyButton>
              <DaisyButton size="sm">
                <Download className="h-4 w-4 mr-2" />
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
            trend={analyticsData?.changes?.risks > 0 ? 'up' : 'down'}
            icon={AlertTriangle}
            color="red"
            loading={loading} />
          <MetricCard
            title="Active Controls"
            value={analyticsData?.totals?.controls || 0}
            change={analyticsData?.changes?.controls}
            trend={analyticsData?.changes?.controls > 0 ? 'up' : 'down'}
            icon={Shield}
            color="green"
            loading={loading} />
          <MetricCard
            title="Documents"
            value={analyticsData?.totals?.documents || 0}
            change={analyticsData?.changes?.documents}
            trend={analyticsData?.changes?.documents > 0 ? 'up' : 'down'}
            icon={FileText}
            color="blue"
            loading={loading} />
          <MetricCard
            title="Questionnaires"
            value={analyticsData?.totals?.questionnaires || 0}
            change={analyticsData?.changes?.questionnaires}
            trend={analyticsData?.changes?.questionnaires > 0 ? 'up' : 'down'}
            icon={CheckCircle}
            color="purple"
            loading={loading} />
        </div>

        {/* Simplified Analytics Content */}
        <DaisyTabs defaultValue="overview" className="space-y-4">
          <DaisyTabsList className="grid grid-cols-4 w-fit">
            <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
            <DaisyTabsTrigger value="risks">Risk Analysis</DaisyTabsTrigger>
            <DaisyTabsTrigger value="controls">Control Effectiveness</DaisyTabsTrigger>
            <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Overview Tab */}
          <DaisyTabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DaisyCard>
                <DaisyCardBody>
                  <div className="flex flex-row items-center justify-between mb-4">
                    <DaisyCardTitle className="text-lg">Risk Overview</DaisyCardTitle>
                    <DaisyBadge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </DaisyBadge>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500">Analytics data will be displayed here</p>
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard>
                <DaisyCardBody>
                  <div className="flex flex-row items-center justify-between mb-4">
                    <DaisyCardTitle className="text-lg">Control Status</DaisyCardTitle>
                    <DaisyBadge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Active
                    </DaisyBadge>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500">Control metrics will be displayed here</p>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            </div>
          </DaisyTabsContent>

          {/* Risk Analysis Tab */}
          <DaisyTabsContent value="risks" className="space-y-4">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="text-lg mb-4">Risk Analysis</DaisyCardTitle>
                <div className="text-center py-8">
                  <p className="text-gray-500">Risk analysis charts will be displayed here</p>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          {/* Control Effectiveness Tab */}
          <DaisyTabsContent value="controls" className="space-y-4">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="text-lg mb-4">Control Performance</DaisyCardTitle>
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Control effectiveness metrics will be displayed here
                  </p>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          {/* Compliance Tab */}
          <DaisyTabsContent value="compliance" className="space-y-4">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="text-lg mb-4">Compliance Overview</DaisyCardTitle>
                <div className="text-center py-8">
                  <p className="text-gray-500">Compliance metrics will be displayed here</p>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>
        </DaisyTabs>
      </div>
    </ProtectedRoute>
  );
}
