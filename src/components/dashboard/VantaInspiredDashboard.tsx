'use client';

import React, { useState, useEffect } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
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
  Activity,
  Zap,
  Brain,
  Eye,
  Calendar,
  Settings,
  MoreHorizontal,
  ExternalLink,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

// import MetricCards from './MetricCards'
// import RiskHeatMap from '../risks/RiskHeatMap'
// import ComplianceProgress from './ComplianceProgress'

interface RiskItem {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Mitigated' | 'Accepted' | 'In Progress';
  owner: string;
  dueDate: string;
  progress: number;
}

interface ComplianceFramework {
  id: string;
  name: string;
  progress: number;
  status: 'Compliant' | 'Non-Compliant' | 'In Progress' | 'Not Started';
  controls: number;
  completedControls: number;
  lastAssessment: string;
}

export default function VantaInspiredDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Sample data matching Vanta's patterns
  const riskData: RiskItem[] = [
    {
      id: 'R-001',
      title: 'Data breach in customer database',
      category: 'Information Security',
      severity: 'Critical',
      status: 'In Progress',
      owner: 'Sarah Chen',
      dueDate: '2024-01-15',
      progress: 65,
    },
    {
      id: 'R-002',
      title: 'Third-party vendor access controls',
      category: 'Vendor Management',
      severity: 'High',
      status: 'Active',
      owner: 'Mike Johnson',
      dueDate: '2024-01-20',
      progress: 30,
    },
    {
      id: 'R-003',
      title: 'Employee training compliance',
      category: 'Human Resources',
      severity: 'Medium',
      status: 'Mitigated',
      owner: 'Lisa Wang',
      dueDate: '2024-01-10',
      progress: 100,
    },
  ]

  const complianceFrameworks: ComplianceFramework[] = [
    {
      id: 'SOC2',
      name: 'SOC 2 Type II',
      progress: 85,
      status: 'In Progress',
      controls: 40,
      completedControls: 34,
      lastAssessment: '2024-01-01',
    },
    {
      id: 'ISO27001',
      name: 'ISO 27001:2022',
      progress: 92,
      status: 'Compliant',
      controls: 114,
      completedControls: 105,
      lastAssessment: '2023-12-15',
    },
    {
      id: 'GDPR',
      name: 'GDPR',
      progress: 78,
      status: 'In Progress',
      controls: 25,
      completedControls: 19,
      lastAssessment: '2024-01-05',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-green-100 text-green-800';
      case 'Non-Compliant':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'Active':
        return 'bg-orange-100 text-orange-800';
      case 'Mitigated':
        return 'bg-green-100 text-green-800';
      case 'Accepted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Compliant':
      case 'Mitigated':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Non-Compliant':
        return <XCircle className="w-4 h-4" />;
      case 'In Progress':
      case 'Active':
        return <Clock className="w-4 h-4" />;
      case 'Not Started':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  }

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search and Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Risk Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor and manage your organization's risk posture
              <span className="ml-2 text-gray-400">
                • Last updated {formatLastUpdated(lastUpdated)}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <DaisyInput
                placeholder="Search risks, controls, or frameworks..."
                value={searchQuery}
                onChange={(e) = />
setSearchQuery(e.target.value)}
                className="pl-10 w-80 focus:ring-[#199BEC] focus:border-[#199BEC]" />
            </div>

            {/* Action Buttons */}
            <DaisyButton variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </DaisyButton>
            <DaisyButton variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </DaisyButton>
            <DaisyButton className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </DaisyButton>

            {/* Notifications */}
            <div className="relative">
              <DaisyButton variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </DaisyButton>
              <DaisyBadge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                3
              </DaisyBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <DaisyTabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <DaisyTabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </DaisyTabsTrigger>
            <DaisyTabsTrigger
              value="risks"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Risk Analysis
            </DaisyTabsTrigger>
            <DaisyTabsTrigger
              value="compliance"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Compliance
            </DaisyTabsTrigger>
            <DaisyTabsTrigger
              value="reports"
              className="data-[state=active]:bg-white data-[state=active]:text-[#199BEC] data-[state=active]:shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Reports
            </DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Tab Content */}
          <DaisyTabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
              {/* <MetricCards /> */}
              <div className="text-center text-gray-500 py-8">
                MetricCards component temporarily disabled
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Overview</h2>
                {/* <RiskHeatMap /> */}
                <div className="text-center text-gray-500 py-8">
                  RiskHeatMap component temporarily disabled
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h2>
                {/* <ComplianceProgress /> */}
                <div className="text-center text-gray-500 py-8">
                  ComplianceProgress component temporarily disabled
                </div>
              </div>
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="risks" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h2>
              {/* <RiskHeatMap /> */}
              <div className="text-center text-gray-500 py-8">
                RiskHeatMap component temporarily disabled
              </div>
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="compliance" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Management</h2>
              {/* <ComplianceProgress /> */}
              <div className="text-center text-gray-500 py-8">
                ComplianceProgress component temporarily disabled
              </div>
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="reports" className="space-y-6">
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Generate comprehensive reports on risk assessments, compliance status, and
                organizational metrics.
              </p>
              <div className="flex justify-center space-x-4">
                <DaisyButton className="bg-[#199BEC] hover:bg-[#0f7dc7] text-white">
          Generate Risk Report
                
        </DaisyButton>
                <DaisyButton variant="outline">
          Compliance Summary
        </DaisyButton>
              </div>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </div>

      {/* Quick Actions Sidebar */}
      <div className="fixed bottom-6 right-6 space-y-3">
        <DaisyButton
          className="w-12 h-12 rounded-full bg-[#199BEC] hover:bg-[#0f7dc7] text-white shadow-lg"
          title="Quick Risk Assessment"
        >
          <Plus className="w-5 h-5" />
        </DaisyButton>
      </div>
    </div>
  );
}
