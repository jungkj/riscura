'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react';

// Types
interface ComplianceGap {
  id: string;
  framework: string;
  requirement: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'accepted';
  currentControls: string[];
  requiredControls: string[];
  riskLevel: number;
  estimatedEffort: number; // hours
  dueDate: Date;
  assignee: string;
  aiRecommendations: string[];
  proboControlSuggestions: ProboControlSuggestion[];
}

interface ProboControlSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  importance: 'MANDATORY' | 'PREFERRED' | 'ADVANCED';
  riskReduction: number;
  implementationEffort: number;
  automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'AUTOMATED';
}

interface Framework {
  id: string;
  name: string;
  description: string;
  totalRequirements: number;
  implementedRequirements: number;
  gapCount: number;
  compliancePercentage: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Sample data
const sampleFrameworks: Framework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2 Type II',
    totalRequirements: 67,
    implementedRequirements: 52,
    gapCount: 15,
    compliancePercentage: 78,
    priority: 'critical',
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information Security Management System',
    totalRequirements: 114,
    implementedRequirements: 89,
    gapCount: 25,
    compliancePercentage: 78,
    priority: 'high',
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    totalRequirements: 47,
    implementedRequirements: 41,
    gapCount: 6,
    compliancePercentage: 87,
    priority: 'critical',
  },
  {
    id: 'nist',
    name: 'NIST CSF',
    description: 'NIST Cybersecurity Framework',
    totalRequirements: 108,
    implementedRequirements: 76,
    gapCount: 32,
    compliancePercentage: 70,
    priority: 'medium',
  },
];

const sampleGaps: ComplianceGap[] = [
  {
    id: 'GAP-001',
    framework: 'SOC 2',
    requirement: 'CC6.1 - Logical and Physical Access Controls',
    description: 'The entity implements logical and physical access controls to restrict access to system resources and data.',
    priority: 'critical',
    status: 'open',
    currentControls: ['CTL-001', 'CTL-005'],
    requiredControls: ['CTL-001', 'CTL-005', 'CTL-012', 'CTL-018'],
    riskLevel: 8.5,
    estimatedEffort: 40,
    dueDate: new Date('2024-03-15'),
    assignee: 'sarah.chen@company.com',
    aiRecommendations: [
      'Implement multi-factor authentication for all administrative accounts',
      'Deploy privileged access management solution',
      'Establish regular access reviews and certification process',
    ],
    proboControlSuggestions: [
      {
        id: 'PBC-001',
        name: 'Multi-Factor Authentication',
        description: 'Implement MFA for all user accounts accessing sensitive systems',
        category: 'Access Control',
        importance: 'MANDATORY',
        riskReduction: 85,
        implementationEffort: 20,
        automationLevel: 'SEMI_AUTOMATED',
      },
      {
        id: 'PBC-002',
        name: 'Privileged Access Management',
        description: 'Deploy PAM solution for administrative account management',
        category: 'Access Control',
        importance: 'MANDATORY',
        riskReduction: 90,
        implementationEffort: 60,
        automationLevel: 'AUTOMATED',
      },
    ],
  },
  {
    id: 'GAP-002',
    framework: 'GDPR',
    requirement: 'Article 32 - Security of Processing',
    description: 'Implementation of appropriate technical and organizational measures to ensure security of processing.',
    priority: 'high',
    status: 'in-progress',
    currentControls: ['CTL-002', 'CTL-007'],
    requiredControls: ['CTL-002', 'CTL-007', 'CTL-015', 'CTL-020'],
    riskLevel: 7.2,
    estimatedEffort: 25,
    dueDate: new Date('2024-02-28'),
    assignee: 'michael.rodriguez@company.com',
    aiRecommendations: [
      'Implement data encryption at rest and in transit',
      'Deploy data loss prevention (DLP) solution',
      'Establish data processing records and impact assessments',
    ],
    proboControlSuggestions: [
      {
        id: 'PBC-003',
        name: 'Data Encryption Standards',
        description: 'Implement comprehensive encryption for data at rest and in transit',
        category: 'Data Protection',
        importance: 'MANDATORY',
        riskReduction: 80,
        implementationEffort: 30,
        automationLevel: 'AUTOMATED',
      },
    ],
  },
];

