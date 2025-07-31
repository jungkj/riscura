'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  Save,
  Copy,
  Download,
  Upload,
  Settings,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Plus,
  Trash2,
  Edit,
  GitBranch,
  Activity,
  Filter,
  MoreVertical,
  Zap,
  Database,
  Mail,
  Webhook,
  Code,
  FileText,
  UserCheck,
  Timer,
} from 'lucide-react';

// ========== TYPES ==========
export interface WorkflowStep {
  id: string;
  type: 'form-submission' | 'parallel-review' | 'automated-suggestion' | 'approval' | 'notification' | 'integration' | 'condition' | 'timer';
  name: string;
  description?: string;
  assignee?: string;
  assignees?: string[];
  sla?: string;
  escalation?: string;
  validation?: string;
  position: { x: number; y: number };
  config?: any;
  status?: 'pending' | 'active' | 'completed' | 'failed';
  connections?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  permissions: string[];
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  slaConfig?: {
    enabled: boolean;
    defaultTimeout: string;
    escalationRules: EscalationRule[];
  };
  status: 'draft' | 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EscalationRule {
  id: string;
  condition: string;
  action: string;
  assignee: string;
  delay: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
  steps: Partial<WorkflowStep>[];
  tags: string[];
}

// ========== STEP TYPE CONFIGURATIONS ==========
const stepTypeConfigs = {
  'form-submission': {
    icon: FileText,
    color: 'bg-blue-500',
    label: 'Form Submission',
    description: 'Collect data through forms',
  },
  'parallel-review': {
    icon: Users,
    color: 'bg-purple-500',
    label: 'Parallel Review',
    description: 'Multiple reviewers simultaneously',
  },
  'automated-suggestion': {
    icon: Zap,
    color: 'bg-yellow-500',
    label: 'AI Automation',
    description: 'AI-powered recommendations',
  },
  'approval': {
    icon: UserCheck,
    color: 'bg-green-500',
    label: 'Approval',
    description: 'Require approval to proceed',
  },
  'notification': {
    icon: Mail,
    color: 'bg-orange-500',
    label: 'Notification',
    description: 'Send notifications',
  },
  'integration': {
    icon: Database,
    color: 'bg-indigo-500',
    label: 'Integration',
    description: 'External system integration',
  },
  'condition': {
    icon: GitBranch,
    color: 'bg-gray-500',
    label: 'Condition',
    description: 'Conditional branching',
  },
  'timer': {
    icon: Timer,
    color: 'bg-red-500',
    label: 'Timer',
    description: 'Wait for specified duration',
  },
};

// ========== WORKFLOW STEP COMPONENT ==========
const WorkflowStepNode: React.FC<{
  step: WorkflowStep;
  selected: boolean;
  onSelect: (step: WorkflowStep) => void;
  onEdit: (step: WorkflowStep) => void;
  onDelete: (stepId: string) => void;
  onConnect: (fromStepId: string, toStepId: string) => void;
}> = ({ step, selected, onSelect, onEdit, onDelete, onConnect }) => {
  const config = stepTypeConfigs[step.type];
  const IconComponent = config.icon;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'border-semantic-success bg-semantic-success/10';
      case 'active': return 'border-interactive-primary bg-interactive-primary/10';
      case 'failed': return 'border-semantic-error bg-semantic-error/10';
      default: return 'border-border bg-white';
    }
  };

  return (
    <div 
      className={cn(
        "relative w-64 min-h-24 border-2 rounded-lg p-enterprise-4 cursor-pointer transition-all duration-200",
        selected ? "border-interactive-primary shadow-notion-md" : getStatusColor(step.status),
        "hover:shadow-notion-md"
      )}
      style={{ 
        position: 'absolute', 
        left: step.position.x, 
        top: step.position.y 
      }}
      onClick={() => onSelect(step)}
    >
      {/* Step Header */}
      <div className="flex items-start justify-between mb-enterprise-2">
        <div className="flex items-center space-x-enterprise-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
            <IconComponent className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="text-body-sm font-semibold text-text-primary">{step.name}</h4>
            <p className="text-caption text-text-tertiary">{config.label}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-enterprise-1">
          {step.status && (
            <DaisyBadge 
              variant={step.status === 'completed' ? 'default' : step.status === 'failed' ? 'destructive' : 'secondary'}
              className="text-caption" >
  {step.status}
</DaisyBadge>
            </DaisyBadge>
          )}
          
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(step);
            }}
            className="h-6 w-6 p-0"
          >
            <MoreVertical className="h-3 w-3" />
          </DaisyButton>
        </div>
      </div>

      {/* Step Details */}
      <div className="space-y-enterprise-1">
        {step.description && (
          <p className="text-caption text-text-secondary">{step.description}</p>
        )}
        
        {step.assignee && (
          <div className="flex items-center space-x-enterprise-1">
            <Users className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">{step.assignee}</span>
          </div>
        )}
        
        {step.sla && (
          <div className="flex items-center space-x-enterprise-1">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">SLA: {step.sla}</span>
          </div>
        )}
      </div>

      {/* Connection Points */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-interactive-primary rounded-full border-2 border-white cursor-crosshair" />
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 rounded-full border-2 border-white" />
    </div>
  );
};

