'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyInput } from '@/components/ui/DaisyInput';
import {
  DaisySelect,
  DaisySelectTrigger,
  DaisySelectValue,
  DaisySelectContent,
  DaisySelectItem,
} from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyAlert, DaisyAlertDescription } from '@/components/ui/DaisyAlert';
import {
  Network,
  Brain,
  Sparkles,
  Shield,
  Target,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Lightbulb,
  Link,
  Unlink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { ProboControl, RiskControlMapping, ProboAIAnalysis } from '@/types/probo-integration.types';
import { ProboIntegrationService } from '@/services/ProboIntegrationService';

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  impact: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  riskScore: number;
}

interface SmartRiskControlMapperProps {
  risks: Risk[];
  controls: ProboControl[];
  existingMappings: RiskControlMapping[];
  onMappingsUpdate?: (mappings: RiskControlMapping[]) => void;
  className?: string;
}

export default function SmartRiskControlMapper({
  risks,
  controls,
  existingMappings,
  onMappingsUpdate,
  className = '',
}: SmartRiskControlMapperProps) {
  const [mappings, setMappings] = useState<RiskControlMapping[]>(existingMappings);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [selectedControl, setSelectedControl] = useState<ProboControl | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showMappingDetails, setShowMappingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'network' | 'matrix'>('grid');

  const proboService = ProboIntegrationService.getInstance();

  // Filter risks based on search and filters
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const matchesSearch =
        risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === 'all' || risk.severity === filterSeverity;
      const matchesCategory = filterCategory === 'all' || risk.category === filterCategory;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [risks, searchTerm, filterSeverity, filterCategory]);

  // Get unique categories
  const riskCategories = useMemo(() => {
    return Array.from(new Set(risks.map((risk) => risk.category)));
  }, [risks]);

  // Get mappings for a specific risk
  const getRiskMappings = (riskId: string) => {
    return mappings.filter((mapping) => mapping.riskId === riskId);
  };

  // Get controls mapped to a specific risk
  const getMappedControls = (riskId: string) => {
    const riskMappings = getRiskMappings(riskId);
    return controls.filter((control) =>
      riskMappings.some((mapping) => mapping.controlId === control.id)
    );
  };

  // Get unmapped controls for a risk
  const getUnmappedControls = (riskId: string) => {
    const mappedControlIds = getMappedControls(riskId).map((c) => c.id);
    return controls.filter((control) => !mappedControlIds.includes(control.id));
  };

  // Calculate risk coverage
  const calculateRiskCoverage = (riskId: string) => {
    const riskMappings = getRiskMappings(riskId);
    if (riskMappings.length === 0) return 0;

    const totalCoverage = riskMappings.reduce((sum, mapping) => sum + mapping.coverage, 0);
    return Math.min(100, totalCoverage);
  };

  // Generate AI mapping suggestions
  const generateAISuggestions = async (_risk: Risk) => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis for control suggestions
      const suggestions = await analyzeRiskForControlSuggestions(risk);
      setAiSuggestions(suggestions);
    } catch (error) {
      // console.error('Error generating AI suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulate AI analysis
  const analyzeRiskForControlSuggestions = async (_risk: Risk): Promise<any[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate smart suggestions based on risk characteristics
    const suggestions = controls
      .filter((control) => !getMappedControls(risk.id).some((mc) => mc.id === control.id))
      .map((control) => ({
        control,
        relevanceScore: calculateRelevanceScore(risk, control),
        reasoning: generateReasoningText(risk, control),
        suggestedMappingType: suggestMappingType(risk, control),
        estimatedEffectiveness: estimateEffectiveness(risk, control),
        implementationPriority: calculatePriority(risk, control),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 suggestions

    return suggestions;
  };

  // Calculate relevance score between risk and control
  const calculateRelevanceScore = (_risk: Risk, control: ProboControl): number => {
    let score = 0;

    // Category matching
    if (
      control.category.name.toLowerCase().includes(risk.category.toLowerCase()) ||
      risk.category.toLowerCase().includes(control.category.name.toLowerCase())
    ) {
      score += 30;
    }

    // Severity/Priority alignment
    if (
      (risk.severity === 'Critical' && control.priority === 'Critical') ||
      (risk.severity === 'High' && ['Critical', 'High'].includes(control.priority))
    ) {
      score += 25;
    }

    // Risk mitigation score
    score += control.riskMitigationScore * 2;

    // AI confidence
    score += control.aiConfidence * 20;

    // Keywords matching
    const riskKeywords = (risk.title + ' ' + risk.description).toLowerCase();
    const controlKeywords = (control.title + ' ' + control.description).toLowerCase();
    const commonWords = [
      'access',
      'data',
      'security',
      'authentication',
      'encryption',
      'monitoring',
    ];

    commonWords.forEach((word) => {
      if (riskKeywords.includes(word) && controlKeywords.includes(word)) {
        score += 5;
      }
    });

    return Math.min(100, score);
  };

  // Generate reasoning text
  const generateReasoningText = (_risk: Risk, control: ProboControl): string => {
    const reasons = [];

    if (control.category.name.toLowerCase().includes(risk.category.toLowerCase())) {
      reasons.push(`Directly addresses ${risk.category.toLowerCase()} risks`);
    }

    if (control.riskMitigationScore >= 8) {
      reasons.push('High risk mitigation potential');
    }

    if (control.automationPotential === 'Full') {
      reasons.push('Can be fully automated');
    }

    if (control.priority === risk.severity) {
      reasons.push('Priority level matches risk severity');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'General security enhancement';
  };

  // Suggest mapping type
  const suggestMappingType = (_risk: Risk,
    control: ProboControl
  ): 'Preventive' | 'Detective' | 'Corrective' | 'Compensating' => {
    if (
      control.category.name.includes('Access') ||
      control.category.name.includes('Authentication')
    ) {
      return 'Preventive';
    }
    if (
      control.category.name.includes('Monitoring') ||
      control.category.name.includes('Detection')
    ) {
      return 'Detective';
    }
    if (control.category.name.includes('Response') || control.category.name.includes('Recovery')) {
      return 'Corrective';
    }
    return 'Preventive';
  };

  // Estimate effectiveness
  const estimateEffectiveness = (_risk: Risk, control: ProboControl): 'High' | 'Medium' | 'Low' => {
    const relevanceScore = calculateRelevanceScore(risk, control);
    if (relevanceScore >= 70) return 'High';
    if (relevanceScore >= 40) return 'Medium';
    return 'Low';
  };

  // Calculate implementation priority
  const calculatePriority = (_risk: Risk, control: ProboControl): number => {
    let priority = 0;

    // Risk severity weight
    const severityWeight = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };
    priority += severityWeight[risk.severity] * 25;

    // Control effectiveness
    priority += control.riskMitigationScore * 5;

    // Implementation complexity (inverse)
    const complexityWeight = {
      Simple: 3,
      Moderate: 2,
      Complex: 1,
    };
    priority += complexityWeight[control.implementationComplexity] * 10;

    return Math.min(100, priority);
  };

  // Create a new mapping
  const createMapping = (
    riskId: string,
    controlId: string,
    mappingType: string,
    effectiveness: string
  ) => {
    const newMapping: RiskControlMapping = {
      id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      riskId,
      controlId,
      mappingType: mappingType as any,
      effectiveness: effectiveness as any,
      coverage: effectiveness === 'High' ? 80 : effectiveness === 'Medium' ? 50 : 30,
      aiGenerated: true,
      aiConfidence: 0.85,
      rationale: 'AI-suggested mapping based on risk-control analysis',
      createdAt: new Date().toISOString(),
    };

    const updatedMappings = [...mappings, newMapping];
    setMappings(updatedMappings);
    onMappingsUpdate?.(updatedMappings);
  };

  // Remove a mapping
  const removeMapping = (mappingId: string) => {
    const updatedMappings = mappings.filter((m) => m.id !== mappingId);
    setMappings(updatedMappings);
    onMappingsUpdate?.(updatedMappings);
  };

  // Apply AI suggestion
  const applyAISuggestion = (suggestion: any) => {
    if (!selectedRisk) return;

    createMapping(
      selectedRisk.id,
      suggestion.control.id,
      suggestion.suggestedMappingType,
      suggestion.estimatedEffectiveness
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'High':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <DaisyCard className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Smart Risk-Control Mapper</h3>
              <p className="text-sm text-gray-600 font-normal">
                AI-powered intelligent mapping between risks and controls
              </p>
            </div>
            <div className="ml-auto">
              <DaisyBadge className="bg-purple-100 text-purple-800 border-purple-200">
                <Brain className="h-3 w-3 mr-1" />
                AI-Enhanced
              </DaisyBadge>
            </div>
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Total Risks</p>
                <p className="font-medium">{risks.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Available Controls</p>
                <p className="font-medium">{controls.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Active Mappings</p>
                <p className="font-medium">{mappings.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Avg Coverage</p>
                <p className="font-medium">
                  {risks.length > 0
                    ? Math.round(
                        risks.reduce((sum, risk) => sum + calculateRiskCoverage(risk.id), 0) /
                          risks.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Filters and Search */}
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters & Search
            </div>
            <div className="flex items-center gap-2">
              <DaisyButton
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
          setViewMode('grid')}
              >
                Grid
              
        </DaisyButton>
              <DaisyButton
                variant={viewMode === 'matrix' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
          setViewMode('matrix')}
              >
                Matrix
              
        </DaisyButton>
            </div>
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Risks</label>
              <DaisyInput
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) = />
setSearchTerm(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <DaisySelect value={filterSeverity} onValueChange={setFilterSeverity}>
                <DaisySelectTrigger>
                  <DaisySelectValue />
                <DaisySelectContent>
                  <DaisySelectItem value="all">All Severities</DaisySelectItem>
                  <DaisySelectItem value="Critical">Critical</DaisySelectItem>
                  <DaisySelectItem value="High">High</DaisySelectItem>
                  <DaisySelectItem value="Medium">Medium</DaisySelectItem>
                  <DaisySelectItem value="Low">Low</DaisySelectItem>
                </DaisySelectContent>
              </DaisySelect>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <DaisySelect value={filterCategory} onValueChange={setFilterCategory}>
                <DaisySelectTrigger>
                  <DaisySelectValue />
                <DaisySelectContent>
                  <DaisySelectItem value="all">All Categories</DaisySelectItem>
                  {riskCategories.map((category) => (
                    <DaisySelectItem key={category} value={category}>
                      {category}
                    </DaisySelectItem>
                  ))}
                </DaisySelectContent>
              </DaisySelect>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex space-x-2">
                <DaisyButton variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </DaisyButton>
                <DaisyButton variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </DaisyButton>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risks List */}
        <DaisyCard className="lg:col-span-1">
          <DaisyCardBody>
            <DaisyCardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risks ({filteredRisks.length})
            </DaisyCardTitle>
          </DaisyCardBody>
          <DaisyCardBody className="space-y-3 max-h-96 overflow-y-auto">
            {filteredRisks.map((risk) => {
              const coverage = calculateRiskCoverage(risk.id);
              const mappedControlsCount = getMappedControls(risk.id).length;
              const isSelected = selectedRisk?.id === risk.id;

              return (
                <motion.div
                  key={risk.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedRisk(risk);
                    generateAISuggestions(risk);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{risk.title}</h4>
                      <DaisyBadge className={getPriorityColor(risk.severity)}>
                        {risk.severity}
                      </DaisyBadge>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2">{risk.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{mappedControlsCount} controls</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Coverage:</span>
                        <span className="text-xs font-medium">{coverage}%</span>
                      </div>
                    </div>

                    <DaisyProgress value={coverage} className="h-1" />
</div>
                </motion.div>
              );
            })}
          </DaisyCardBody>
        </DaisyCard>

        {/* AI Suggestions & Mapping */}
        <DaisyCard className="lg:col-span-2">
          <DaisyCardBody>
            <DaisyCardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {selectedRisk
                ? `AI Suggestions for: ${selectedRisk.title}`
                : 'Select a Risk to View AI Suggestions'}
            </DaisyCardTitle>
          </DaisyCardBody>
          <DaisyCardBody>
            {!selectedRisk ? (
              <div className="text-center py-8">
                <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Risk Selected</h3>
                <p className="text-gray-600">
                  Select a risk from the left panel to view AI-powered control suggestions.
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="text-center py-8">
                <RefreshCw className="h-16 w-16 mx-auto text-blue-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Analyzing Risk</h3>
                <p className="text-gray-600">
                  AI is analyzing the risk and generating intelligent control suggestions...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Mappings */}
                {getMappedControls(selectedRisk.id).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Currently Mapped Controls ({getMappedControls(selectedRisk.id).length})
                    </h4>
                    <div className="space-y-2">
                      {getMappedControls(selectedRisk.id).map((control) => {
                        const mapping = mappings.find(
                          (m) => m.riskId === selectedRisk.id && m.controlId === control.id
                        );

                        return (
                          <div
                            key={control.id}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Shield className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="font-medium text-sm">{control.title}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <DaisyBadge variant="outline" className="text-xs">
                                    {mapping?.mappingType}
                                  </DaisyBadge>
                                  <DaisyBadge
                                    className={`text-xs ${getEffectivenessColor(mapping?.effectiveness || 'Medium')}`}
                                  >
                                    {mapping?.effectiveness}
                                  </DaisyBadge>
                                  <span className="text-xs text-gray-500">
                                    Coverage: {mapping?.coverage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={() => mapping && removeMapping(mapping.id)}
                            >
                              <Unlink className="h-4 w-4" />
                            </DaisyButton>
                          </div>
                        );
                      })}
                    </div>
                    <DaisySeparator className="my-4" />
</div>
                )}

                {/* AI Suggestions */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    AI-Suggested Controls ({aiSuggestions.length})
                  </h4>

                  {aiSuggestions.length === 0 ? (
                    <DaisyAlert>
                      <Lightbulb className="h-4 w-4" />
                      <DaisyAlertDescription>
                        No additional control suggestions found. All relevant controls may already
                        be mapped.
                      </DaisyAlertDescription>
                    </DaisyAlert>
                  ) : (
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.control.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border border-purple-200 rounded-lg bg-purple-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium">{suggestion.control.title}</h5>
                                <DaisyBadge className="bg-purple-100 text-purple-800">
                                  {suggestion.relevanceScore}% match
                                </DaisyBadge>
                              </div>

                              <p className="text-sm text-gray-600 mb-3">
                                {suggestion.control.description}
                              </p>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500">Suggested Type</p>
                                  <DaisyBadge variant="outline" className="text-xs">
                                    {suggestion.suggestedMappingType}
                                  </DaisyBadge>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Effectiveness</p>
                                  <DaisyBadge
                                    className={`text-xs ${getEffectivenessColor(suggestion.estimatedEffectiveness)}`}
                                  >
                                    {suggestion.estimatedEffectiveness}
                                  </DaisyBadge>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{suggestion.control.estimatedHours}h</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Zap className="h-3 w-3" />
                                  <span>{suggestion.control.automationPotential}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>Priority: {suggestion.implementationPriority}/100</span>
                                </div>
                              </div>

                              <p className="text-xs text-gray-600 italic">
                                <strong>AI Reasoning:</strong> {suggestion.reasoning}
                              </p>
                            </div>

                            <DaisyButton
                              size="sm"
                              onClick={() => applyAISuggestion(suggestion)}
                              className="ml-4"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Apply
                            </DaisyButton>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
}
