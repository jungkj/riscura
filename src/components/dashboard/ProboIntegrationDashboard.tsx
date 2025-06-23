'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield,
  Building,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Database,
  FileText,
  BarChart3,
  Settings,
  Zap,
  Globe,
  Download,
  Plus,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalVendors: number;
  highRiskVendors: number;
  compliantVendors: number;
  pendingAssessments: number;
  soc2Progress: number;
  controlsImplemented: number;
  totalControls: number;
  complianceScore: number;
}

interface RecentActivity {
  id: string;
  type: 'vendor_assessment' | 'control_update' | 'compliance_review' | 'finding_resolved';
  title: string;
  description: string;
  timestamp: Date;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: string;
}

interface ComplianceFrameworkStatus {
  name: string;
  progress: number;
  controlsTotal: number;
  controlsPassed: number;
  controlsFailed: number;
  lastAssessed: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
}

export function ProboIntegrationDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendors: 0,
    highRiskVendors: 0,
    compliantVendors: 0,
    pendingAssessments: 0,
    soc2Progress: 0,
    controlsImplemented: 0,
    totalControls: 0,
    complianceScore: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFrameworkStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be separate API calls
      // For now, we'll set mock data that would come from our Probo integrations
      
      setStats({
        totalVendors: 24,
        highRiskVendors: 3,
        compliantVendors: 18,
        pendingAssessments: 5,
        soc2Progress: 68,
        controlsImplemented: 142,
        totalControls: 200,
        complianceScore: 85
      });

      setRecentActivities([
        {
          id: '1',
          type: 'vendor_assessment',
          title: 'Slack Assessment Completed',
          description: 'AI-powered vendor risk assessment completed with score 35/100',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'LOW'
        },
        {
          id: '2',
          type: 'control_update',
          title: 'Access Control Policy Updated',
          description: 'Multi-factor authentication requirements updated',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'completed'
        },
        {
          id: '3',
          type: 'compliance_review',
          title: 'SOC 2 Control Testing',
          description: 'Quarterly control effectiveness testing initiated',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'in_progress'
        },
        {
          id: '4',
          type: 'vendor_assessment',
          title: 'Zoom Security Review',
          description: 'High-risk findings identified requiring remediation',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          severity: 'HIGH'
        }
      ]);

      setFrameworks([
        {
          name: 'SOC 2 Type II',
          progress: 68,
          controlsTotal: 84,
          controlsPassed: 57,
          controlsFailed: 3,
          lastAssessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: 'IN_PROGRESS'
        },
        {
          name: 'ISO 27001',
          progress: 45,
          controlsTotal: 114,
          controlsPassed: 51,
          controlsFailed: 5,
          lastAssessed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          status: 'IN_PROGRESS'
        },
        {
          name: 'NIST CSF',
          progress: 72,
          controlsTotal: 98,
          controlsPassed: 71,
          controlsFailed: 2,
          lastAssessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'IN_PROGRESS'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vendor_assessment': return <Building className="h-4 w-4" />;
      case 'control_update': return <Shield className="h-4 w-4" />;
      case 'compliance_review': return <CheckCircle className="h-4 w-4" />;
      case 'finding_resolved': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getFrameworkStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#191919]">Risk Management Dashboard</h1>
          <p className="text-[#A8A8A8]">Powered by Probo AI integration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-[#199BEC] text-white">
            <Zap className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button className="bg-[#199BEC] hover:bg-[#199BEC]/90">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Compliance Score</p>
                <p className="text-2xl font-bold text-[#191919]">{stats.complianceScore}%</p>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% this month
                </div>
              </div>
              <div className="h-12 w-12 bg-[#199BEC]/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#199BEC]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Total Vendors</p>
                <p className="text-2xl font-bold text-[#191919]">{stats.totalVendors}</p>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.highRiskVendors} high risk
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">SOC 2 Progress</p>
                <p className="text-2xl font-bold text-[#191919]">{stats.soc2Progress}%</p>
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  3 months remaining
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Controls Implemented</p>
                <p className="text-2xl font-bold text-[#191919]">{stats.controlsImplemented}</p>
                <div className="flex items-center text-xs text-[#A8A8A8] mt-1">
                  of {stats.totalControls} total
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Frameworks */}
        <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#191919] font-inter">Compliance Frameworks</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Framework
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {frameworks.map((framework, index) => (
              <div key={index} className="border border-[#D8C3A5] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-[#191919]">{framework.name}</h4>
                    <p className="text-sm text-[#A8A8A8]">
                      {framework.controlsPassed} of {framework.controlsTotal} controls passed
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={cn('text-xs', getFrameworkStatusColor(framework.status))}>
                      {framework.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-lg font-bold text-[#191919] mt-1">{framework.progress}%</p>
                  </div>
                </div>
                <Progress value={framework.progress} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-[#A8A8A8]">
                  <span>Last assessed: {framework.lastAssessed.toLocaleDateString()}</span>
                  <Button size="sm" variant="ghost" className="text-xs h-6 px-2">
                    View Details
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
          <CardHeader>
            <CardTitle className="text-[#191919] font-inter">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[#191919] text-sm">{activity.title}</h4>
                      {activity.severity && (
                        <Badge className={cn('text-xs', getSeverityColor(activity.severity))}>
                          {activity.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#A8A8A8] mt-1">{activity.description}</p>
                    <p className="text-xs text-[#A8A8A8] mt-1">
                      {activity.timestamp.toLocaleTimeString()} • {activity.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-[#D8C3A5]">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
        <CardHeader>
          <CardTitle className="text-[#191919] font-inter">Quick Actions</CardTitle>
          <CardDescription>
            Common tasks powered by Probo AI integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex-col bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
              <Building className="h-6 w-6 mb-2" />
              <span className="text-sm">Assess New Vendor</span>
            </Button>
            <Button className="h-20 flex-col bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
              <Shield className="h-6 w-6 mb-2" />
              <span className="text-sm">Import SOC 2 Controls</span>
            </Button>
            <Button className="h-20 flex-col bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200">
              <Database className="h-6 w-6 mb-2" />
              <span className="text-sm">Browse Mitigation Library</span>
            </Button>
            <Button className="h-20 flex-col bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">Generate Compliance Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Probo AI Integration Active:</strong> Real-time vendor assessments, automated control mapping, 
          and 650+ security controls library available. All data synced as of {new Date().toLocaleTimeString()}.
        </AlertDescription>
      </Alert>
    </div>
  );
} 