// ========== STEP PALETTE COMPONENT ==========
const StepPalette: React.FC<{
  onAddStep: (type: string) => void;
}> = ({ onAddStep }) => {
  return (
    <div className="w-80 border-r border-border bg-surface-secondary p-enterprise-4">
      <div className="space-y-enterprise-4">
        <div>
          <h3 className="text-body-base font-semibold text-text-primary mb-enterprise-2">
            Workflow Steps
          </h3>
          <p className="text-caption text-text-secondary">
            Drag steps to the canvas to build your workflow
          </p>
        </div>

        <div className="space-y-enterprise-2">
          {Object.entries(stepTypeConfigs).map(([type, config]) => {
            const IconComponent = config.icon;
            
            return (
              <div
                key={type}
                className="flex items-center space-x-enterprise-3 p-enterprise-3 border border-border rounded-lg bg-white cursor-pointer hover:bg-surface-secondary transition-colors"
                onClick={() => onAddStep(type)}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-text-primary">{config.label}</p>
                  <p className="text-caption text-text-secondary">{config.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DaisySeparator />

        <div>
          <h4 className="text-body-sm font-semibold text-text-primary mb-enterprise-2">
            Templates
          </h4>
          <div className="space-y-enterprise-2">
            <div className="p-enterprise-3 border border-border rounded-lg bg-white cursor-pointer hover:bg-surface-secondary transition-colors">
              <p className="text-body-sm font-medium text-text-primary">Risk Assessment</p>
              <p className="text-caption text-text-secondary">Standard risk evaluation process</p>
            </div>
            <div className="p-enterprise-3 border border-border rounded-lg bg-white cursor-pointer hover:bg-surface-secondary transition-colors">
              <p className="text-body-sm font-medium text-text-primary">Compliance Review</p>
              <p className="text-caption text-text-secondary">Framework compliance workflow</p>
            </div>
            <div className="p-enterprise-3 border border-border rounded-lg bg-white cursor-pointer hover:bg-surface-secondary transition-colors">
              <p className="text-body-sm font-medium text-text-primary">Incident Response</p>
              <p className="text-caption text-text-secondary">Security incident handling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== WORKFLOW CANVAS COMPONENT ==========
const WorkflowCanvas: React.FC<{
  workflow: WorkflowDefinition;
  selectedStep: WorkflowStep | null;
  onSelectStep: (step: WorkflowStep | null) => void;
  onEditStep: (step: WorkflowStep) => void;
  onDeleteStep: (stepId: string) => void;
  onAddStep: (type: string) => void;
  onUpdateWorkflow: (workflow: WorkflowDefinition) => void;
}> = ({ 
  workflow, 
  selectedStep, 
  onSelectStep, 
  onEditStep, 
  onDeleteStep, 
  onAddStep,
  onUpdateWorkflow 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectStep(null);
    }
  };

  const handleAddStepToCanvas = useCallback((type: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: type as any,
      name: `New ${stepTypeConfigs[type as keyof typeof stepTypeConfigs].label}`,
      position: { x: 100, y: 100 },
      status: 'pending',
      connections: [],
    };

    const updatedWorkflow = {
      ...workflow,
      steps: [...workflow.steps, newStep],
    };

    onUpdateWorkflow(updatedWorkflow);
  }, [workflow, onUpdateWorkflow]);

  return (
    <div className="flex-1 relative">
      {/* Canvas Toolbar */}
      <div className="absolute top-enterprise-4 left-enterprise-4 z-10 flex items-center space-x-enterprise-2">
        <DaisyButton variant="outline" size="sm" >
  <Play className="h-4 w-4 mr-enterprise-1" />
</DaisySeparator>
          Test Run
        </DaisyButton>
        <DaisyButton variant="outline" size="sm" >
  <Save className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
          Save
        </DaisyButton>
        <DaisyButton variant="outline" size="sm" >
  <Download className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
          Export
        </DaisyButton>
        
        <DaisySeparator orientation="vertical" className="h-6" />
        
        <div className="flex items-center space-x-enterprise-2">
          <span className="text-caption text-text-secondary">Zoom:</span>
          <DaisySelect defaultValue="100" />
            <DaisySelectTrigger className="w-20 h-8" />
              <DaisySelectValue /></DaisySeparator>
            <DaisySelectContent />
              <DaisySelectItem value="50">50%</DaisySelectContent>
              <DaisySelectItem value="75">75%</DaisySelectItem>
              <DaisySelectItem value="100">100%</DaisySelectItem>
              <DaisySelectItem value="125">125%</DaisySelectItem>
              <DaisySelectItem value="150">150%</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="w-full h-full bg-gray-50 relative overflow-auto"
        style={{ 
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          minHeight: '800px'
        }}
        onClick={handleCanvasClick}
      >
        {/* Workflow Steps */}
        {workflow.steps.map((step) => (
          <WorkflowStepNode
            key={step.id}
            step={step}
            selected={selectedStep?.id === step.id}
            onSelect={onSelectStep}
            onEdit={onEditStep}
            onDelete={onDeleteStep}
            onConnect={() => {}}
          />
        ))}

        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {workflow.steps.map((step) => 
            step.connections?.map((connectionId) => {
              const targetStep = workflow.steps.find(s => s.id === connectionId);
              if (!targetStep) return null;

              const startX = step.position.x + 256; // step width
              const startY = step.position.y + 48; // step height / 2
              const endX = targetStep.position.x;
              const endY = targetStep.position.y + 48;

              return (
                <g key={`${step.id}-${connectionId}`}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#6366F1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })
          )}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6366F1"
              />
            </marker>
          </defs>
        </svg>

        {/* Empty State */}
        {workflow.steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
              <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
                Start Building Your Workflow
              </h3>
              <p className="text-body-base text-text-secondary mb-enterprise-4 max-w-md">
                Drag workflow steps from the left panel to create your automated process.
              </p>
              <DaisyButton onClick={() => handleAddStepToCanvas('form-submission')} />
                <Plus className="h-4 w-4 mr-enterprise-1" />
                Add First Step
              </DaisyButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== STEP PROPERTIES PANEL ==========
const StepPropertiesPanel: React.FC<{
  step: WorkflowStep | null;
  onUpdateStep: (step: WorkflowStep) => void;
  onClose: () => void;
}> = ({ step, onUpdateStep, onClose }) => {
  if (!step) return null;

  const config = stepTypeConfigs[step.type];
  const IconComponent = config.icon;

  return (
    <div className="w-80 border-l border-border bg-white p-enterprise-4 overflow-y-auto">
      <div className="space-y-enterprise-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
              <IconComponent className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-body-base font-semibold text-text-primary">{config.label}</h3>
              <p className="text-caption text-text-secondary">Step Configuration</p>
            </div>
          </div>
          <DaisyButton variant="ghost" size="sm" onClick={onClose} >
  <Trash2 className="h-4 w-4" />
</DaisyButton>
          </DaisyButton>
        </div>

        <DaisySeparator />

        {/* Basic Properties */}
        <div className="space-y-enterprise-4">
          <div>
            <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
              Step Name
            </label>
            <input
              type="text"
              value={step.name}
              onChange={(e) => onUpdateStep({ ...step, name: e.target.value })}
              className="w-full px-enterprise-3 py-enterprise-2 border border-border rounded-lg text-body-sm"
              placeholder="Enter step name"
            />
          </div>

          <div>
            <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
              Description
            </label>
            <textarea
              value={step.description || ''}
              onChange={(e) => onUpdateStep({ ...step, description: e.target.value })}
              className="w-full px-enterprise-3 py-enterprise-2 border border-border rounded-lg text-body-sm"
              placeholder="Enter step description"
              rows={3}
            />
          </div>

          <div>
            <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
              Assignee
            </label>
            <DaisySelect 
              value={step.assignee || ''} 
              onValueChange={(value) => onUpdateStep({ ...step, assignee: value })}
            >
              <DaisySelectTrigger />
                <DaisySelectValue placeholder="Select assignee" /></DaisySeparator>
              <DaisySelectContent />
                <DaisySelectItem value="role:risk-analyst">Risk Analyst</DaisySelectContent>
                <DaisySelectItem value="role:compliance-manager">Compliance Manager</DaisySelectItem>
                <DaisySelectItem value="role:security-officer">Security Officer</DaisySelectItem>
                <DaisySelectItem value="role:business-owner">Business Owner</DaisySelectItem>
                <DaisySelectItem value="role:technical-lead">Technical Lead</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>

          <div>
            <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
              SLA (Service Level Agreement)
            </label>
            <DaisySelect 
              value={step.sla || ''} 
              onValueChange={(value) => onUpdateStep({ ...step, sla: value })}
            >
              <DaisySelectTrigger />
                <DaisySelectValue placeholder="Select SLA" /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="2-hours">2 Hours</DaisySelectContent>
                <DaisySelectItem value="4-hours">4 Hours</DaisySelectItem>
                <DaisySelectItem value="24-hours">24 Hours</DaisySelectItem>
                <DaisySelectItem value="48-hours">48 Hours</DaisySelectItem>
                <DaisySelectItem value="72-hours">72 Hours</DaisySelectItem>
                <DaisySelectItem value="1-week">1 Week</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>

          <div>
            <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
              Escalation Policy
            </label>
            <DaisySelect 
              value={step.escalation || ''} 
              onValueChange={(value) => onUpdateStep({ ...step, escalation: value })}
            >
              <DaisySelectTrigger />
                <DaisySelectValue placeholder="Select escalation policy" /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="auto-escalate-manager">Auto-escalate to Manager</DaisySelectContent>
                <DaisySelectItem value="auto-escalate-director">Auto-escalate to Director</DaisySelectItem>
                <DaisySelectItem value="notify-only">Notify Only</DaisySelectItem>
                <DaisySelectItem value="no-escalation">No Escalation</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>
        </div>

        <DaisySeparator />

        {/* Step-specific Configuration */}
        <div className="space-y-enterprise-4">
          <h4 className="text-body-sm font-semibold text-text-primary">
            {config.label} Configuration
          </h4>

          {step.type === 'form-submission' && (
            <div>
              <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
                Form Template
              </label>
              <DaisySelect />
                <DaisySelectTrigger />
                  <DaisySelectValue placeholder="Select form template" /></DaisySeparator>
                <DaisySelectContent />
                  <DaisySelectItem value="risk-assessment-form">Risk Assessment Form</DaisySelectContent>
                  <DaisySelectItem value="compliance-checklist">Compliance Checklist</DaisySelectItem>
                  <DaisySelectItem value="incident-report">Incident Report</DaisySelectItem>
                </DaisySelectContent>
              </DaisySelect>
            </div>
          )}

          {step.type === 'parallel-review' && (
            <div>
              <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
                Consensus Requirements
              </label>
              <DaisySelect />
                <DaisySelectTrigger />
                  <DaisySelectValue placeholder="Select consensus type" /></DaisySelect>
                <DaisySelectContent />
                  <DaisySelectItem value="unanimous">Unanimous Agreement</DaisySelectContent>
                  <DaisySelectItem value="majority">Majority Rule</DaisySelectItem>
                  <DaisySelectItem value="any-approval">Any Approval</DaisySelectItem>
                </DaisySelectContent>
              </DaisySelect>
            </div>
          )}

          {step.type === 'automated-suggestion' && (
            <div>
              <label className="text-body-sm font-medium text-text-primary block mb-enterprise-1">
                AI Engine
              </label>
              <DaisySelect />
                <DaisySelectTrigger />
                  <DaisySelectValue placeholder="Select AI engine" /></DaisySelect>
                <DaisySelectContent />
                  <DaisySelectItem value="control-recommendation-ai">Control Recommendation AI</DaisySelectContent>
                  <DaisySelectItem value="risk-scoring-ai">Risk Scoring AI</DaisySelectItem>
                  <DaisySelectItem value="compliance-mapping-ai">Compliance Mapping AI</DaisySelectItem>
                </DaisySelectContent>
              </DaisySelect>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== MAIN WORKFLOW DESIGNER COMPONENT ==========
export const WorkflowDesigner: React.FC = () => {
  const [activeTab, setActiveTab] = useState('design');

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-enterprise-6 py-enterprise-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-4">
            <h1 className="text-heading-lg font-bold text-text-primary">New Workflow</h1>
            <DaisyBadge variant="outline">draft</DaisyBadge>
            <DaisyBadge variant="secondary">v1.0.0</DaisyBadge>
          </div>

          <div className="flex items-center space-x-enterprise-2">
            <DaisyButton variant="outline">Exit</DaisyButton>
            <DaisyButton >
  <Save className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
              Save Workflow
            </DaisyButton>
          </div>
        </div>

        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mt-enterprise-4" />
          <DaisyTabsList />
            <DaisyTabsTrigger value="design">Design</DaisyTabs>
            <DaisyTabsTrigger value="settings">Settings</DaisyTabsTrigger>
            <DaisyTabsTrigger value="testing">Testing</DaisyTabsTrigger>
            <DaisyTabsTrigger value="analytics">Analytics</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        <DaisyTabsContent value="design" className="flex-1 flex m-0" />
          <div className="text-center py-enterprise-12 w-full">
            <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-4" />
            <h3 className="text-heading-base font-semibold text-text-primary mb-enterprise-2">
              Workflow Designer
            </h3>
            <p className="text-body-base text-text-secondary">
              Visual workflow designer coming soon.
            </p>
          </div>
        </DaisyTabsContent>
      </div>
    </div>
  );
};

export default WorkflowDesigner; 