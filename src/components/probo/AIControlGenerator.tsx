'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  Sparkles,
  Shield,
  Zap,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Settings,
  FileCheck,
  Users,
  Globe,
  Lock,
  Activity,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Cpu,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ProboControl,
  ControlGenerationRequest,
  ControlGenerationResponse,
  OrganizationContext,
  GenerationConstraints,
  ProboAIAnalysis,
  RiskControlMapping
} from '@/types/probo-integration.types';
import { ProboIntegrationService } from '@/services/ProboIntegrationService';

interface AIControlGeneratorProps {
  riskId: string;
  riskTitle: string;
  riskDescription: string;
  riskCategory: string;
  riskSeverity: 'Critical' | 'High' | 'Medium' | 'Low';
  onControlsGenerated?: (controls: ProboControl[], mappings: RiskControlMapping[]) => void;
  className?: string;
}

export default function AIControlGenerator({
  riskId,
  riskTitle,
  riskDescription,
  riskCategory,
  riskSeverity,
  onControlsGenerated,
  className = ''
}: AIControlGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedResponse, setGeneratedResponse] = useState<ControlGenerationResponse | null>(null);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('generation');

  // Generation configuration
  const [organizationContext, setOrganizationContext] = useState<OrganizationContext>({
    industry: 'Technology',
    size: 'Medium',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    existingControls: [],
    complianceGoals: ['SOC2', 'ISO27001'],
    riskTolerance: 'Medium',
    budget: 'Moderate',
    timeline: 'Standard'
  });

  const [constraints, setConstraints] = useState<GenerationConstraints>({
    maxImplementationHours: 80,
    allowedComplexity: ['Simple', 'Moderate', 'Complex'],
    requiredAutomation: false,
    mustHaveFrameworks: ['SOC2'],
    excludeCategories: []
  });

  const [preferredFrameworks, setPreferredFrameworks] = useState<string[]>(['SOC2']);

  const proboService = ProboIntegrationService.getInstance();

  const generationSteps = [
    'Analyzing Risk Context',
    'Identifying Relevant Controls',
    'Generating AI Recommendations',
    'Creating Control Mappings',
    'Calculating Implementation Plan',
    'Finalizing Results'
  ];

  const handleGenerateControls = async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress(0);
    setActiveTab('generation');

    try {
      // Simulate step-by-step generation with progress updates
      for (let i = 0; i < generationSteps.length; i++) {
        setGenerationStep(i);
        setGenerationProgress((i / generationSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      }

      const request: ControlGenerationRequest = {
        riskId,
        riskTitle,
        riskDescription,
        riskCategory,
        riskSeverity,
        organizationContext,
        preferredFrameworks,
        constraints
      };

      const response = await proboService.generateControlsForRisk(request);
      setGeneratedResponse(response);
      setSelectedControls(response.controls.map(c => c.id));
      setGenerationProgress(100);
      setActiveTab('results');

      if (onControlsGenerated) {
        onControlsGenerated(response.controls, response.mappings);
      }
    } catch (error) {
      console.error('Error generating controls:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleControlSelection = (controlId: string, selected: boolean) => {
    setSelectedControls(prev => 
      selected 
        ? [...prev, controlId]
        : prev.filter(id => id !== controlId)
    );
  };

  const handleSelectAllControls = () => {
    if (!generatedResponse) return;
    setSelectedControls(generatedResponse.controls.map(c => c.id));
  };

  const handleDeselectAllControls = () => {
    setSelectedControls([]);
  };

  const getControlIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'access control': return Shield;
      case 'data protection': return Lock;
      case 'network security': return Globe;
      case 'incident response': return AlertTriangle;
      case 'compliance monitoring': return FileCheck;
      case 'vendor management': return Users;
      default: return Shield;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Complex': return 'bg-red-50 text-red-700';
      case 'Moderate': return 'bg-yellow-50 text-yellow-700';
      case 'Simple': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI-Powered Control Generation</h3>
              <p className="text-sm text-gray-600 font-normal">
                Generate intelligent security controls using Probo's compliance framework
              </p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Probo AI
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Risk</p>
                <p className="font-medium">{riskTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Severity</p>
                <Badge className={getPriorityColor(riskSeverity)}>{riskSeverity}</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-medium">{riskCategory}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Framework</p>
                <p className="font-medium">{preferredFrameworks.join(', ')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="results" disabled={!generatedResponse}>Results</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select
                      value={organizationContext.industry}
                      onValueChange={(value) => setOrganizationContext(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Organization Size</Label>
                    <Select
                      value={organizationContext.size}
                      onValueChange={(value: any) => setOrganizationContext(prev => ({ ...prev, size: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Startup">Startup (1-50)</SelectItem>
                        <SelectItem value="Small">Small (51-200)</SelectItem>
                        <SelectItem value="Medium">Medium (201-1000)</SelectItem>
                        <SelectItem value="Large">Large (1001-5000)</SelectItem>
                        <SelectItem value="Enterprise">Enterprise (5000+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tech Stack</Label>
                  <Textarea
                    value={organizationContext.techStack.join(', ')}
                    onChange={(e) => setOrganizationContext(prev => ({ 
                      ...prev, 
                      techStack: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    placeholder="React, Node.js, PostgreSQL, AWS, Docker..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Risk Tolerance</Label>
                    <Select
                      value={organizationContext.riskTolerance}
                      onValueChange={(value: any) => setOrganizationContext(prev => ({ ...prev, riskTolerance: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timeline</Label>
                    <Select
                      value={organizationContext.timeline}
                      onValueChange={(value: any) => setOrganizationContext(prev => ({ ...prev, timeline: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urgent">Urgent (1-2 weeks)</SelectItem>
                        <SelectItem value="Standard">Standard (1-2 months)</SelectItem>
                        <SelectItem value="Flexible">Flexible (3+ months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Constraints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generation Constraints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Implementation Hours</Label>
                  <Input
                    type="number"
                    value={constraints.maxImplementationHours}
                    onChange={(e) => setConstraints(prev => ({ 
                      ...prev, 
                      maxImplementationHours: parseInt(e.target.value) || 80 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allowed Complexity</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Simple', 'Moderate', 'Complex'].map((complexity) => (
                      <div key={complexity} className="flex items-center space-x-2">
                        <Checkbox
                          id={complexity}
                          checked={constraints.allowedComplexity.includes(complexity as any)}
                          onCheckedChange={(checked) => {
                            setConstraints(prev => ({
                              ...prev,
                              allowedComplexity: checked
                                ? [...prev.allowedComplexity, complexity as any]
                                : prev.allowedComplexity.filter(c => c !== complexity)
                            }));
                          }}
                        />
                        <Label htmlFor={complexity} className="text-sm">{complexity}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Frameworks</Label>
                  <div className="flex flex-wrap gap-2">
                    {['SOC2', 'ISO27001', 'GDPR', 'HIPAA'].map((framework) => (
                      <div key={framework} className="flex items-center space-x-2">
                        <Checkbox
                          id={framework}
                          checked={preferredFrameworks.includes(framework)}
                          onCheckedChange={(checked) => {
                            setPreferredFrameworks(prev => 
                              checked
                                ? [...prev, framework]
                                : prev.filter(f => f !== framework)
                            );
                          }}
                        />
                        <Label htmlFor={framework} className="text-sm">{framework}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiredAutomation"
                    checked={constraints.requiredAutomation}
                    onCheckedChange={(checked) => setConstraints(prev => ({ 
                      ...prev, 
                      requiredAutomation: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="requiredAutomation" className="text-sm">
                    Prioritize automation-friendly controls
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleGenerateControls} 
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Controls
            </Button>
          </div>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                AI Control Generation in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Step {generationStep + 1} of {generationSteps.length}: {generationSteps[generationStep]}
                    </span>
                    <span className="text-sm text-gray-500">{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  
                  <div className="space-y-2">
                    {generationSteps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {index < generationStep ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : index === generationStep ? (
                          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-sm ${
                          index <= generationStep ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Generate Controls</h3>
                  <p className="text-gray-600 mb-4">
                    Click "Generate AI Controls" to start the intelligent control generation process.
                  </p>
                  <Button 
                    onClick={handleGenerateControls}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Generation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {generatedResponse && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Controls Generated</p>
                        <p className="text-2xl font-bold text-blue-900">{generatedResponse.controls.length}</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Implementation Time</p>
                        <p className="text-2xl font-bold text-green-900">{generatedResponse.estimatedTimeToImplement}h</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">AI Confidence</p>
                        <p className="text-2xl font-bold text-purple-900">{Math.round(generatedResponse.analysis.confidence * 100)}%</p>
                      </div>
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Est. Cost</p>
                        <p className="text-2xl font-bold text-orange-900">${generatedResponse.estimatedCost?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Control Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Generated Controls
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSelectAllControls}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDeselectAllControls}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedResponse.controls.map((control) => {
                      const IconComponent = getControlIcon(control.category.name);
                      const isSelected = selectedControls.includes(control.id);
                      
                      return (
                        <motion.div
                          key={control.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border rounded-lg p-4 transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleControlSelection(control.id, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg`} style={{ backgroundColor: control.category.color + '20' }}>
                                    <IconComponent className="h-4 w-4" style={{ color: control.category.color }} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{control.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{control.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getPriorityColor(control.priority)}>
                                    {control.priority}
                                  </Badge>
                                  <Badge className={getComplexityColor(control.implementationComplexity)}>
                                    {control.implementationComplexity}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{control.estimatedHours}h</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Zap className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{control.automationPotential}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">Risk Score: {control.riskMitigationScore}/10</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Brain className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">AI: {Math.round(control.aiConfidence * 100)}%</span>
                                </div>
                              </div>

                              {control.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {control.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('configuration')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Modify Configuration
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Controls
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Implement Selected ({selectedControls.length})
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 