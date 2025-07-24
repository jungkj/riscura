'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Target,
  Shield,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
  Calendar,
  Users,
  Activity,
  MapPin,
  Layers,
  Filter,
  Download,
} from 'lucide-react';

// Types
interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  categories: ComplianceCategory[];
  totalRequirements: number;
  mappedRequirements: number;
  implementedControls: number;
  testedControls: number;
  complianceScore: number; // 0-100
  lastAssessment: Date;
  nextAssessment: Date;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
}

interface ComplianceCategory {
  id: string;
  name: string;
  description: string;
  requirements: ComplianceRequirement[];
  complianceScore: number;
  controlCount: number;
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  mappedControls: string[]; // Control IDs
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable' | 'gap';
  lastTested?: Date;
  evidence: string[];
  gaps?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface GapAnalysis {
  frameworkId: string;
  totalGaps: number;
  criticalGaps: number;
  highGaps: number;
  mediumGaps: number;
  lowGaps: number;
  gapsByCategory: { [categoryId: string]: number };
  recommendedActions: RecommendedAction[];
}

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string; // e.g., "2-4 weeks"
  requirements: string[]; // Requirement IDs this action addresses
}

// Sample Compliance Data
const sampleFrameworks: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    version: '2017',
    description: 'Service Organization Control 2 Type II Trust Services Criteria',
    categories: [
      {
        id: 'cc1',
        name: 'Control Environment',
        description: 'Policies and procedures are established and management monitors the design and operating effectiveness',
        requirements: [
          {
            id: 'cc1.1',
            title: 'Control Environment Policies',
            description: 'Management establishes, maintains, and monitors policies and procedures for control environment',
            mandatory: true,
            mappedControls: ['CTL-001', 'CTL-003'],
            status: 'compliant',
            lastTested: new Date('2024-01-10'),
            evidence: ['POL-001', 'PROC-001'],
            priority: 'critical',
          },
          {
            id: 'cc1.2',
            title: 'Communication of Policies',
            description: 'Management communicates control environment policies and procedures to personnel',
            mandatory: true,
            mappedControls: [],
            status: 'gap',
            evidence: [],
            gaps: ['No formal communication process documented'],
            priority: 'high',
          },
        ],
        complianceScore: 75,
        controlCount: 2,
      },
      {
        id: 'cc2',
        name: 'Communication and Information',
        description: 'Information needed to support controls is identified, captured, and communicated',
        requirements: [
          {
            id: 'cc2.1',
            title: 'Information Quality',
            description: 'Information relevant to control objectives is identified and communicated',
            mandatory: true,
            mappedControls: ['CTL-002'],
            status: 'partial',
            lastTested: new Date('2024-01-05'),
            evidence: ['DOC-001'],
            gaps: ['Information quality metrics not defined'],
            priority: 'medium',
          },
        ],
        complianceScore: 60,
        controlCount: 1,
      },
    ],
    totalRequirements: 3,
    mappedRequirements: 2,
    implementedControls: 3,
    testedControls: 2,
    complianceScore: 67,
    lastAssessment: new Date('2024-01-01'),
    nextAssessment: new Date('2024-12-31'),
    status: 'partial',
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    version: '2022',
    description: 'Information Security Management Systems - Requirements',
    categories: [
      {
        id: 'a5',
        name: 'Information Security Policies',
        description: 'Management direction and support for information security',
        requirements: [
          {
            id: 'a5.1.1',
            title: 'Information Security Policy',
            description: 'An information security policy shall be defined and approved by management',
            mandatory: true,
            mappedControls: ['CTL-001'],
            status: 'compliant',
            lastTested: new Date('2024-01-15'),
            evidence: ['POL-SEC-001'],
            priority: 'critical',
          },
        ],
        complianceScore: 100,
        controlCount: 1,
      },
    ],
    totalRequirements: 1,
    mappedRequirements: 1,
    implementedControls: 1,
    testedControls: 1,
    complianceScore: 100,
    lastAssessment: new Date('2024-01-15'),
    nextAssessment: new Date('2024-07-15'),
    status: 'compliant',
  },
];

