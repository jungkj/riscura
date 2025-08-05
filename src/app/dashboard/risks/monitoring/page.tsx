'use client';

import React, { useState, useEffect } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
import { DaisyCardTitle } from '@/components/ui/daisy-components';
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Search,
} from 'lucide-react';

interface RiskMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface MonitoringAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

export default function RiskMonitoringPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer);
  }, []);

  const metrics: RiskMetric[] = [
    {
      id: 'total-risks',
      title: 'Total Risks',
      value: 23,
      change: 2,
      trend: 'up',
      status: 'warning',
    },
    {
      id: 'critical-risks',
      title: 'Critical Risks',
      value: 4,
      change: -1,
      trend: 'down',
      status: 'good',
    },
    {
      id: 'risk-score',
      title: 'Avg Risk Score',
      value: 7.2,
      change: 0.3,
      trend: 'up',
      status: 'warning',
    },
    {
      id: 'mitigation-rate',
      title: 'Mitigation Rate',
      value: 78,
      change: 5,
      trend: 'up',
      status: 'good',
    },
  ];

  const alerts: MonitoringAlert[] = [
    {
      id: '1',
      title: 'High Risk Threshold Exceeded',
      description: 'Payment system vulnerability risk score increased to 9.2',
      severity: 'critical',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '2',
      title: 'New Risk Identified',
      description: 'Third-party vendor security assessment revealed new risks',
      severity: 'medium',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'acknowledged',
    },
    {
      id: '3',
      title: 'Control Effectiveness Declined',
      description: 'Access control monitoring shows decreased effectiveness',
      severity: 'high',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'active',
    },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdated(new Date());
    setTimeout(() => setLoading(false), 1000);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Monitoring</h1>
          <p className="text-gray-600">Real-time risk tracking and alerting</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <DaisyButton variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </DaisyButton>
          <DaisyButton variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </DaisyButton>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <DaisyCard key={metric.id}>
            <DaisyCardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-full ${getStatusColor(metric.status)}`}>
                  {metric.status === 'good' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : metric.status === 'warning' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Activity className="h-5 w-5" />
                  )}
                </div>
              </div>
              <div className="flex items-center mt-2">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                ) : (
                  <div className="h-4 w-4 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    metric.trend === 'up'
                      ? 'text-green-600'
                      : metric.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last week</span>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        ))}
      </div>

      {/* Main Content Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab}>
        <DaisyTabsList>
          <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
          <DaisyTabsTrigger value="alerts">Alerts</DaisyTabsTrigger>
          <DaisyTabsTrigger value="trends">Trends</DaisyTabsTrigger>
          <DaisyTabsTrigger value="reports">Reports</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Status Chart */}
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Status Distribution
                </DaisyCardTitle>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Critical</span>
                    <span className="text-sm text-gray-600">4 risks</span>
                  </div>
                  <DaisyProgress value={17} className="h-2" />
<div className="flex items-center justify-between">
                    <span className="text-sm font-medium">High</span>
                    <span className="text-sm text-gray-600">7 risks</span>
                  </div>
                  <DaisyProgress value={30} className="h-2" />
<div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medium</span>
                    <span className="text-sm text-gray-600">8 risks</span>
                  </div>
                  <DaisyProgress value={35} className="h-2" />
<div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low</span>
                    <span className="text-sm text-gray-600">4 risks</span>
                  </div>
                  <DaisyProgress value={17} className="h-2" />
</div>
              </DaisyCardBody>
            </DaisyCard>

            {/* Recent Activity */}
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </DaisyCardTitle>
                <div className="space-y-4 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Critical risk identified</p>
                      <p className="text-xs text-gray-500">Payment system vulnerability - 2h ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Risk mitigated</p>
                      <p className="text-xs text-gray-500">
                        Data encryption control implemented - 4h ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Risk assessment updated</p>
                      <p className="text-xs text-gray-500">Third-party vendor review - 6h ago</p>
                    </div>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="alerts" className="space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Active Alerts</DaisyCardTitle>
              <div className="space-y-4 mt-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <DaisyBadge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </DaisyBadge>
                        <DaisyBadge
                          variant={alert.status === 'active' ? 'destructive' : 'secondary'}
                        >
                          {alert.status}
                        </DaisyBadge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <p className="text-xs text-gray-500">{alert.timestamp.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <DaisyButton variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </DaisyButton>
                      {alert.status === 'active' && (
                        <DaisyButton variant="outline" size="sm">
          Acknowledge
                        
        </DaisyButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="trends" className="space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Risk Trends</DaisyCardTitle>
              <p className="text-gray-600 mt-4">
                Risk trend analysis and historical data visualization will be displayed here.
              </p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="reports" className="space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Monitoring Reports</DaisyCardTitle>
              <p className="text-gray-600 mt-4">
                Automated monitoring reports and scheduled exports will be available here.
              </p>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}
