'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
// import { ContentCard } from '@/components/layout/MainContentArea'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCalendar } from '@/components/ui/DaisyCalendar';
import { DaisyPopover, DaisyPopoverContent, DaisyPopoverTrigger } from '@/components/ui/DaisyPopover';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyTabsTrigger, DaisyDialogTitle } from '@/components/ui/daisy-components';
// import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Download,
  Plus,
  Save,
  Send,
  Activity,
  Users,
  Target,
  Clipboard,
  BarChart3,
  MessageSquare,
} from 'lucide-react'
// import { format } from 'date-fns'

// Types
interface TestingWorkflow {
  id: string
  controlId: string;
  controlTitle: string;
  testingType: 'design' | 'operating' | 'combined';
  status: 'scheduled' | 'in-progress' | 'review' | 'completed' | 'overdue';
  tester: {
    name: string;
    email: string;
  }
  reviewer?: {
    name: string;
    email: string;
  }
  scheduledDate: Date;
  actualStartDate?: Date;
  completedDate?: Date;
  dueDate: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  testingProcedure: string;
  expectedResult: string;
  actualResult?: string;
  effectiveness?: number; // 0-100
  result?: 'passed' | 'failed' | 'partial' | 'not-applicable';
  findings?: string;
  recommendations?: string;
  evidence: EvidenceFile[];
  progress: number; // 0-100
}

interface EvidenceFile {
  id: string;
  name: string;
  type: 'document' | 'screenshot' | 'video' | 'config' | 'log';
  size: number;
  uploadedDate: Date;
  description?: string;
  url?: string;
  thumbnail?: string;
}

// Sample Testing Workflows
const sampleWorkflows: TestingWorkflow[] = [
  {
    id: 'TW-001',
    controlId: 'CTL-001',
    controlTitle: 'Access Control Management',
    testingType: 'operating',
    status: 'in-progress',
    tester: {
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
    },
    reviewer: {
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@company.com',
    },
    scheduledDate: new Date('2024-01-15'),
    actualStartDate: new Date('2024-01-15'),
    dueDate: new Date('2024-01-25'),
    priority: 'critical',
    testingProcedure: 'Review access provisioning and deprovisioning processes. Test user access requests and approvals.',
    expectedResult: 'All access requests properly approved and documented. No unauthorized access granted.',
    evidence: [
      {
        id: 'EV-001',
        name: 'access_request_logs.xlsx',
        type: 'document',
        size: 2457600,
        uploadedDate: new Date('2024-01-16'),
        description: 'Access request logs for Q4 2023',
      },
      {
        id: 'EV-002',
        name: 'approval_workflow_screenshot.png',
        type: 'screenshot',
        size: 1024000,
        uploadedDate: new Date('2024-01-16'),
        description: 'Screenshot of approval workflow interface',
      },
    ],
    progress: 65,
  },
  {
    id: 'TW-002',
    controlId: 'CTL-002',
    controlTitle: 'Data Encryption Standards',
    testingType: 'design',
    status: 'scheduled',
    tester: {
      name: 'Emma Johnson',
      email: 'emma.johnson@company.com',
    },
    scheduledDate: new Date('2024-02-01'),
    dueDate: new Date('2024-02-10'),
    priority: 'high',
    testingProcedure: 'Review encryption policies and implementation. Test encryption strength and key management.',
    expectedResult: 'All data encrypted using approved algorithms. Key management follows established procedures.',
    evidence: [],
    progress: 0,
  },
]