// Status Configuration
const getComplianceStatusConfig = (status: string) => {
  const configs = {
    'compliant': { 
      variant: 'default' as const, 
      color: 'text-semantic-success',
      bg: 'bg-semantic-success/10',
      icon: CheckCircle 
    },
    'partial': { 
      variant: 'secondary' as const, 
      color: 'text-semantic-warning',
      bg: 'bg-semantic-warning/10',
      icon: AlertTriangle 
    },
    'non-compliant': { 
      variant: 'destructive' as const, 
      color: 'text-semantic-error',
      bg: 'bg-semantic-error/10',
      icon: X 
    },
    'gap': { 
      variant: 'destructive' as const, 
      color: 'text-semantic-error',
      bg: 'bg-semantic-error/10',
      icon: AlertTriangle 
    },
    'not-applicable': { 
      variant: 'outline' as const, 
      color: 'text-text-tertiary',
      bg: 'bg-surface-secondary',
      icon: Target 
    },
    'not-assessed': { 
      variant: 'outline' as const, 
      color: 'text-text-tertiary',
      bg: 'bg-surface-secondary',
      icon: Target 
    },
  };
  return configs[status as keyof typeof configs] || configs['not-assessed'];
};

// Framework Overview Card
const FrameworkOverviewCard: React.FC<{
  framework: ComplianceFramework;
  onSelect: (framework: ComplianceFramework) => void;
}> = ({ framework, onSelect }) => {
  const statusConfig = getComplianceStatusConfig(framework.status);
  const StatusIcon = statusConfig.icon;

  const compliancePercentage = Math.round((framework.mappedRequirements / framework.totalRequirements) * 100);
  const testingPercentage = Math.round((framework.testedControls / framework.implementedControls) * 100);

  return (
    <div 
      className="p-enterprise-4 border border-border rounded-lg hover:shadow-notion-sm transition-all duration-200 bg-white cursor-pointer"
      onClick={() => onSelect(framework)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-3">
        <div className="flex-1">
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
            <h3 className="text-body-base font-semibold text-text-primary">
              {framework.name}
            </h3>
            <DaisyBadge variant={statusConfig.variant} className="text-caption">
              <StatusIcon className="h-3 w-3 mr-enterprise-1" />
              {framework.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </DaisyBadge>
          </div>
          <p className="text-caption text-text-secondary line-clamp-2">
            {framework.description}
          </p>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="mb-enterprise-3">
        <div className="flex items-center justify-between mb-enterprise-1">
          <span className="text-caption text-text-secondary">Compliance Score</span>
          <span className="text-caption font-medium text-text-primary">{framework.complianceScore}%</span>
        </div>
        <DaisyProgress value={framework.complianceScore} className="h-2" />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-enterprise-3 mb-enterprise-3">
        <div className="text-center">
          <div className="text-body-base font-semibold text-text-primary">
            {framework.mappedRequirements}/{framework.totalRequirements}
          </div>
          <div className="text-caption text-text-secondary">Requirements Mapped</div>
        </div>
        <div className="text-center">
          <div className="text-body-base font-semibold text-text-primary">
            {framework.testedControls}/{framework.implementedControls}
          </div>
          <div className="text-caption text-text-secondary">Controls Tested</div>
        </div>
      </div>

      {/* Assessment Dates */}
      <div className="space-y-enterprise-1 text-caption text-text-tertiary">
        <div className="flex items-center justify-between">
          <span>Last Assessment:</span>
          <span>{framework.lastAssessment.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Next Assessment:</span>
          <span>{framework.nextAssessment.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

// Requirement Detail Component
const RequirementDetail: React.FC<{
  requirement: ComplianceRequirement;
  onControlMap: (requirementId: string, controlId: string) => void;
}> = ({ requirement, onControlMap }) => {
  const statusConfig = getComplianceStatusConfig(requirement.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-enterprise-3 border border-border rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-2">
        <div className="flex-1">
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
            <span className="text-caption font-medium text-text-tertiary">{requirement.id}</span>
            <DaisyBadge variant={statusConfig.variant} className="text-caption">
              <StatusIcon className="h-3 w-3 mr-enterprise-1" />
              {requirement.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </DaisyBadge>
            {requirement.mandatory && (
              <DaisyBadge variant="outline" className="text-caption">
                Mandatory
              </DaisyBadge>
            )}
          </div>
          <h4 className="text-body-sm font-medium text-text-primary mb-enterprise-1">
            {requirement.title}
          </h4>
          <p className="text-caption text-text-secondary">
            {requirement.description}
          </p>
        </div>
      </div>

      {/* Mapped Controls */}
      <div className="mb-enterprise-2">
        <div className="flex items-center justify-between mb-enterprise-1">
          <span className="text-caption font-medium text-text-primary">Mapped Controls</span>
          <DaisyButton variant="outline" size="sm" className="h-6 px-enterprise-2">
            <MapPin className="h-3 w-3 mr-enterprise-1" />
            Map Control
          </DaisyButton>
        </div>
        {requirement.mappedControls.length > 0 ? (
          <div className="flex flex-wrap gap-enterprise-1">
            {requirement.mappedControls.map((controlId) => (
              <DaisyBadge key={controlId} variant="outline" className="text-caption">
                {controlId}
              </DaisyBadge>
            ))}
          </div>
        ) : (
          <p className="text-caption text-text-tertiary italic">No controls mapped</p>
        )}
      </div>

      {/* Gaps */}
      {requirement.gaps && requirement.gaps.length > 0 && (
        <div className="mb-enterprise-2">
          <span className="text-caption font-medium text-text-primary">Identified Gaps</span>
          <div className="mt-enterprise-1 space-y-enterprise-1">
            {requirement.gaps.map((gap, index) => (
              <div key={index} className="flex items-start space-x-enterprise-2 text-caption text-semantic-error">
                <DaisyAlertTriangle className="h-3 w-3 mt-0.5" />
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {requirement.evidence.length > 0 && (
        <div className="mb-enterprise-2">
          <span className="text-caption font-medium text-text-primary">Evidence</span>
          <div className="mt-enterprise-1 flex flex-wrap gap-enterprise-1">
            {requirement.evidence.map((evidenceId) => (
              <DaisyBadge key={evidenceId} variant="secondary" className="text-caption">
                <FileText className="h-3 w-3 mr-enterprise-1" />
                {evidenceId}
              </DaisyBadge>
            ))}
          </div>
        </div>
      )}

      {/* Testing Info */}
      <div className="flex items-center justify-between text-caption text-text-tertiary">
        <span>Priority: {requirement.priority}</span>
        {requirement.lastTested && (
          <span>Last tested: {requirement.lastTested.toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

// Category Component
const CategoryDetail: React.FC<{
  category: ComplianceCategory;
  onControlMap: (requirementId: string, controlId: string) => void;
}> = ({ category, onControlMap }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-enterprise-4 hover:bg-surface-secondary transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-enterprise-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-text-tertiary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              )}
              <div className="text-left">
                <h3 className="text-body-sm font-medium text-text-primary">
                  {category.name}
                </h3>
                <p className="text-caption text-text-secondary">
                  {category.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-body-sm font-medium text-text-primary">
                {category.complianceScore}%
              </div>
              <div className="text-caption text-text-secondary">
                {category.requirements.length} requirements
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-enterprise-4 pt-0 space-y-enterprise-3">
            {category.requirements.map((requirement) => (
              <RequirementDetail
                key={requirement.id}
                requirement={requirement}
                onControlMap={onControlMap}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Gap Analysis Component
const GapAnalysisView: React.FC<{ framework: ComplianceFramework }> = ({ framework }) => {
  const gapAnalysis = useMemo(() => {
    const gaps = framework.categories.flatMap(cat => 
      cat.requirements.filter(req => req.status === 'gap' || req.status === 'non-compliant')
    );
    
    return {
      totalGaps: gaps.length,
      criticalGaps: gaps.filter(g => g.priority === 'critical').length,
      highGaps: gaps.filter(g => g.priority === 'high').length,
      mediumGaps: gaps.filter(g => g.priority === 'medium').length,
      lowGaps: gaps.filter(g => g.priority === 'low').length,
    };
  }, [framework]);

  return (
    <div className="space-y-enterprise-6">
      {/* Gap Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-enterprise-4">
        <ContentCard title="Total Gaps" className="text-center">
          <div className="text-2xl font-bold text-semantic-error">{gapAnalysis.totalGaps}</div>
        </ContentCard>
        <ContentCard title="Critical" className="text-center">
          <div className="text-2xl font-bold text-semantic-error">{gapAnalysis.criticalGaps}</div>
        </ContentCard>
        <ContentCard title="High" className="text-center">
          <div className="text-2xl font-bold text-semantic-warning">{gapAnalysis.highGaps}</div>
        </ContentCard>
        <ContentCard title="Medium/Low" className="text-center">
          <div className="text-2xl font-bold text-interactive-primary">
            {gapAnalysis.mediumGaps + gapAnalysis.lowGaps}
          </div>
        </ContentCard>
      </div>

      {/* Gap Details */}
      <div className="space-y-enterprise-4">
        <h3 className="text-heading-base font-semibold text-text-primary">Gap Details</h3>
        {framework.categories.map((category) => {
          const categoryGaps = category.requirements.filter(req => 
            req.status === 'gap' || req.status === 'non-compliant'
          );
          
          if (categoryGaps.length === 0) return null;

          return (
            <div key={category.id} className="space-y-enterprise-2">
              <h4 className="text-body-base font-medium text-text-primary">{category.name}</h4>
              <div className="space-y-enterprise-2">
                {categoryGaps.map((requirement) => (
                  <RequirementDetail
                    key={requirement.id}
                    requirement={requirement}
                    onControlMap={() => {}}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Compliance Mapping Component
export const ComplianceMapping: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'mapping' | 'gaps'>('overview');

  const handleControlMapping = (requirementId: string, controlId: string) => {
    console.log(`Mapping control ${controlId} to requirement ${requirementId}`);
  };

  return (
    <div className="space-y-enterprise-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">Compliance Mapping</h2>
          <p className="text-body-sm text-text-secondary">
            Framework-to-control mapping and compliance gap analysis
          </p>
        </div>
        <div className="flex items-center space-x-enterprise-2">
          <DaisyButton variant="outline">
            <Download className="h-4 w-4 mr-enterprise-1" />
            Export Report
          </DaisyButton>
        </div>
      </div>

      {/* Framework Selection */}
      {!selectedFramework ? (
        <div className="space-y-enterprise-4">
          <h3 className="text-heading-sm font-semibold text-text-primary">Select Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
            {sampleFrameworks.map((framework) => (
              <FrameworkOverviewCard
                key={framework.id}
                framework={framework}
                onSelect={setSelectedFramework}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-enterprise-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-enterprise-2">
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedFramework(null)}
            >
              ← Back to Frameworks
            </DaisyButton>
            <span className="text-text-tertiary">/</span>
            <span className="text-body-sm font-medium text-text-primary">
              {selectedFramework.name}
            </span>
          </div>

          {/* Tabs */}
          <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mapping">Control Mapping</TabsTrigger>
              <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-enterprise-4">
              <div className="space-y-enterprise-4">
                {/* Framework Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-enterprise-4">
                  <ContentCard title="Compliance Score" className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {selectedFramework.complianceScore}%
                    </div>
                  </ContentCard>
                  <ContentCard title="Requirements" className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {selectedFramework.mappedRequirements}/{selectedFramework.totalRequirements}
                    </div>
                  </ContentCard>
                  <ContentCard title="Controls" className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {selectedFramework.implementedControls}
                    </div>
                  </ContentCard>
                  <ContentCard title="Tested" className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {selectedFramework.testedControls}
                    </div>
                  </ContentCard>
                </div>

                {/* Categories Overview */}
                <div className="space-y-enterprise-3">
                  <h3 className="text-heading-sm font-semibold text-text-primary">Categories</h3>
                  {selectedFramework.categories.map((category) => (
                    <div key={category.id} className="p-enterprise-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-enterprise-2">
                        <h4 className="text-body-sm font-medium text-text-primary">
                          {category.name}
                        </h4>
                        <div className="text-body-sm font-medium text-text-primary">
                          {category.complianceScore}%
                        </div>
                      </div>
                      <DaisyProgress value={category.complianceScore} className="h-2 mb-enterprise-2" />
                      <p className="text-caption text-text-secondary">
                        {category.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="mt-enterprise-4">
              <div className="space-y-enterprise-4">
                {selectedFramework.categories.map((category) => (
                  <CategoryDetail
                    key={category.id}
                    category={category}
                    onControlMap={handleControlMapping}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gaps" className="mt-enterprise-4">
              <GapAnalysisView framework={selectedFramework} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ComplianceMapping; 