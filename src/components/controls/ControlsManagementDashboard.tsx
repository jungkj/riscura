'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { EnhancedProboService } from '@/services/EnhancedProboService';
import { CreateControlModal } from './CreateControlModal';
import ExportService from '@/services/ExportService';
import { cn } from '@/lib/utils';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import ControlTestingWorkflow from './ControlTestingWorkflow';
import ComplianceMapping from './ComplianceMapping';
import { DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyTabsTrigger, DaisyCalendar } from '@/components/ui/daisy-components';
// import {
  Plus,
  Shield,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Settings,
  TrendingUp,
  Users,
  Target,
  BookOpen,
  Activity,
  BarChart3,
  Eye,
  Edit,
  MoreHorizontal,
} from 'lucide-react'

// Types
export interface Control {
  id: string
  title: string;
  description: string;
  category: string;
  framework: string[];
  owner: {
    name: string;
    email: string;
  }
  effectiveness: 'excellent' | 'satisfactory' | 'needs-improvement' | 'inadequate';
  effectivenessScore: number; // 0-100
  testingFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  lastTested: Date;
  nextTestingDue: Date;
  status: 'active' | 'draft' | 'inactive' | 'under-review';
  evidenceCount: number;
  risks: string[]; // Risk IDs this control mitigates
  compliance: {
    soc2: boolean;
    iso27001: boolean;
    gdpr: boolean;
    nist: boolean;
  }
  testingHistory: TestingResult[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface TestingResult {
  id: string;
  date: Date;
  tester: string;
  result: 'passed' | 'failed' | 'partial' | 'not-applicable';
  effectiveness: number; // 0-100
  findings: string;
  evidence: string[];
  nextTestingDate: Date;
}

export interface ControlFramework {
  id: string;
  name: string;
  description: string;
  categories: ControlCategory[];
  totalControls: number;
  implementedControls: number;
  testedControls: number;
  compliancePercentage: number;
}

export interface ControlCategory {
  id: string;
  name: string;
  description: string;
  controls: string[]; // Control IDs
  parentCategory?: string;
}

// Sample Controls Data
const sampleControls: Control[] = [
  {
    id: 'CTL-001',
    title: 'Access Control Management',
    description: 'Formal procedures for granting, modifying, and revoking access to information systems and data.',
    category: 'Access Control',
    framework: ['SOC 2', 'ISO 27001', 'NIST'],
    owner: {
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
    },
    effectiveness: 'excellent',
    effectivenessScore: 95,
    testingFrequency: 'quarterly',
    lastTested: new Date('2024-01-10'),
    nextTestingDue: new Date('2024-04-10'),
    status: 'active',
    evidenceCount: 12,
    risks: ['RSK-001', 'RSK-002'],
    compliance: {
      soc2: true,
      iso27001: true,
      gdpr: true,
      nist: true,
    },
    testingHistory: [],
    priority: 'critical',
  },
  {
    id: 'CTL-002',
    title: 'Data Encryption Standards',
    description: 'Implementation of encryption standards for data at rest and in transit.',
    category: 'Data Protection',
    framework: ['SOC 2', 'GDPR', 'ISO 27001'],
    owner: {
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@company.com',
    },
    effectiveness: 'satisfactory',
    effectivenessScore: 78,
    testingFrequency: 'semi-annual',
    lastTested: new Date('2024-01-05'),
    nextTestingDue: new Date('2024-07-05'),
    status: 'active',
    evidenceCount: 8,
    risks: ['RSK-001', 'RSK-003'],
    compliance: {
      soc2: true,
      iso27001: true,
      gdpr: true,
      nist: false,
    },
    testingHistory: [],
    priority: 'high',
  },
  {
    id: 'CTL-003',
    title: 'Incident Response Procedures',
    description: 'Documented procedures for identifying, reporting, and responding to security incidents.',
    category: 'Incident Management',
    framework: ['SOC 2', 'NIST', 'ISO 27001'],
    owner: {
      name: 'Emma Johnson',
      email: 'emma.johnson@company.com',
    },
    effectiveness: 'needs-improvement',
    effectivenessScore: 65,
    testingFrequency: 'quarterly',
    lastTested: new Date('2023-12-15'),
    nextTestingDue: new Date('2024-03-15'),
    status: 'under-review',
    evidenceCount: 5,
    risks: ['RSK-004'],
    compliance: {
      soc2: true,
      iso27001: true,
      gdpr: false,
      nist: true,
    },
    testingHistory: [],
    priority: 'high',
  },
]

// Sample Framework Data
const sampleFrameworks: ControlFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2 Type II compliance framework',
    categories: [
      {
        id: 'cc1',
        name: 'Control Environment',
        description: 'The foundation for all other components of internal control',
        controls: ['CTL-001', 'CTL-003'],
      },
      {
        id: 'cc2',
        name: 'Communication and Information',
        description: 'Information systems and communication processes',
        controls: ['CTL-002'],
      },
    ],
    totalControls: 15,
    implementedControls: 12,
    testedControls: 10,
    compliancePercentage: 80,
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    description: 'International standard for information security management',
    categories: [
      {
        id: 'a5',
        name: 'Information Security Policies',
        description: 'Management direction and support for information security',
        controls: ['CTL-001'],
      },
      {
        id: 'a8',
        name: 'Asset Management',
        description: 'Proper handling of organizational assets',
        controls: ['CTL-002'],
      },
    ],
    totalControls: 93,
    implementedControls: 75,
    testedControls: 68,
    compliancePercentage: 73,
  },
]

