'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Shield,
  FileText,
  Download,
  Play,
  Pause,
  RotateCcw,
  Clock
} from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  description: string;
  totalRequirements: number;
  categories: FrameworkCategory[];
}

interface FrameworkCategory {
  id: string;
  name: string;
  requirements: Requirement[];
}

interface Requirement {
  id: string;
  code: string;
  title: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
  evidence: string[];
  notes: string;
}

const frameworks: Framework[] = [
  {
    id: 'soc2',
    name: 'SOC 2',
    description: 'Service Organization Control 2',
    totalRequirements: 64,
    categories: [
      {
        id: 'security',
        name: 'Security',
        requirements: [
          {
            id: 'cc6.1',
            code: 'CC6.1',
            title: 'Logical and Physical Access Controls',
            description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
            status: 'not-assessed',
            evidence: [],
            notes: ''
          },
          {
            id: 'cc6.2',
            code: 'CC6.2',
            title: 'User Authentication',
            description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.',
            status: 'not-assessed',
            evidence: [],
            notes: ''
          }
        ]
      },
      {
        id: 'availability',
        name: 'Availability',
        requirements: [
          {
            id: 'a1.1',
            code: 'A1.1',
            title: 'System Availability',
            description: 'The entity maintains system availability commitments and requirements.',
            status: 'not-assessed',
            evidence: [],
            notes: ''
          }
        ]
      }
    ]
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information Security Management System',
    totalRequirements: 114,
    categories: [
      {
        id: 'context',
        name: 'Context of the Organization',
        requirements: [
          {
            id: '4.1',
            code: '4.1',
            title: 'Understanding the organization and its context',
            description: 'Determine external and internal issues relevant to the ISMS.',
            status: 'not-assessed',
            evidence: [],
            notes: ''
          }
        ]
      }
    ]
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    totalRequirements: 99,
    categories: [
      {
        id: 'principles',
        name: 'Data Protection Principles',
        requirements: [
          {
            id: 'art5',
            code: 'Article 5',
            title: 'Principles relating to processing',
            description: 'Personal data shall be processed lawfully, fairly and transparently.',
            status: 'not-assessed',
            evidence: [],
            notes: ''
          }
        ]
      }
    ]
  }
];

export default function FrameworkComplianceCheckPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [assessmentInProgress, setAssessmentInProgress] = useState(false);
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [assessmentResults, setAssessmentResults] = useState<any>({});
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (assessmentInProgress) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [assessmentInProgress]);

  const getAllRequirements = (framework: Framework) => {
    return framework.categories.flatMap(cat => cat.requirements);
  };

  const startAssessment = () => {
    if (!selectedFramework) {
      toast({
        title: 'Select a framework',
        description: 'Please select a compliance framework to assess',
        variant: 'destructive',
      });
      return;
    }

    setAssessmentInProgress(true);
    setCurrentRequirementIndex(0);
    setTimeElapsed(0);
  };

  const pauseAssessment = () => {
    setAssessmentInProgress(false);
  };

  const resetAssessment = () => {
    setAssessmentInProgress(false);
    setCurrentRequirementIndex(0);
    setAssessmentResults({});
    setTimeElapsed(0);
  };

  const markRequirement = (status: Requirement['status']) => {
    if (!selectedFramework) return;

    const requirements = getAllRequirements(selectedFramework);
    const currentReq = requirements[currentRequirementIndex];

    setAssessmentResults(prev => ({
      ...prev,
      [currentReq.id]: status
    }));

    if (currentRequirementIndex < requirements.length - 1) {
      setCurrentRequirementIndex(prev => prev + 1);
    } else {
      // Assessment complete
      completeAssessment();
    }
  };

  const completeAssessment = async () => {
    setAssessmentInProgress(false);
    
    try {
      const response = await fetch('/api/compliance/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: selectedFramework?.id,
          results: assessmentResults,
          completedAt: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to save assessment');

      toast({
        title: 'Assessment Complete',
        description: 'Your compliance assessment has been saved',
      });

      // Navigate to results
      router.push('/dashboard/workflows/compliance-review/gaps');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save assessment',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (!selectedFramework) return 0;
    const requirements = getAllRequirements(selectedFramework);
    return Math.round((currentRequirementIndex / requirements.length) * 100);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <DaisyButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </DaisyButton>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Framework Compliance Check</h1>
                <p className="text-gray-600 mt-1">Assess compliance against regulatory frameworks</p>
              </div>
              <DaisyBadge variant="outline" className="text-sm">
                <Clock className="h-4 w-4 mr-1" />
                25-35 min
              </DaisyBadge>
            </div>
          </div>

          {!assessmentInProgress && !selectedFramework && (
            /* Framework Selection */
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Compliance Framework</h2>
              <div className="grid gap-4">
                {frameworks.map((framework) => (
                  <DaisyCard
                    key={framework.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedFramework(framework)}
                  >
                    <DaisyCardBody className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{framework.name}</h3>
                          <p className="text-gray-600 mt-1">{framework.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <DaisyBadge variant="outline">
                              {framework.totalRequirements} Requirements
                            </DaisyBadge>
                            <DaisyBadge variant="outline">
                              {framework.categories.length} Categories
                            </DaisyBadge>
                          </div>
                        </div>
                        <Shield className="h-8 w-8 text-gray-400" />
                      </div>
                    </DaisyCardBody>
                  </DaisyCard>
                ))}
              </div>
            </div>
          )}

          {selectedFramework && !assessmentInProgress && currentRequirementIndex === 0 && (
            /* Pre-Assessment */
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle>Ready to Start Assessment</DaisyCardTitle>
              </DaisyCardBody>
              <DaisyCardBody className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Selected Framework</h3>
                  <p className="text-blue-800">{selectedFramework.name} - {selectedFramework.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Assessment Overview:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Total requirements to assess: {selectedFramework.totalRequirements}</li>
                    <li>• Categories to cover: {selectedFramework.categories.length}</li>
                    <li>• Estimated time: 25-35 minutes</li>
                    <li>• You can pause and resume at any time</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <DaisyButton onClick={startAssessment} size="lg">
                    <Play className="h-5 w-5 mr-2" />
                    Start Assessment
                  </DaisyButton>
                  <DaisyButton
                    variant="outline"
                    onClick={() => setSelectedFramework(null)}
                  >
                    Choose Different Framework
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          )}

          {assessmentInProgress && selectedFramework && (
            /* Assessment in Progress */
            <div className="space-y-6">
              {/* Progress Bar */}
              <DaisyCard>
                <DaisyCardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Assessment Progress</p>
                      <p className="text-2xl font-bold">{calculateProgress()}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Time Elapsed</p>
                      <p className="text-2xl font-bold">{formatTime(timeElapsed)}</p>
                    </div>
                  </div>
                  <DaisyProgress value={calculateProgress()} className="h-3" />
                  <p className="text-sm text-gray-600 mt-2">
                    Requirement {currentRequirementIndex + 1} of {getAllRequirements(selectedFramework).length}
                  </p>
                </DaisyCardBody>
              </DaisyCard>

              {/* Current Requirement */}
              <DaisyCard>
                <DaisyCardBody>
                  <div className="flex items-center justify-between">
                    <DaisyCardTitle className="text-lg">
                      {getAllRequirements(selectedFramework)[currentRequirementIndex].code} - {getAllRequirements(selectedFramework)[currentRequirementIndex].title}
                    </DaisyCardTitle>
                    <DaisyBadge variant="outline">
                      {selectedFramework.categories.find(cat => 
                        cat.requirements.includes(getAllRequirements(selectedFramework)[currentRequirementIndex])
                      )?.name}
                    </DaisyBadge>
                  </div>
                </DaisyCardBody>
                
                <DaisyCardBody className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">
                      {getAllRequirements(selectedFramework)[currentRequirementIndex].description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Compliance Status</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <DaisyButton
                        size="lg"
                        variant="outline"
                        className="border-green-500 hover:bg-green-50"
                        onClick={() => markRequirement('compliant')}
                      >
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        Compliant
                      </DaisyButton>
                      <DaisyButton
                        size="lg"
                        variant="outline"
                        className="border-red-500 hover:bg-red-50"
                        onClick={() => markRequirement('non-compliant')}
                      >
                        <XCircle className="h-5 w-5 mr-2 text-red-600" />
                        Non-Compliant
                      </DaisyButton>
                      <DaisyButton
                        size="lg"
                        variant="outline"
                        className="border-yellow-500 hover:bg-yellow-50"
                        onClick={() => markRequirement('partial')}
                      >
                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                        Partial
                      </DaisyButton>
                      <DaisyButton
                        size="lg"
                        variant="outline"
                        className="border-gray-500 hover:bg-gray-50"
                        onClick={() => markRequirement('not-assessed')}
                      >
                        <Shield className="h-5 w-5 mr-2 text-gray-600" />
                        Skip
                      </DaisyButton>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <DaisyButton variant="outline" onClick={pauseAssessment}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </DaisyButton>
                    <DaisyButton variant="outline" onClick={resetAssessment}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </DaisyButton>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            </div>
          )}

          {/* Paused State */}
          {!assessmentInProgress && selectedFramework && currentRequirementIndex > 0 && 
           currentRequirementIndex < getAllRequirements(selectedFramework).length && (
            <DaisyCard>
              <DaisyCardBody className="p-12 text-center">
                <Pause className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment Paused</h3>
                <p className="text-gray-600 mb-4">
                  You've completed {currentRequirementIndex} of {getAllRequirements(selectedFramework).length} requirements
                </p>
                <div className="flex gap-3 justify-center">
                  <DaisyButton onClick={() => setAssessmentInProgress(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Assessment
                  </DaisyButton>
                  <DaisyButton variant="outline" onClick={resetAssessment}>
                    Start Over
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}