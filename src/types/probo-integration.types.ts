// Probo Integration Types
// Based on https://github.com/getprobo/probo

export interface ProboControl {
  id: string;
  title: string;
  description: string;
  category: ProboControlCategory;
  framework: ComplianceFramework;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  implementationComplexity: 'Simple' | 'Moderate' | 'Complex';
  estimatedHours: number;
  status: ProboControlStatus;
  evidenceRequirements: EvidenceRequirement[];
  automationPotential: 'Full' | 'Partial' | 'Manual';
  riskMitigationScore: number; // 1-10
  complianceMapping: ComplianceMapping[];
  dependencies: string[]; // Other control IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiGenerated: boolean;
  aiConfidence: number; // 0-1
}

export interface ProboControlCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ComplianceFramework {
  id: string;
  name: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'Custom';
  version: string;
  requirements: FrameworkRequirement[];
}

export interface FrameworkRequirement {
  id: string;
  code: string; // e.g., "CC6.1", "A.5.1.1"
  title: string;
  description: string;
  mandatory: boolean;
}

export interface ProboControlStatus {
  current: 'Not Started' | 'In Progress' | 'Implemented' | 'Tested' | 'Approved' | 'Needs Review';
  progress: number; // 0-100
  lastUpdated: string;
  assignee?: string;
  dueDate?: string;
}

export interface EvidenceRequirement {
  id: string;
  type: 'Document' | 'Screenshot' | 'Log' | 'Certificate' | 'Policy' | 'Procedure';
  title: string;
  description: string;
  mandatory: boolean;
  template?: string;
  automationAvailable: boolean;
}

export interface ComplianceMapping {
  framework: ComplianceFramework;
  requirements: string[]; // Framework requirement IDs
  coverage: 'Full' | 'Partial' | 'Supporting';
}

export interface RiskControlMapping {
  id: string;
  riskId: string;
  controlId: string;
  mappingType: 'Preventive' | 'Detective' | 'Corrective' | 'Compensating';
  effectiveness: 'High' | 'Medium' | 'Low';
  coverage: number; // 0-100% how much of the risk this control addresses
  aiGenerated: boolean;
  aiConfidence: number;
  rationale: string;
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface ProboAIAnalysis {
  riskId: string;
  analysisType: 'Risk Assessment' | 'Control Recommendation' | 'Gap Analysis' | 'Optimization';
  recommendations: AIRecommendation[];
  confidence: number;
  reasoning: string;
  generatedAt: string;
  dataPoints: string[];
  limitations: string[];
}

export interface AIRecommendation {
  type: 'New Control' | 'Modify Control' | 'Remove Control' | 'Merge Controls';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  rationale: string;
  estimatedImpact: number; // 1-10
  implementationEffort: number; // 1-10
  suggestedControl?: Partial<ProboControl>;
  existingControlId?: string;
  modifications?: ControlModification[];
}

export interface ControlModification {
  field: keyof ProboControl;
  currentValue: any;
  suggestedValue: any;
  reason: string;
}

export interface ProboIntegrationConfig {
  apiEndpoint: string;
  apiKey: string;
  organizationId: string;
  enableAI: boolean;
  autoApplyRecommendations: boolean;
  confidenceThreshold: number; // 0-1
  frameworks: ComplianceFramework[];
  customCategories: ProboControlCategory[];
}

export interface ControlGenerationRequest {
  riskId: string;
  riskTitle: string;
  riskDescription: string;
  riskCategory: string;
  riskSeverity: 'Critical' | 'High' | 'Medium' | 'Low';
  organizationContext: OrganizationContext;
  preferredFrameworks: string[];
  constraints: GenerationConstraints;
}

export interface OrganizationContext {
  industry: string;
  size: 'Startup' | 'Small' | 'Medium' | 'Large' | 'Enterprise';
  techStack: string[];
  existingControls: string[];
  complianceGoals: string[];
  riskTolerance: 'Low' | 'Medium' | 'High';
  budget: 'Limited' | 'Moderate' | 'Flexible';
  timeline: 'Urgent' | 'Standard' | 'Flexible';
}

export interface GenerationConstraints {
  maxImplementationHours: number;
  allowedComplexity: ('Simple' | 'Moderate' | 'Complex')[];
  requiredAutomation: boolean;
  budgetLimit?: number;
  mustHaveFrameworks: string[];
  excludeCategories: string[];
}

export interface ControlGenerationResponse {
  success: boolean;
  controls: ProboControl[];
  mappings: RiskControlMapping[];
  analysis: ProboAIAnalysis;
  alternatives: ProboControl[];
  estimatedTimeToImplement: number;
  estimatedCost?: number;
  implementationPlan: ImplementationStep[];
}

export interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  dependencies: string[];
  assigneeRole: string;
  priority: number;
  automationAvailable: boolean;
  evidenceGenerated: string[];
}

export interface ProboControlLibrary {
  categories: ProboControlCategory[];
  controls: ProboControl[];
  templates: ControlTemplate[];
  frameworks: ComplianceFramework[];
  lastUpdated: string;
  version: string;
}

export interface ControlTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  template: Partial<ProboControl>;
  variables: TemplateVariable[];
  usageCount: number;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: string;
}

export interface ProboIntegrationStatus {
  connected: boolean;
  lastSync: string;
  version: string;
  features: {
    aiGeneration: boolean;
    automatedMapping: boolean;
    realTimeSync: boolean;
    bulkOperations: boolean;
  };
  usage: {
    controlsGenerated: number;
    mappingsCreated: number;
    aiAnalysesRun: number;
    lastActivity: string;
  };
  health: 'Healthy' | 'Warning' | 'Error';
  errors: string[];
}

// Event Types for Real-time Updates
export interface ProboEvent {
  type: 'control.generated' | 'mapping.created' | 'analysis.completed' | 'sync.updated';
  timestamp: string;
  data: any;
  source: 'ai' | 'user' | 'automation';
}

// Bulk Operations
export interface BulkControlOperation {
  operation: 'generate' | 'update' | 'delete' | 'map';
  riskIds: string[];
  options: any;
  batchSize: number;
  priority: 'High' | 'Normal' | 'Low';
}

export interface BulkOperationResult {
  operationId: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  progress: number;
  results: any[];
  errors: any[];
  startedAt: string;
  completedAt?: string;
} 