// Evidence Type Configuration
const getEvidenceTypeConfig = (_type: string) => {
  const configs = {
    'document': { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    'screenshot': { icon: Image, color: 'text-green-600', bg: 'bg-green-50' },
    'video': { icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
    'config': { icon: File, color: 'text-orange-600', bg: 'bg-orange-50' },
    'log': { icon: Clipboard, color: 'text-gray-600', bg: 'bg-gray-50' },
  }
  return configs[type as keyof typeof configs] || configs.document;
}

// Status Configuration
const getWorkflowStatusConfig = (status: string) => {
  const configs = {
    'scheduled': { variant: 'secondary' as const, color: 'text-text-secondary' },
    'in-progress': { variant: 'default' as const, color: 'text-interactive-primary' },
    'review': { variant: 'outline' as const, color: 'text-semantic-warning' },
    'completed': { variant: 'default' as const, color: 'text-semantic-success' },
    'overdue': { variant: 'destructive' as const, color: 'text-semantic-error' },
  }
  return configs[status as keyof typeof configs] || configs.scheduled;
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Evidence Upload Component
const EvidenceUpload: React.FC<{
  workflow: TestingWorkflow
  onEvidenceUpload: (files: File[]) => void;
}> = ({ workflow, onEvidenceUpload }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onEvidenceUpload(Array.from(e.dataTransfer.files));
    }
  }, [onEvidenceUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onEvidenceUpload(Array.from(e.target.files));
    }
  }, [onEvidenceUpload]);

  return (
    <div className="space-y-enterprise-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-enterprise-6 text-center transition-colors cursor-pointer",
          dragActive ? "border-interactive-primary bg-interactive-primary/5" : "border-border hover:border-interactive-primary"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('evidence-upload')?.click()}
      >
        <Upload className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
        <h3 className="text-body-sm font-medium text-text-primary mb-enterprise-1">
          Upload Evidence Files
        </h3>
        <p className="text-caption text-text-secondary mb-enterprise-3">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-caption text-text-tertiary">
          Supports: PDF, DOC, XLS, PNG, JPG, MP4 (Max 10MB)
        </p>
        <input
          id="evidence-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.mov" />
      </div>

      {/* Evidence List */}
      {workflow.evidence.length > 0 && (
        <div className="space-y-enterprise-2">
          <h4 className="text-body-sm font-medium text-text-primary">Uploaded Evidence</h4>
          <div className="space-y-enterprise-2">
            {workflow.evidence.map((evidence) => {
              const typeConfig = getEvidenceTypeConfig(evidence.type);
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={evidence.id}
                  className="flex items-center space-x-enterprise-3 p-enterprise-3 border border-border rounded-lg"
                >
                  <div className={cn("p-enterprise-2 rounded", typeConfig.bg)}>
                    <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-enterprise-2">
                      <span className="text-body-sm font-medium text-text-primary truncate">
                        {evidence.name}
                      </span>
                      <DaisyBadge variant="outline" className="text-caption" >
  {evidence.type}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    <div className="flex items-center space-x-enterprise-2 text-caption text-text-secondary">
                      <span>{formatFileSize(evidence.size)}</span>
                      <span>•</span>
                      <span>Uploaded {evidence.uploadedDate.toLocaleDateString()}</span>
                    </div>
                    {evidence.description && (
                      <p className="text-caption text-text-secondary mt-enterprise-1">
                        {evidence.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-enterprise-1">
                    <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <Eye className="h-3 w-3" />
</DaisyButton>
                    </DaisyButton>
                    <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <Download className="h-3 w-3" />
</DaisyButton>
                    </DaisyButton>
                    <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0 text-semantic-error" >
  <X className="h-3 w-3" />
</DaisyButton>
                    </DaisyButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Testing Form Component
const TestingForm: React.FC<{
  workflow: TestingWorkflow
  onSave: (_data: Partial<TestingWorkflow>) => void;
  onSubmit: (_data: Partial<TestingWorkflow>) => void;
}> = ({ workflow, onSave, onSubmit }) => {
  const [formData, setFormData] = useState({
    actualResult: workflow.actualResult || '',
    findings: workflow.findings || '',
    recommendations: workflow.recommendations || '',
    effectiveness: workflow.effectiveness || 0,
    result: workflow.result || 'passed',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleSave = () => {
    onSave(formData);
  }

  const handleSubmit = () => {
    onSubmit({ ...formData, status: 'review', completedDate: new Date() });
  }

  return (
    <div className="space-y-enterprise-6">
      {/* Testing Procedure */}
      <div>
        <h4 className="text-body-sm font-medium text-text-primary mb-enterprise-2">
          Testing Procedure
        </h4>
        <div className="p-enterprise-3 bg-surface-secondary rounded-lg">
          <p className="text-body-sm text-text-secondary">{workflow.testingProcedure}</p>
        </div>
      </div>

      {/* Expected Result */}
      <div>
        <h4 className="text-body-sm font-medium text-text-primary mb-enterprise-2">
          Expected Result
        </h4>
        <div className="p-enterprise-3 bg-surface-secondary rounded-lg">
          <p className="text-body-sm text-text-secondary">{workflow.expectedResult}</p>
        </div>
      </div>

      {/* Actual Result */}
      <div>
        <label className="text-body-sm font-medium text-text-primary">
          Actual Result *
        </label>
        <DaisyTextarea
          value={formData.actualResult}
          onChange={(e) = />
handleInputChange('actualResult', e.target.value)}
          placeholder="Describe the actual testing results..."
          className="mt-enterprise-1"
          rows={4} />
      </div>

      {/* Test Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-enterprise-4">
        <div>
          <label className="text-body-sm font-medium text-text-primary">
            Test Result *
          </label>
          <DaisySelect 
            value={formData.result} 
            onValueChange={(value) => handleInputChange('result', value)} />
            <DaisySelectTrigger className="mt-enterprise-1">
                <DaisySelectValue />
</DaisyTextarea>
            <DaisySelectContent >
                <DaisySelectItem value="passed" >
                  <div className="flex items-center space-x-enterprise-2">
                  <CheckCircle className="h-3 w-3 text-semantic-success" />
                  <span>Passed</span>
                </div>
              </DaisySelectContent>
              <DaisySelectItem value="failed" >
                  <div className="flex items-center space-x-enterprise-2">
                  <X className="h-3 w-3 text-semantic-error" />
                  <span>Failed</span>
                </div>
              </DaisySelectItem>
              <DaisySelectItem value="partial" >
                  <div className="flex items-center space-x-enterprise-2">
                  <DaisyAlertTriangle className="h-3 w-3 text-semantic-warning" >
  <span>
</DaisySelectItem>Partially Effective</span>
                </div>
              </DaisySelectItem>
              <DaisySelectItem value="not-applicable" >
                  <div className="flex items-center space-x-enterprise-2">
                  <Clock className="h-3 w-3 text-text-tertiary" />
                  <span>Not Applicable</span>
                </div>
              </DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
        </div>

        <div>
          <label className="text-body-sm font-medium text-text-primary">
            Effectiveness Score (0-100)
          </label>
          <DaisyInput
            type="number"
            min="0"
            max="100"
            value={formData.effectiveness}
            onChange={(e) = />
handleInputChange('effectiveness', parseInt(e.target.value) || 0)}
            className="mt-enterprise-1" />
        </div>
      </div>

      {/* Effectiveness Visual */}
      <div>
        <div className="flex items-center justify-between mb-enterprise-1">
          <span className="text-caption text-text-secondary">Control Effectiveness</span>
          <span className="text-caption font-medium text-text-primary">{formData.effectiveness}%</span>
        </div>
        <DaisyProgress value={formData.effectiveness} className="h-2" />
</div>

      {/* Findings */}
      <div>
        <label className="text-body-sm font-medium text-text-primary">
          Findings & Observations
        </label>
        <DaisyTextarea
          value={formData.findings}
          onChange={(e) = />
handleInputChange('findings', e.target.value)}
          placeholder="Document any findings, issues, or observations..."
          className="mt-enterprise-1"
          rows={3} />
      </div>

      {/* Recommendations */}
      <div>
        <label className="text-body-sm font-medium text-text-primary">
          Recommendations
        </label>
        <DaisyTextarea
          value={formData.recommendations}
          onChange={(e) = />
handleInputChange('recommendations', e.target.value)}
          placeholder="Provide recommendations for improvement..."
          className="mt-enterprise-1"
          rows={3} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-enterprise-4 border-t border-border">
        <div className="flex items-center space-x-enterprise-2">
          <DaisyButton variant="outline" onClick={handleSave} >
  <Save className="h-3 w-3 mr-enterprise-1" />
</DaisyInput>
            Save Draft
          </DaisyButton>
        </div>
        <div className="flex items-center space-x-enterprise-2">
          <DaisyButton onClick={handleSubmit} >
  <Send className="h-3 w-3 mr-enterprise-1" />
</DaisyButton>
            Submit for Review
          </DaisyButton>
        </div>
      </div>
    </div>
  );
}

// Workflow Card Component
const WorkflowCard: React.FC<{
  workflow: TestingWorkflow
  onAction: (_action: string, workflow: TestingWorkflow) => void;
}> = ({ workflow, onAction }) => {
  const statusConfig = getWorkflowStatusConfig(workflow.status);
  const isOverdue = workflow.dueDate < new Date() && workflow.status !== 'completed';
  const daysUntilDue = Math.ceil((workflow.dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  return (
    <div className="p-enterprise-4 border border-border rounded-lg hover:shadow-notion-sm transition-all duration-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-3">
        <div className="flex-1">
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
            <span className="text-caption font-medium text-text-tertiary">{workflow.id}</span>
            <DaisyBadge variant={statusConfig.variant} className="text-caption" >
  {workflow.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
</DaisyBadge>
            </DaisyBadge>
            <DaisyBadge variant="outline" className="text-caption" >
  {workflow.testingType}
</DaisyBadge>
            </DaisyBadge>
          </div>
          <h3 className="text-body-base font-semibold text-text-primary mb-enterprise-1">
            {workflow.controlTitle}
          </h3>
          <p className="text-caption text-text-secondary">
            Control ID: {workflow.controlId}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-enterprise-3">
        <div className="flex items-center justify-between mb-enterprise-1">
          <span className="text-caption text-text-secondary">Progress</span>
          <span className="text-caption font-medium text-text-primary">{workflow.progress}%</span>
        </div>
        <DaisyProgress value={workflow.progress} className="h-2" />
</div>

      {/* Metadata */}
      <div className="space-y-enterprise-2">
        {/* Tester & Reviewer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <Users className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">{workflow.tester.name}</span>
          </div>
          {workflow.reviewer && (
            <span className="text-caption text-text-secondary">
              Reviewer: {workflow.reviewer.name}
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <DaisyCalendarIcon className={cn(
              "h-3 w-3",
              isOverdue ? "text-semantic-error" : "text-text-tertiary"
            )} />
<span className={cn(
              "text-caption",
              isOverdue ? "text-semantic-error font-medium" : "text-text-secondary"
            )}>
              Due: {workflow.dueDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-enterprise-1">
            <Activity className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">
              {workflow.evidence.length} evidence files
            </span>
          </div>
        </div>

        {/* Priority & Status Info */}
        <div className="flex items-center justify-between text-caption text-text-tertiary">
          <span>Priority: {workflow.priority}</span>
          {daysUntilDue > 0 && !isOverdue && (
            <span>{daysUntilDue} days remaining</span>
          )}
          {Boolean(isOverdue) && (
            <span className="text-semantic-error font-medium">
              {Math.abs(daysUntilDue)} days overdue
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-enterprise-3 pt-enterprise-3 border-t border-border">
        <div className="flex items-center space-x-enterprise-1">
          <DaisyButton 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('view', workflow)} />
            <Eye className="h-3 w-3 mr-enterprise-1" />
            View
          </DaisyProgress>
          {workflow.status === 'in-progress' && (
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              className="h-6 px-enterprise-2"
              onClick={() => onAction('test', workflow)} />
              <Activity className="h-3 w-3 mr-enterprise-1" />
              Continue
            </DaisyButton>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Control Testing Workflow Component
export const ControlTestingWorkflow: React.FC = () => {
  const [workflows] = useState<TestingWorkflow[]>(sampleWorkflows)
  const [selectedWorkflow, setSelectedWorkflow] = useState<TestingWorkflow | null>(null);
  const [testingDialogOpen, setTestingDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredWorkflows = workflows.filter(workflow => 
    filterStatus === 'all' || workflow.status === filterStatus
  );

  const handleWorkflowAction = (_action: string, workflow: TestingWorkflow) => {
    if (action === 'test' || action === 'view') {
      setSelectedWorkflow(workflow);
      setTestingDialogOpen(true);
    }
  }

  const handleEvidenceUpload = (files: File[]) => {
    // console.log('Uploading evidence files:', files)
  }

  const handleTestingSave = (_data: Partial<TestingWorkflow>) => {
    // console.log('Saving testing data:', data)
  }

  const handleTestingSubmit = (_data: Partial<TestingWorkflow>) => {
    // console.log('Submitting testing data:', data)
    setTestingDialogOpen(false);
  }

  const statuses = [...new Set(workflows.map(w => w.status))];

  return (
    <div className="space-y-enterprise-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">Control Testing</h2>
          <p className="text-body-sm text-text-secondary">
            Manage testing workflows and document results
          </p>
        </div>
        <DaisyButton >
  <Plus className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
          Schedule Test
        </DaisyButton>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-enterprise-3">
        <DaisySelect value={filterStatus} onValueChange={setFilterStatus} >
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

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
        {filteredWorkflows.map((workflow) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onAction={handleWorkflowAction} />
        ))}
      </div>

      {/* Testing Dialog */}
      {Boolean(selectedWorkflow) && (
        <DaisyDialog open={testingDialogOpen} onOpenChange={setTestingDialogOpen} >
            <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" >
  <DaisyDialogHeader>
</DaisyDialog>
              <DaisyDialogTitle >
  Testing: {selectedWorkflow.controlTitle}
</DaisyDialogTitle>
              </DaisyDialogTitle>
            </DaisyDialogHeader>
            
            <DaisyTabs defaultValue="testing" className="mt-enterprise-4" >
                <DaisyTabsList >
                  <DaisyTabsTrigger value="testing">Testing Form</DaisyTabs>
                <DaisyTabsTrigger value="evidence">Evidence</DaisyTabsTrigger>
                <DaisyTabsTrigger value="history">History</DaisyTabsTrigger>
              </DaisyTabsList>
              
              <DaisyTabsContent value="testing" className="mt-enterprise-4" >
                  <TestingForm
                  workflow={selectedWorkflow}
                  onSave={handleTestingSave}
                  onSubmit={handleTestingSubmit} />
              </DaisyTabsContent>
              
              <DaisyTabsContent value="evidence" className="mt-enterprise-4" >
                  <EvidenceUpload
                  workflow={selectedWorkflow}
                  onEvidenceUpload={handleEvidenceUpload} />
              </DaisyTabsContent>
              
              <DaisyTabsContent value="history" className="mt-enterprise-4" >
                  <div className="text-center py-enterprise-8">
                  <BarChart3 className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
                  <p className="text-body-sm text-text-secondary">
                    Testing history and audit trail
                  </p>
                </div>
              </DaisyTabsContent>
            </DaisyTabs>
          </DaisyDialogContent>
        </DaisyDialog>
      )}
    </div>
  );
}

export default ControlTestingWorkflow;
