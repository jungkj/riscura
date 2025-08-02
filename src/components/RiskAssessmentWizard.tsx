'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/hooks/use-toast';

// UI Components
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  Zap,
  Target,
  Shield,
  Users,
  Calendar,
  BarChart3,
  FileImage,
  Plus,
  Trash2
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

interface AssessmentFile {
  file: File;
  id: string;
  type: 'excel-rcsa' | 'policy-document' | 'evidence' | 'framework';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  results?: any;
  error?: string;
}

interface AssessmentConfig {
  name: string;
  description: string;
  scope: string;
  department: string;
  assessmentType: 'self' | 'third-party' | 'regulatory';
  dueDate: string;
  stakeholders: string[];
  riskCategories: string[];
  complianceFrameworks: string[];
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'setup',
    title: 'Assessment Setup',
    description: 'Configure your risk assessment parameters',
    icon: Target,
    completed: false
  },
  {
    id: 'documents',
    title: 'Document Upload',
    description: 'Upload RCSA templates, policies, and evidence',
    icon: Upload,
    completed: false
  },
  {
    id: 'analysis',
    title: 'AI Analysis',
    description: 'AI-powered risk and control extraction',
    icon: Brain,
    completed: false
  },
  {
    id: 'review',
    title: 'Review & Finalize',
    description: 'Review results and complete assessment',
    icon: CheckCircle,
    completed: false
  }
];

const RISK_CATEGORIES = [
  'Operational',
  'Financial',
  'Strategic',
  'Compliance',
  'Technology',
  'Reputational',
  'Environmental'
];

const COMPLIANCE_FRAMEWORKS = [
  'SOC 2',
  'ISO 27001',
  'NIST',
  'GDPR',
  'HIPAA',
  'PCI DSS',
  'SOX',
  'COSO'
];

interface RiskAssessmentWizardProps {
  organizationId: string;
  userId: string;
  onComplete?: (assessment: any) => void;
}

