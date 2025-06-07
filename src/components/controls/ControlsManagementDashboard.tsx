'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import ControlTestingWorkflow from './ControlTestingWorkflow';
import ComplianceMapping from './ComplianceMapping';
import {
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
} from 'lucide-react';

// Types
export interface Control {
  id: string;
  title: string;
  description: string;
  category: string;
  framework: string[];
  owner: {
    name: string;
    email: string;
  };
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
  };
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
];

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
];

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
  };
  return configs[effectiveness as keyof typeof configs] || configs.satisfactory;
};

// Status Configuration
const getStatusConfig = (status: string) => {
  const configs = {
    'active': { variant: 'default' as const, icon: CheckCircle },
    'draft': { variant: 'secondary' as const, icon: Edit },
    'inactive': { variant: 'outline' as const, icon: Clock },
    'under-review': { variant: 'destructive' as const, icon: AlertTriangle },
  };
  return configs[status as keyof typeof configs] || configs.active;
};

// Control Card Component
const ControlCard: React.FC<{ 
  control: Control; 
  onAction: (action: string, control: Control) => void;
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
            <Badge variant={statusConfig.variant} className="text-caption">
              <StatusIcon className="h-3 w-3 mr-enterprise-1" />
              {control.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <h3 className="text-body-base font-semibold text-text-primary mb-enterprise-1">
            {control.title}
          </h3>
          <p className="text-caption text-text-secondary line-clamp-2">
            {control.description}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => onAction('menu', control)}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
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
        <Progress 
          value={control.effectivenessScore} 
          className="h-2"
        />
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
          <Badge variant="outline" className="text-caption">
            {control.category}
          </Badge>
        </div>

        {/* Testing Schedule */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <Calendar className={cn(
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
            <Badge key={framework} variant="outline" className="text-caption">
              {framework}
            </Badge>
          ))}
          {control.framework.length > 2 && (
            <Badge variant="outline" className="text-caption">
              +{control.framework.length - 2}
            </Badge>
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('view', control)}
          >
            <Eye className="h-3 w-3 mr-enterprise-1" />
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('test', control)}
          >
            <Activity className="h-3 w-3 mr-enterprise-1" />
            Test
          </Button>
        </div>
        <span className="text-caption text-text-tertiary">
          Priority: {control.priority}
        </span>
      </div>
    </div>
  );
};

// Control Library Component
const ControlLibrary: React.FC = () => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter controls
  const filteredControls = sampleControls.filter(control => {
    const matchesSearch = control.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         control.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || control.category === selectedCategory;
    const matchesFramework = selectedFramework === 'all' || control.framework.includes(selectedFramework);
    const matchesStatus = selectedStatus === 'all' || control.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesFramework && matchesStatus;
  });

  const handleControlAction = (action: string, control: Control) => {
    console.log(`Action: ${action}`, control);
  };

  const categories = [...new Set(sampleControls.map(c => c.category))];
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
            <Input
              placeholder="Search controls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-enterprise-8 w-64"
            />
          </div>

          {/* Filters */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {frameworks.map(framework => (
                <SelectItem key={framework} value={framework}>{framework}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            onAction={handleControlAction}
          />
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
          <Button variant="outline">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

// Main Controls Management Dashboard
export const ControlsManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('library');

  const totalControls = sampleControls.length;
  const activeControls = sampleControls.filter(c => c.status === 'active').length;
  const overdueTests = sampleControls.filter(c => c.nextTestingDue < new Date() && c.status === 'active').length;
  const avgEffectiveness = Math.round(sampleControls.reduce((sum, c) => sum + c.effectivenessScore, 0) / totalControls);

  return (
    <MainContentArea
      title="Controls Management"
      subtitle="Comprehensive security controls library and testing management"
      breadcrumbs={[
        { label: 'Controls Management', current: true },
      ]}
      primaryAction={{
        label: 'New Control',
        onClick: () => console.log('Create control'),
        icon: Plus,
      }}
      secondaryActions={[
        {
          label: 'Export',
          onClick: () => console.log('Export'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Settings',
          onClick: () => console.log('Settings'),
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-enterprise-6">
        <TabsList>
          <TabsTrigger value="library">Control Library</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
      </Tabs>

      <TabsContent value="library">
        <ControlLibrary />
      </TabsContent>

      <TabsContent value="testing">
        <ControlTestingWorkflow />
      </TabsContent>

      <TabsContent value="compliance">
        <ComplianceMapping />
      </TabsContent>

      <TabsContent value="analytics">
        <div className="text-center py-enterprise-12">
          <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
          <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
            Control Analytics
          </h3>
          <p className="text-body-base text-text-secondary">
            Comprehensive controls metrics and trends.
          </p>
        </div>
      </TabsContent>
    </MainContentArea>
  );
};

export default ControlsManagementDashboard;