// Effectiveness Configuration
const getEffectivenessConfig = (effectiveness: string) => {
  const configs = {
    'excellent': { 
      color: 'text-semantic-success', 
      bg: 'bg-semantic-success/10', 
      border: 'border-semantic-success',
      icon: CheckCircle 
    },
    'satisfactory': { 
      color: 'text-interactive-primary', 
      bg: 'bg-interactive-primary/10', 
      border: 'border-interactive-primary',
      icon: Shield 
    },
    'needs-improvement': { 
      color: 'text-semantic-warning', 
      bg: 'bg-semantic-warning/10', 
      border: 'border-semantic-warning',
      icon: AlertTriangle 
    },
    'inadequate': { 
      color: 'text-semantic-error', 
      bg: 'bg-semantic-error/10', 
      border: 'border-semantic-error',
      icon: AlertTriangle 
    },
  }
  return configs[effectiveness as keyof typeof configs] || configs.satisfactory;
}

// Status Configuration
const getStatusConfig = (status: string) => {
  const configs = {
    'active': { variant: 'default' as const, icon: CheckCircle },
    'draft': { variant: 'secondary' as const, icon: Edit },
    'inactive': { variant: 'outline' as const, icon: Clock },
    'under-review': { variant: 'destructive' as const, icon: AlertTriangle },
  }
  return configs[status as keyof typeof configs] || configs.active;
}