const getPriorityConfig = (priority: string) => {
  const configs = {
    critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  };
  return configs[priority as keyof typeof configs] || configs.medium;
};

const getStatusConfig = (status: string) => {
  const configs = {
    open: { variant: 'destructive' as const, icon: AlertTriangle },
    'in-progress': { variant: 'secondary' as const, icon: Clock },
    resolved: { variant: 'default' as const, icon: CheckCircle },
    accepted: { variant: 'outline' as const, icon: Shield },
  };
  return configs[status as keyof typeof configs] || configs.open;
};

export default function ComplianceGapsPage() {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter gaps based on selections
  const filteredGaps = sampleGaps.filter(gap => {
    const matchesFramework = selectedFramework === 'all' || gap.framework.toLowerCase().includes(selectedFramework);
    const matchesPriority = selectedPriority === 'all' || gap.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || gap.status === selectedStatus;
    return matchesFramework && matchesPriority && matchesStatus;
  });

  const totalGaps = sampleGaps.length;
  const criticalGaps = sampleGaps.filter(g => g.priority === 'critical').length;
  const openGaps = sampleGaps.filter(g => g.status === 'open').length;
  const overallProgress = Math.round(
    (sampleGaps.filter(g => g.status === 'resolved').length / totalGaps) * 100
  );

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Gap analysis completed! Found 3 new gaps and 5 optimization opportunities.');
    } catch (error) {
      toast.error('Failed to run gap analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateRemediationPlan = (gapId: string) => {
    toast.success(`Creating remediation plan for ${gapId}...`);
  };

  const handleImplementControl = (controlId: string) => {
    toast.success(`Implementing control ${controlId}...`);
  };

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Compliance Gap Analysis"
        subtitle="AI-powered gap identification and remediation planning"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Compliance', href: '/dashboard/compliance' },
          { label: 'Gap Analysis', current: true },
        ]}
        primaryAction={{
          label: 'Run AI Analysis',
          onClick: handleRunAnalysis,
          icon: Zap,
          disabled: isAnalyzing,
        }}
        secondaryActions={[
          {
            label: 'Export Report',
            onClick: () => toast.success('Exporting gap analysis report...'),
            icon: Download,
            variant: 'outline',
          },
          {
            label: 'Refresh Data',
            onClick: () => toast.success('Refreshing compliance data...'),
            icon: RefreshCw,
            variant: 'outline',
          },
        ]}
        stats={[
          {
            label: 'total gaps',
            value: totalGaps,
            variant: 'default',
          },
          {
            label: 'critical gaps',
            value: criticalGaps,
            variant: 'destructive',
          },
          {
            label: 'open gaps',
            value: openGaps,
            variant: 'warning',
          },
          {
            label: 'progress',
            value: `${overallProgress}%`,
            variant: overallProgress >= 80 ? 'default' : 'warning',
          },
        ]}
        maxWidth="2xl"
      >
        {/* AI Analysis Status */}
        {isAnalyzing && (
          <DaisyAlert className="mb-6" >
  <Zap className="h-4 w-4 animate-pulse" />
</DaisyAlert>
            <DaisyAlertDescription >
  AI is analyzing your compliance posture against framework requirements...
                </DaisyAlertDescription>
</DaisyAlert>
                </DaisyAlertDescription>
              </DaisyAlert>
        )}

        {/* Tabs */}
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-6" />
          <DaisyTabsList />
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
            <DaisyTabsTrigger value="gaps">Gap Details</DaisyTabsTrigger>
            <DaisyTabsTrigger value="remediation">Remediation Plans</DaisyTabsTrigger>
            <DaisyTabsTrigger value="frameworks">Framework Status</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>

        <DaisyTabsContent value="overview" className="space-y-6" />
          {/* Framework Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleFrameworks.map((framework) => {
              const priorityConfig = getPriorityConfig(framework.priority);
              return (
                <DaisyCard key={framework.id} className={cn("border-2", priorityConfig.border)} >
  <DaisyCardHeader className="pb-3" />
</DaisyTabsContent>
                    <div className="flex items-center justify-between">
                      <DaisyCardTitle className="text-sm font-medium">{framework.name}</DaisyCardTitle>
                      <DaisyBadge variant="outline" className={priorityConfig.color} >
  {framework.priority}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    <DaisyCardDescription className="text-xs" >
  {framework.description}
</DaisyCardDescription>
                    </p>
                  
                  <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                      <div className="flex justify-between text-sm">
                        <span>Compliance</span>
                        <span className="font-medium">{framework.compliancePercentage}%</span>
                      </div>
                      <DaisyProgress value={framework.compliancePercentage} className="h-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="font-medium text-green-600">{framework.implementedRequirements}</div>
                          <div className="text-gray-500">Implemented</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">{framework.gapCount}</div>
                          <div className="text-gray-500">Gaps</div>
                        </div>
                      </div>
                    </div>
                  </DaisyProgress>
                </DaisyCard>
              );
            })}
          </div>

          {/* AI Insights */}
          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="flex items-center space-x-2" >
  <Zap className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
                <span>AI-Powered Insights</span>
              </DaisyCardTitle>
              <DaisyCardDescription >
  Intelligent recommendations based on your compliance posture