export default function RiskAssessmentWizard({
  organizationId,
  userId,
  onComplete
}: RiskAssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(WIZARD_STEPS);
  const [files, setFiles] = useState<AssessmentFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<AssessmentConfig>({
    name: '',
    description: '',
    scope: '',
    department: '',
    assessmentType: 'self',
    dueDate: '',
    stakeholders: [],
    riskCategories: [],
    complianceFrameworks: []
  });

  const [newStakeholder, setNewStakeholder] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        title: "Some files were rejected",
        description: "Please check file types and sizes",
        variant: "destructive"
      });
    }

    const newFiles: AssessmentFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      type: detectFileType(file),
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'text/plain': [],
      'image/png': [],
      'image/jpeg': []
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    multiple: true,
    disabled: isProcessing
  });

  const detectFileType = (file: File): AssessmentFile['type'] => {
    const name = file.name.toLowerCase();
    const type = file.type;

    if (type.includes('spreadsheet') || type.includes('excel') || name.includes('rcsa')) {
      return 'excel-rcsa';
    }
    if (type.includes('pdf') || type.includes('word') || type.includes('document')) {
      return 'policy-document';
    }
    if (type.includes('image')) {
      return 'evidence';
    }
    return 'framework';
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addStakeholder = () => {
    if (newStakeholder.trim()) {
      setConfig(prev => ({
        ...prev,
        stakeholders: [...prev.stakeholders, newStakeholder.trim()]
      }));
      setNewStakeholder('');
    }
  };

  const removeStakeholder = (index: number) => {
    setConfig(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index)
    }));
  };

  const toggleRiskCategory = (category: string) => {
    setConfig(prev => ({
      ...prev,
      riskCategories: prev.riskCategories.includes(category)
        ? prev.riskCategories.filter(c => c !== category)
        : [...prev.riskCategories, category]
    }));
  };

  const toggleComplianceFramework = (framework: string) => {
    setConfig(prev => ({
      ...prev,
      complianceFrameworks: prev.complianceFrameworks.includes(framework)
        ? prev.complianceFrameworks.filter(f => f !== framework)
        : [...prev.complianceFrameworks, framework]
    }));
  };

  const processFiles = async () => {
    setIsProcessing(true);
    
    try {
      const results = [];

      for (const fileObj of files) {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'processing', progress: 10 }
            : f
        ));

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('mode', fileObj.type === 'excel-rcsa' ? 'excel-rcsa' : 'policy-document');
        formData.append('organizationId', organizationId);
        formData.append('userId', userId);
        formData.append('options', JSON.stringify({
          aiAnalysis: true,
          autoMap: true,
          validateData: true,
          createMissing: false,
          previewMode: true
        }));

        try {
          const response = await fetch('/api/import/process', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Processing failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100,
                  results: result.data
                }
              : f
          ));

          results.push(result.data);

        } catch (error) {
          console.error(`Error processing ${fileObj.file.name}:`, error);
          
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { 
                  ...f, 
                  status: 'error', 
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Processing failed'
                }
              : f
          ));
        }
      }

      setAnalysisResults({
        totalFiles: files.length,
        processedFiles: results.length,
        totalRisks: results.reduce((sum, r) => sum + (r.data?.risks?.length || 0), 0),
        totalControls: results.reduce((sum, r) => sum + (r.data?.controls?.length || 0), 0),
        results
      });

      // Mark analysis step as completed
      setSteps(prev => prev.map(step => 
        step.id === 'analysis' ? { ...step, completed: true } : step
      ));

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error processing your files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      setSteps(prev => prev.map((step, idx) => 
        idx === currentStep ? { ...step, completed: true } : step
      ));
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeAssessment = async () => {
    const assessment = {
      config,
      files: files.map(f => ({
        name: f.file.name,
        type: f.type,
        status: f.status,
        results: f.results
      })),
      analysisResults,
      createdAt: new Date(),
      organizationId,
      userId
    };

    if (onComplete) {
      onComplete(assessment);
    }

    toast({
      title: "Assessment Complete",
      description: "Your risk assessment has been successfully created",
    });
  };

  const getFileIcon = (type: AssessmentFile['type']) => {
    switch (type) {
      case 'excel-rcsa': return FileSpreadsheet;
      case 'policy-document': return FileText;
      case 'evidence': return FileImage;
      case 'framework': return Shield;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'setup':

  return (
    <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <DaisyLabel htmlFor="name">Assessment Name *</DaisyLabel>
                  <DaisyInput
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Q4 2024 Risk Assessment"
                  />
                </div>
                <div>
                  <DaisyLabel htmlFor="scope">Scope</DaisyInput>
                  <DaisyInput
                    id="scope"
                    value={config.scope}
                    onChange={(e) => setConfig(prev => ({ ...prev, scope: e.target.value }))}
                    placeholder="Enterprise-wide, Department-specific, etc."
                  />
                </div>
                <div>
                  <DaisyLabel htmlFor="department">Department</DaisyInput>
                  <DaisyInput
                    id="department"
                    value={config.department}
                    onChange={(e) => setConfig(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="IT, Finance, Operations, etc."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <DaisyLabel htmlFor="description">Description</DaisyInput>
                  <DaisyTextarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose and objectives of this assessment..."
                    rows={3}
                  />
                </div>
                <div>
                  <DaisyLabel htmlFor="assessmentType">Assessment Type</DaisyTextarea>
                  <DaisySelect
                    value={config.assessmentType}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, assessmentType: value }))}
                  >
                    <DaisySelectTrigger />
                      <DaisySelectValue /></DaisySelect>
                    <DaisySelectContent />
                      <DaisySelectItem value="self">Self Assessment</DaisySelectContent>
                      <DaisySelectItem value="third-party">Third Party Assessment</DaisySelectItem>
                      <DaisySelectItem value="regulatory">Regulatory Assessment</DaisySelectItem>
                    </DaisySelectContent>
                  </DaisySelect>
                </div>
                <div>
                  <DaisyLabel htmlFor="dueDate">Due Date</DaisyLabel>
                  <DaisyInput
                    id="dueDate"
                    type="date"
                    value={config.dueDate}
                    onChange={(e) => setConfig(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <DaisySeparator />

            <div className="space-y-4">
              <div>
                <DaisyLabel>Stakeholders</DaisyInput>
                <div className="flex gap-2 mt-2">
                  <DaisyInput
                    value={newStakeholder}
                    onChange={(e) => setNewStakeholder(e.target.value)}
                    placeholder="Add stakeholder email"
                    onKeyPress={(e) => e.key === 'Enter' && addStakeholder()}
                  />
                  <DaisyButton onClick={addStakeholder} size="sm" >
  <Plus className="h-4 w-4" />
</DaisyInput>
                  </DaisyButton>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.stakeholders.map((stakeholder, idx) => (
                    <DaisyBadge key={idx} variant="secondary" className="flex items-center gap-1" >
  {stakeholder}
</DaisyBadge>
                      <button onClick={() => removeStakeholder(idx)}>
                        <X className="h-3 w-3" />
                      </button>
                    </DaisyBadge>
                  ))}
                </div>
              </div>

              <div>
                <DaisyLabel>Risk Categories</DaisyLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {RISK_CATEGORIES.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <DaisyCheckbox
                        id={`risk-${category}`}
                        checked={config.riskCategories.includes(category)}
                        onCheckedChange={() => toggleRiskCategory(category)}
                      />
                      <DaisyLabel htmlFor={`risk-${category}`} className="text-sm">
                        {category}
                      </DaisyCheckbox>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <DaisyLabel>Compliance Frameworks</DaisyLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {COMPLIANCE_FRAMEWORKS.map(framework => (
                    <div key={framework} className="flex items-center space-x-2">
                      <DaisyCheckbox
                        id={`framework-${framework}`}
                        checked={config.complianceFrameworks.includes(framework)}
                        onCheckedChange={() => toggleComplianceFramework(framework)}
                      />
                      <DaisyLabel htmlFor={`framework-${framework}`} className="text-sm">
                        {framework}
                      </DaisyCheckbox>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <input {...getInputProps()} />
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isDragActive ? 1.05 : 1 }}
                className="space-y-4"
              >
                <Upload className={`h-12 w-12 mx-auto ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isDragActive 
                      ? 'Drop your assessment files here' 
                      : 'Drag & drop assessment files here'
                    }
                  </h3>
                  <p className="text-gray-600 mt-1">
                    or click to browse (Excel RCSA templates, policy documents, evidence files)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported: Excel, PDF, Word, Text, Images (max 25MB per file)
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Uploaded Files ({files.length})</h3>
                {files.map((fileObj) => {
                  const FileIcon = getFileIcon(fileObj.type);
                  return (
                    <motion.div
                      key={fileObj.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <FileIcon className="h-8 w-8 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {fileObj.file.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatFileSize(fileObj.file.size)}</span>
                          <DaisyBadge variant="outline" className="text-xs" >
  {fileObj.type.replace('-', ' ')}
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                        {fileObj.status === 'processing' && (
                          <DaisyProgress value={fileObj.progress} className="mt-2" />
                        )}
                        {fileObj.error && (
                          <p className="text-sm text-red-600 mt-1">{fileObj.error}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileObj.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {fileObj.status === 'error' && (
                          <DaisyAlertCircle className="h-5 w-5 text-red-600" >
  )}
</DaisyProgress>
                        {fileObj.status === 'processing' && (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        )}
                        <DaisyButton
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileObj.id)}
                          disabled={isProcessing} />
                          <Trash2 className="h-4 w-4" />
                        </DaisyButton>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            {!analysisResults ? (
              <div className="text-center space-y-4">
                <Brain className="h-16 w-16 mx-auto text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">AI Analysis Ready</h3>
                  <p className="text-gray-600 mt-2">
                    Click the button below to start AI-powered analysis of your uploaded files.
                    This will extract risks, controls, and generate insights.
                  </p>
                </div>
                <DaisyButton
                  onClick={processFiles}
                  disabled={files.length === 0 || isProcessing}
                  size="lg"
                  className="mt-4" >
  {isProcessing ? (
</DaisyButton>
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing Files...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Start AI Analysis
                    </>
                  )}
                </DaisyButton>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mt-4">Analysis Complete</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DaisyCard >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-blue-600">{analysisResults.totalFiles}</div>
                      <div className="text-sm text-gray-600">Files Processed</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-red-600">{analysisResults.totalRisks}</div>
                      <div className="text-sm text-gray-600">Risks Identified</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-green-600">{analysisResults.totalControls}</div>
                      <div className="text-sm text-gray-600">Controls Found</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((analysisResults.processedFiles / analysisResults.totalFiles) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </DaisyCardBody>
                  </DaisyCard>
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Target className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Assessment Summary</h3>
                <p className="text-gray-600 mt-2">
                  Review your assessment configuration and results before finalizing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle>Assessment Details</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-2" >
  <div>
</DaisyCardBody><strong>Name:</strong> {config.name}</div>
                  <div><strong>Type:</strong> {config.assessmentType}</div>
                  <div><strong>Department:</strong> {config.department}</div>
                  <div><strong>Due Date:</strong> {config.dueDate}</div>
                  <div><strong>Stakeholders:</strong> {config.stakeholders.length}</div>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle>Analysis Results</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-2" >
  {analysisResults ? (
</DaisyCardBody>
                    <>
                      <div><strong>Files Processed:</strong> {analysisResults.totalFiles}</div>
                      <div><strong>Risks Identified:</strong> {analysisResults.totalRisks}</div>
                      <div><strong>Controls Found:</strong> {analysisResults.totalControls}</div>
                      <div><strong>Success Rate:</strong> {Math.round((analysisResults.processedFiles / analysisResults.totalFiles) * 100)}%</div>
                    </>
                  ) : (
                    <div className="text-gray-500">No analysis results available</div>
                  )}
                </DaisyCardBody>
              </DaisyCard>
            </div>

            <div className="text-center">
              <DaisyButton onClick={completeAssessment} size="lg" className="mt-4" >
  <CheckCircle className="h-5 w-5 mr-2" />
</DaisyButton>
                Complete Assessment
              </DaisyButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const IconComponent = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = step.completed;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors duration-200
                ${isActive 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <IconComponent className="h-6 w-6" />
                )}
              </div>
              <div className="ml-3">
                <div className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className="text-sm text-gray-500">{step.description}</div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  {(() => {
</DaisyCardTitle>
              const IconComponent = steps[currentStep].icon;
              return <IconComponent className="h-6 w-6 text-blue-600" />;
            })()}
            {steps[currentStep].title}
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <AnimatePresence mode="wait">
</DaisyCardBody>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </DaisyCardBody>
      </DaisyCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <DaisyButton
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0} >
  <ArrowLeft className="h-4 w-4 mr-2" />
</DaisyButton>
          Previous
        </DaisyButton>
        
        {currentStep < steps.length - 1 ? (
          <DaisyButton
            onClick={nextStep}
            disabled={
              (currentStep === 0 && !config.name) ||
              (currentStep === 1 && files.length === 0) ||
              (currentStep === 2 && !analysisResults)
            } >
  Next
</DaisyButton>
            <ArrowRight className="h-4 w-4 ml-2" />
          </DaisyButton>
        ) : null}
      </div>
    </div>
  );
} 