// Control Card Component
const ControlCard: React.FC<{ 
  control: Control 
  onAction: (_action: string, control: Control) => void;
}> = ({ control, onAction }) => {
  const effectivenessConfig = getEffectivenessConfig(control.effectiveness);
  const statusConfig = getStatusConfig(control.status);
  const StatusIcon = statusConfig.icon;
  const EffectivenessIcon = effectivenessConfig.icon;

  const isOverdue = control.nextTestingDue < new Date() && control.status === 'active';
  const daysSinceLastTest = Math.floor((new Date().getTime() - control.lastTested.getTime()) / (1000 * 3600 * 24));

  return (
    <div className="p-enterprise-4 border border-border rounded-lg hover:shadow-notion-sm transition-all duration-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-3">
        <div className="flex-1">
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
            <span className="text-caption font-medium text-text-tertiary">{control.id}</span>
            <DaisyBadge variant={statusConfig.variant} className="text-caption" >
  <StatusIcon className="h-3 w-3 mr-enterprise-1" />
</DaisyBadge>
              {control.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </DaisyBadge>
          </div>
          <h3 className="text-body-base font-semibold text-text-primary mb-enterprise-1">
            {control.title}
          </h3>
          <p className="text-caption text-text-secondary line-clamp-2">
            {control.description}
          </p>
        </div>
        <DaisyButton 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => onAction('menu', control)} />
          <MoreHorizontal className="h-3 w-3" />
        </DaisyButton>
      </div>

      {/* Effectiveness & Score */}
      <div className="flex items-center justify-between mb-enterprise-3">
        <div className={cn(
          "inline-flex items-center px-enterprise-2 py-enterprise-1 rounded-full border text-caption font-medium",
          effectivenessConfig.color,
          effectivenessConfig.bg,
          effectivenessConfig.border
        )}>
          <EffectivenessIcon className="h-3 w-3 mr-enterprise-1" />
          {control.effectiveness.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
        <div className="flex items-center space-x-enterprise-3 text-caption text-text-secondary">
          <span>Score: {control.effectivenessScore}%</span>
          <span>Evidence: {control.evidenceCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-enterprise-3">
        <div className="flex items-center justify-between mb-enterprise-1">
          <span className="text-caption text-text-secondary">Effectiveness</span>
          <span className="text-caption font-medium text-text-primary">{control.effectivenessScore}%</span>
        </div>
        <DaisyProgress 
          value={control.effectivenessScore} 
          className="h-2" />
</div>

      {/* Metadata */}
      <div className="space-y-enterprise-2">
        {/* Owner & Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <div className="h-5 w-5 rounded-full bg-surface-secondary flex items-center justify-center">
              <Users className="h-3 w-3 text-text-tertiary" />
            </div>
            <span className="text-caption text-text-secondary">{control.owner.name}</span>
          </div>
          <DaisyBadge variant="outline" className="text-caption" >
  {control.category}
</DaisyProgress>
          </DaisyBadge>
        </div>

        {/* Testing Schedule */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <DaisyCalendar className={cn(
              "h-3 w-3",
              isOverdue ? "text-semantic-error" : "text-text-tertiary"
            )} />
<span className={cn(
              "text-caption",
              isOverdue ? "text-semantic-error font-medium" : "text-text-secondary"
            )}>
              Next Test: {control.nextTestingDue.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-enterprise-1">
            <Activity className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">{control.testingFrequency}</span>
          </div>
        </div>

        {/* Framework Compliance */}
        <div className="flex flex-wrap gap-enterprise-1">
          {control.framework.slice(0, 2).map((framework) => (
            <DaisyBadge key={framework} variant="outline" className="text-caption" >
  {framework}
</DaisyCalendar>
            </DaisyBadge>
          ))}
          {control.framework.length > 2 && (
            <DaisyBadge variant="outline" className="text-caption" >
  +{control.framework.length - 2}
</DaisyBadge>
            </DaisyBadge>
          )}
        </div>

        {/* Last Testing Info */}
        <div className="flex items-center justify-between text-caption text-text-tertiary">
          <span>Last tested {daysSinceLastTest} days ago</span>
          <span>{control.risks.length} risk{control.risks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-enterprise-3 pt-enterprise-3 border-t border-border">
        <div className="flex items-center space-x-enterprise-1">
          <DaisyButton 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('view', control)} />
            <Eye className="h-3 w-3 mr-enterprise-1" />
            View
          </DaisyButton>
          <DaisyButton 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('test', control)} />
            <Activity className="h-3 w-3 mr-enterprise-1" />
            Test
          </DaisyButton>
        </div>
        <span className="text-caption text-text-tertiary">
          Priority: {control.priority}
        </span>
      </div>
    </div>
  );
}

// Control Library Component
const ControlLibrary: React.FC = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter controls
  const filteredControls = sampleControls.filter(control => {
    const matchesSearch = control.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         control.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || control.category === selectedCategory;
    const matchesFramework = selectedFramework === 'all' || control.framework.includes(selectedFramework);
    const matchesStatus = selectedStatus === 'all' || control.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesFramework && matchesStatus;
  });

  const handleControlAction = (_action: string, control: Control) => {
    switch (action) {
      case 'view':
        toast.success(`Viewing details for ${control.title}`);
        break;
      case 'edit':
        toast.success(`Editing ${control.title}`);
        break;
      case 'test':
        toast.success(`Starting test for ${control.title}`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${control.title}"?`)) {
          toast.success(`Deleted ${control.title}`);
        }
        break;
      default:
        toast(`Action "${action}" not yet implemented for ${control.title}`);
    }
  }

  const _categories = [...new Set(sampleControls.map(c => c.category))];
  const frameworks = [...new Set(sampleControls.flatMap(c => c.framework))];
  const statuses = [...new Set(sampleControls.map(c => c.status))];

  return (
    <div className="space-y-enterprise-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-enterprise-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-enterprise-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-text-tertiary" />
            <DaisyInput
              placeholder="Search controls..."
              value={searchQuery}
              onChange={(e) = />
setSearchQuery(e.target.value)}
              className="pl-enterprise-8 w-64" />
          </div>

          {/* Filters */}
          <DaisySelect value={selectedCategory} onValueChange={setSelectedCategory} >
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue placeholder="Category" />
</DaisyInput>
            <DaisySelectContent >
                <DaisySelectItem value="all">All Categories</DaisySelectItem>
              {categories.map(category => (
                <DaisySelectItem key={category} value={category}>{category}</DaisySelectItem>
              ))}
            </DaisySelectContent>
          </DaisySelect>

          <DaisySelect value={selectedFramework} onValueChange={setSelectedFramework} >
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue placeholder="Framework" />
</DaisySelect>
            <DaisySelectContent >
                <DaisySelectItem value="all">All Frameworks</DaisySelectItem>
              {frameworks.map(framework => (
                <DaisySelectItem key={framework} value={framework}>{framework}</DaisySelectItem>
              ))}
            </DaisySelectContent>
          </DaisySelect>

          <DaisySelect value={selectedStatus} onValueChange={setSelectedStatus} >
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue placeholder="Status" />
</DaisySelect>
            <DaisySelectContent >
                <DaisySelectItem value="all">All Status</DaisySelectItem>
              {statuses.map(status => (
                <DaisySelectItem key={status} value={status} >
                    {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DaisySelectItem>
              ))}
            </DaisySelectContent>
          </DaisySelect>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-secondary">
          {filteredControls.length} control{filteredControls.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Controls Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
        {filteredControls.map((control) => (
          <ControlCard
            key={control.id}
            control={control}
            onAction={handleControlAction} />
        ))}
      </div>

      {/* Empty State */}
      {filteredControls.length === 0 && (
        <div className="text-center py-enterprise-12">
          <Shield className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            No controls found
          </h3>
          <p className="text-body-base text-text-secondary mb-enterprise-4">
            Try adjusting your filters or search terms.
          </p>
          <DaisyButton variant="outline">
          Clear Filters

        </DaisyButton>
          </DaisyButton>
        </div>
      )}
    </div>
  );
}

// Main Controls Management Dashboard
export const ControlsManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('library')
  const [proboControls, setProboControls] = useState<any[]>([]);
  const [isLoadingProbo, setIsLoadingProbo] = useState(false);
  const [isCreateControlModalOpen, setIsCreateControlModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalControls = sampleControls.length;
  const activeControls = sampleControls.filter(c => c.status === 'active').length;
  const overdueTests = sampleControls.filter(c => c.nextTestingDue < new Date() && c.status === 'active').length;
  const avgEffectiveness = Math.round(sampleControls.reduce((sum, c) => sum + c.effectivenessScore, 0) / totalControls);

  const handleExportControls = async (format: 'csv' | 'pdf' | 'json' = 'csv') => {
    try {
      await ExportService.exportControls(sampleControls, { format });
    } catch (error) {
      // console.error('Export failed:', error)
    }
  }

  const handleCreateControl = () => {
    setIsCreateControlModalOpen(true);
  }

  const handleControlCreated = (newControl: any) => {
    // In a real app, you would refresh the data
    setRefreshKey(prev => prev + 1)
    toast.success('Control created successfully!');
  }

  const handleOpenSettings = () => {
    toast.success('Opening controls management settings...');
    // Navigate to settings page or open settings modal
  }

  // Load Probo controls when tab is active
  useEffect(() => {
    const loadProboControls = async () => {
      if (activeTab !== 'probo') return
      
      setIsLoadingProbo(true);
      try {
        const response = await fetch('/api/controls/probo?organizationId=org-1');
        if (response.ok) {
          const _result = await response.json();
          setProboControls(result.data || []);
        }
      } catch (error) {
        // console.error('Failed to load Probo controls:', error)
      } finally {
        setIsLoadingProbo(false);
      }
    }

    loadProboControls();
  }, [activeTab]);

  return (
    <MainContentArea
      title="Controls Management"
      subtitle="Comprehensive security controls library and testing management"
      breadcrumbs={[
        { label: 'Controls Management', current: true },
      ]}
      primaryAction={{
        label: 'New Control',
        onClick: handleCreateControl,
        icon: Plus,
      }}
      secondaryActions={[
        {
          label: 'Export CSV',
          onClick: () => handleExportControls('csv'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Export PDF',
          onClick: () => handleExportControls('pdf'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Settings',
          onClick: handleOpenSettings,
          icon: Settings,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'total controls',
          value: totalControls,
          variant: 'default',
        },
        {
          label: 'active controls',
          value: activeControls,
          variant: 'default',
        },
        {
          label: 'overdue tests',
          value: overdueTests,
          variant: overdueTests > 0 ? 'destructive' : 'default',
        },
        {
          label: 'avg effectiveness',
          value: `${avgEffectiveness}%`,
          variant: avgEffectiveness >= 80 ? 'default' : 'warning',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-enterprise-6" >
          <DaisyTabsList >
            <DaisyTabsTrigger value="library">Control Library</DaisyTabs>
          <DaisyTabsTrigger value="probo" >
              <Shield className="h-4 w-4 mr-2" />
            Probo Controls
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="testing">Testing</DaisyTabsTrigger>
          <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
          <DaisyTabsTrigger value="analytics">Analytics</DaisyTabsTrigger>
        </DaisyTabsList>
      </DaisyTabs>

      <DaisyTabsContent value="library" >
          <ControlLibrary />
      </DaisyTabsContent>

      <DaisyTabsContent value="probo" className="space-y-6" >
          <div className="bg-gradient-to-r from-[#199BEC]/5 to-[#199BEC]/10 rounded-lg p-6 border border-[#199BEC]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#199BEC] rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Probo Security Controls Library</h3>
                <p className="text-sm text-gray-600">
                  Access 651+ industry-standard security controls with AI-powered implementation guidance
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#199BEC]">651</div>
              <div className="text-xs text-gray-500">Available Controls</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-red-600">
                {proboControls.filter(c => c.importance === 'MANDATORY').length}
              </div>
              <div className="text-xs text-gray-600">Mandatory</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-yellow-600">
                {proboControls.filter(c => c.importance === 'PREFERRED').length}
              </div>
              <div className="text-xs text-gray-600">Preferred</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-600">
                {proboControls.filter(c => c.importance === 'ADVANCED').length}
              </div>
              <div className="text-xs text-gray-600">Advanced</div>
            </div>
          </div>
        </div>

        {isLoadingProbo ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC] mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading Probo controls...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {proboControls.map((control) => (
              <div key={control.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <DaisyBadge 
                        variant={
                          control.importance === 'MANDATORY' ? 'destructive' :
                          control.importance === 'PREFERRED' ? 'secondary' : 'outline'
                        }
                        className="text-xs" >
  {control.importance}
</DaisyBadge>
          </DaisyTabsContent>
                      <DaisyBadge variant="outline" className="text-xs" >
  {control.category}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{control.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {control.description?.split('##')[0]?.trim() || 'No description available'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-[#199BEC]">
                      {control.riskReduction}%
                    </div>
                    <div className="text-xs text-gray-500">Risk Reduction</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex space-x-4 text-xs text-gray-500">
                    <span>{control.evidenceCount || 0} evidence</span>
                    <span>{control.taskCount || 0} tasks</span>
                    <span>{control.measureCount || 0} measures</span>
                  </div>
                  <div className="flex space-x-2">
                    <DaisyButton variant="outline" size="sm">
          Implement

        </DaisyButton>
                    </DaisyButton>
                    <DaisyButton variant="ghost" size="sm">
          View Details

        </DaisyButton>
                    </DaisyButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DaisyTabsContent>

      <DaisyTabsContent value="testing" >
          <ControlTestingWorkflow />
      </DaisyTabsContent>

      <DaisyTabsContent value="compliance" >
          <ComplianceMapping />
      </DaisyTabsContent>

      <DaisyTabsContent value="analytics" >
          <div className="text-center py-enterprise-12">
          <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Control Analytics
          </h3>
          <p className="text-body-base text-text-secondary">
            Comprehensive controls metrics and trends.
          </p>
        </div>
      </DaisyTabsContent>

      {/* Create Control Modal */}
      <CreateControlModal
        open={isCreateControlModalOpen}
        onOpenChange={setIsCreateControlModalOpen}
        onControlCreated={handleControlCreated} />
    </MainContentArea>
  );
}

export default ControlsManagementDashboard;