</DaisyCardDescription>
              </p>
            
            <DaisyCardContent >
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
</DaisyCardContent>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Priority Focus</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Focus on SOC 2 CC6.1 controls - highest risk reduction potential
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Quick Wins</span>
                  </div>
                  <p className="text-sm text-green-800">
                    5 gaps can be closed with existing Probo controls
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-900">Timeline</span>
                  </div>
                  <p className="text-sm text-orange-800">
                    Estimated 12 weeks to achieve 95% compliance
                  </p>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="gaps" className="space-y-6" />
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <DaisySelect value={selectedFramework} onValueChange={setSelectedFramework} />
              <DaisySelectTrigger className="w-40" />
                <DaisySelectValue placeholder="Framework" /></DaisyTabsContent>
              <DaisySelectContent />
                <DaisySelectItem value="all">All Frameworks</DaisySelectContent>
                <DaisySelectItem value="soc2">SOC 2</DaisySelectItem>
                <DaisySelectItem value="iso27001">ISO 27001</DaisySelectItem>
                <DaisySelectItem value="gdpr">GDPR</DaisySelectItem>
                <DaisySelectItem value="nist">NIST CSF</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>

            <DaisySelect value={selectedPriority} onValueChange={setSelectedPriority} />
              <DaisySelectTrigger className="w-32" />
                <DaisySelectValue placeholder="Priority" /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="all">All Priorities</DaisySelectContent>
                <DaisySelectItem value="critical">Critical</DaisySelectItem>
                <DaisySelectItem value="high">High</DaisySelectItem>
                <DaisySelectItem value="medium">Medium</DaisySelectItem>
                <DaisySelectItem value="low">Low</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>

            <DaisySelect value={selectedStatus} onValueChange={setSelectedStatus} />
              <DaisySelectTrigger className="w-32" />
                <DaisySelectValue placeholder="Status" /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="all">All Status</DaisySelectContent>
                <DaisySelectItem value="open">Open</DaisySelectItem>
                <DaisySelectItem value="in-progress">In Progress</DaisySelectItem>
                <DaisySelectItem value="resolved">Resolved</DaisySelectItem>
                <DaisySelectItem value="accepted">Accepted</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>

            <div className="text-sm text-gray-600 ml-auto">
              {filteredGaps.length} gap{filteredGaps.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Gap List */}
          <div className="space-y-4">
            {filteredGaps.map((gap) => {
              const priorityConfig = getPriorityConfig(gap.priority);
              const statusConfig = getStatusConfig(gap.status);
              const StatusIcon = statusConfig.icon;

              return (
                <DaisyCard key={gap.id} className={cn("border-l-4", priorityConfig.border)} >
  <DaisyCardHeader />
</DaisyCard>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DaisyBadge variant="outline" className="text-xs" >
  {gap.id}
</DaisyBadge>
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs" >
  {gap.framework}
</DaisyBadge>
                          </DaisyBadge>
                          <DaisyBadge variant={statusConfig.variant} className="text-xs" >
  <StatusIcon className="h-3 w-3 mr-1" />
</DaisyBadge>
                            {gap.status.replace('-', ' ').toUpperCase()}
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className={cn("text-xs", priorityConfig.color)} >
  {gap.priority.toUpperCase()}
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                        <DaisyCardTitle className="text-base">{gap.requirement}</DaisyCardTitle>
                        <DaisyCardDescription className="mt-1" >
  {gap.description}
</DaisyCardDescription>
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-red-600">{gap.riskLevel}</div>
                        <div className="text-xs text-gray-500">Risk Level</div>
                      </div>
                    </div>
                  
                  <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                      {/* Progress Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{gap.assignee}</div>
                          <div className="text-gray-500">Assignee</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{gap.estimatedEffort}h</div>
                          <div className="text-gray-500">Estimated Effort</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {gap.dueDate.toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">Due Date</div>
                        </div>
                      </div>

                      {/* AI Recommendations */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Zap className="h-4 w-4 mr-1 text-blue-600" />
                          AI Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {gap.aiRecommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <ArrowRight className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Probo Control Suggestions */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-[#199BEC]" />
                          Probo Control Suggestions
                        </h4>
                        <div className="grid gap-2">
                          {gap.proboControlSuggestions.map((control) => (
                            <div key={control.id} className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-blue-900">
                                    {control.name}
                                  </div>
                                  <div className="text-xs text-blue-700 mt-1">
                                    {control.description}
                                  </div>
                                  <div className="flex items-center space-x-4 mt-2 text-xs">
                                    <span className="text-green-600">
                                      {control.riskReduction}% risk reduction
                                    </span>
                                    <span className="text-orange-600">
                                      {control.implementationEffort}h effort
                                    </span>
                                    <DaisyBadge variant="outline" className="text-xs" >
  {control.importance}
</DaisyBadge>
                                    </DaisyBadge>
                                  </div>
                                </div>
                                <DaisyButton
                                  size="sm"
                                  onClick={() => handleImplementControl(control.id)}
                                  className="ml-2" />
                                  Implement
                                </DaisyButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2 border-t">
                        <DaisyButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateRemediationPlan(gap.id)} />
                          <Target className="h-4 w-4 mr-1" />
                          Create Plan
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm" >
  <Users className="h-4 w-4 mr-1" />
</DaisyButton>
                          Assign
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm" >
  <DaisyCalendar className="h-4 w-4 mr-1" />
</DaisyButton>
                          Schedule
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="remediation" />
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Remediation Planning
            </h3>
            <p className="text-gray-600 mb-4">
              Create and track remediation plans for compliance gaps
            </p>
            <DaisyButton >
  <Plus className="h-4 w-4 mr-2" />
</DaisyTabsContent>
              Create Remediation Plan
            </DaisyButton>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="frameworks" />
          <div className="grid gap-6">
            {sampleFrameworks.map((framework) => {
              const priorityConfig = getPriorityConfig(framework.priority);
              return (
                <DaisyCard key={framework.id} className={cn("border-l-4", priorityConfig.border)} >
  <DaisyCardHeader />
</DaisyTabsContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <DaisyCardTitle>{framework.name}</DaisyCardTitle>
                        <DaisyCardDescription>{framework.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{framework.compliancePercentage}%</div>
                        <div className="text-sm text-gray-500">Compliance</div>
                      </div>
                    </div>
                  
                  <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardDescription>
                      <DaisyProgress value={framework.compliancePercentage} className="h-3" />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{framework.totalRequirements}</div>
                          <div className="text-gray-500">Total Requirements</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">{framework.implementedRequirements}</div>
                          <div className="text-gray-500">Implemented</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">{framework.gapCount}</div>
                          <div className="text-gray-500">Gaps</div>
                        </div>
                      </div>
                    </div>
                  </DaisyProgress>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>
      </MainContentArea>
    </ProtectedRoute>
  );
} 