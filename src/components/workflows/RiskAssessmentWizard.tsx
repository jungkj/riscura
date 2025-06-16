'use client';

import React, { useState, useEffect } from 'react';
import { WizardContainer, WizardStepProps } from './WizardContainer';
import { designTokens } from '@/lib/design-system/tokens';
import { 
  RiskManagementIcons, 
  StatusIcons, 
  ActionIcons,
  DataIcons
} from '@/components/icons/IconLibrary';

// Risk Assessment Data Types
interface RiskIdentificationData {
  title: string;
  description: string;
  category: string;
  owner: string;
  department: string;
  tags: string[];
  riskType: 'strategic' | 'operational' | 'financial' | 'compliance' | 'reputational';
}

interface RiskAssessmentData {
  impactScore: number;
  likelihoodScore: number;
  impactJustification: string;
  likelihoodJustification: string;
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  affectedStakeholders: string[];
}

interface ControlMappingData {
  existingControls: Array<{
    id: string;
    name: string;
    effectiveness: 'low' | 'medium' | 'high';
    type: 'preventive' | 'detective' | 'corrective';
  }>;
  proposedControls: Array<{
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedCost: number;
    implementationTime: string;
  }>;
  residualRisk: {
    impactScore: number;
    likelihoodScore: number;
  };
}

interface RiskReviewData {
  reviewNotes: string;
  approvalRequired: boolean;
  approver?: string;
  implementationPlan: string;
  reviewDate: string;
}

interface CompleteRiskData extends RiskIdentificationData, RiskAssessmentData, ControlMappingData, RiskReviewData {}

// Step 1: Risk Identification
const RiskIdentificationForm: React.FC<WizardStepProps> = ({
  data,
  onDataChange,
  onValidationChange,
  isActive
}) => {
  const [formData, setFormData] = useState<RiskIdentificationData>({
    title: data.title || '',
    description: data.description || '',
    category: data.category || '',
    owner: data.owner || '',
    department: data.department || '',
    tags: data.tags || [],
    riskType: data.riskType || 'operational'
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isActive) {
      // Validate form
      const errors: Record<string, string> = {};
      
      if (!formData.title.trim()) errors.title = 'Risk title is required';
      if (!formData.description.trim()) errors.description = 'Risk description is required';
      if (!formData.category) errors.category = 'Risk category is required';
      if (!formData.owner.trim()) errors.owner = 'Risk owner is required';
      if (!formData.department) errors.department = 'Department is required';

      onValidationChange({
        isValid: Object.keys(errors).length === 0,
        errors
      });

      onDataChange(formData);
    }
  }, [formData, isActive, onDataChange, onValidationChange]);

  const handleInputChange = (field: keyof RiskIdentificationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const riskCategories = [
    'Cybersecurity', 'Data Privacy', 'Operational', 'Financial', 'Regulatory',
    'Strategic', 'Reputational', 'Third-party', 'Environmental', 'Human Resources'
  ];

  const departments = [
    'IT', 'Finance', 'Operations', 'Legal', 'HR', 'Marketing', 'Sales', 'R&D', 'Procurement'
  ];

  return (
    <div className="space-y-6">
      {/* Risk Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Risk Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a clear, concise risk title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Risk Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Risk Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the risk, its potential causes, and impacts"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Risk Type and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Type *
          </label>
          <select
            value={formData.riskType}
            onChange={(e) => handleInputChange('riskType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="strategic">Strategic</option>
            <option value="operational">Operational</option>
            <option value="financial">Financial</option>
            <option value="compliance">Compliance</option>
            <option value="reputational">Reputational</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category</option>
            {riskCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Owner and Department */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Owner *
          </label>
          <input
            type="text"
            value={formData.owner}
            onChange={(e) => handleInputChange('owner', e.target.value)}
            placeholder="Enter risk owner name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department *
          </label>
          <select
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <ActionIcons.Close size="xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Step 2: Risk Assessment
const RiskAssessmentForm: React.FC<WizardStepProps> = ({
  data,
  onDataChange,
  onValidationChange,
  isActive
}) => {
  const [formData, setFormData] = useState<RiskAssessmentData>({
    impactScore: data.impactScore || 1,
    likelihoodScore: data.likelihoodScore || 1,
    impactJustification: data.impactJustification || '',
    likelihoodJustification: data.likelihoodJustification || '',
    timeframe: data.timeframe || 'medium-term',
    affectedStakeholders: data.affectedStakeholders || []
  });

  const [newStakeholder, setNewStakeholder] = useState('');

  useEffect(() => {
    if (isActive) {
      const errors: Record<string, string> = {};
      
      if (!formData.impactJustification.trim()) {
        errors.impactJustification = 'Impact justification is required';
      }
      if (!formData.likelihoodJustification.trim()) {
        errors.likelihoodJustification = 'Likelihood justification is required';
      }

      onValidationChange({
        isValid: Object.keys(errors).length === 0,
        errors
      });

      onDataChange(formData);
    }
  }, [formData, isActive, onDataChange, onValidationChange]);

  const handleInputChange = (field: keyof RiskAssessmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStakeholder = () => {
    if (newStakeholder.trim() && !formData.affectedStakeholders.includes(newStakeholder.trim())) {
      handleInputChange('affectedStakeholders', [...formData.affectedStakeholders, newStakeholder.trim()]);
      setNewStakeholder('');
    }
  };

  const removeStakeholder = (stakeholder: string) => {
    handleInputChange('affectedStakeholders', formData.affectedStakeholders.filter(s => s !== stakeholder));
  };

  const getRiskScore = () => formData.impactScore * formData.likelihoodScore;
  const getRiskLevel = () => {
    const score = getRiskScore();
    if (score >= 15) return { level: 'Critical', color: 'text-red-700 bg-red-100' };
    if (score >= 10) return { level: 'High', color: 'text-orange-700 bg-orange-100' };
    if (score >= 6) return { level: 'Medium', color: 'text-yellow-700 bg-yellow-100' };
    return { level: 'Low', color: 'text-green-700 bg-green-100' };
  };

  const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];
  const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

  return (
    <div className="space-y-6">
      {/* Risk Score Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Current Risk Score</h3>
            <p className="text-sm text-gray-600">Impact × Likelihood = Risk Score</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formData.impactScore} × {formData.likelihoodScore} = {getRiskScore()}
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevel().color}`}>
              {getRiskLevel().level} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Impact Assessment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Impact Score (1-5) *
        </label>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => handleInputChange('impactScore', score)}
              className={`p-3 text-center border rounded-md transition-colors ${
                formData.impactScore === score
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{score}</div>
              <div className="text-xs text-gray-600">{impactLabels[score - 1]}</div>
            </button>
          ))}
        </div>
        <textarea
          value={formData.impactJustification}
          onChange={(e) => handleInputChange('impactJustification', e.target.value)}
          placeholder="Justify your impact score. Consider financial, operational, and reputational impacts."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Likelihood Assessment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Likelihood Score (1-5) *
        </label>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => handleInputChange('likelihoodScore', score)}
              className={`p-3 text-center border rounded-md transition-colors ${
                formData.likelihoodScore === score
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{score}</div>
              <div className="text-xs text-gray-600">{likelihoodLabels[score - 1]}</div>
            </button>
          ))}
        </div>
        <textarea
          value={formData.likelihoodJustification}
          onChange={(e) => handleInputChange('likelihoodJustification', e.target.value)}
          placeholder="Justify your likelihood score. Consider historical data, current controls, and environmental factors."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Timeframe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Risk Timeframe
        </label>
        <select
          value={formData.timeframe}
          onChange={(e) => handleInputChange('timeframe', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="immediate">Immediate (0-3 months)</option>
          <option value="short-term">Short-term (3-12 months)</option>
          <option value="medium-term">Medium-term (1-3 years)</option>
          <option value="long-term">Long-term (3+ years)</option>
        </select>
      </div>

      {/* Affected Stakeholders */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Affected Stakeholders
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.affectedStakeholders.map(stakeholder => (
            <span
              key={stakeholder}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {stakeholder}
              <button
                onClick={() => removeStakeholder(stakeholder)}
                className="ml-1 text-gray-600 hover:text-gray-800"
              >
                <ActionIcons.Close size="xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newStakeholder}
            onChange={(e) => setNewStakeholder(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStakeholder())}
            placeholder="Add affected stakeholder"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addStakeholder}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Step 3: Control Mapping
const ControlMappingForm: React.FC<WizardStepProps> = ({
  data,
  onDataChange,
  onValidationChange,
  isActive
}) => {
  const [formData, setFormData] = useState<ControlMappingData>({
    existingControls: data.existingControls || [],
    proposedControls: data.proposedControls || [],
    residualRisk: data.residualRisk || { impactScore: data.impactScore || 1, likelihoodScore: data.likelihoodScore || 1 }
  });

  useEffect(() => {
    if (isActive) {
      onValidationChange({ isValid: true });
      onDataChange(formData);
    }
  }, [formData, isActive, onDataChange, onValidationChange]);

  const handleInputChange = (field: keyof ControlMappingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExistingControl = () => {
    const newControl = {
      id: `control-${Date.now()}`,
      name: '',
      effectiveness: 'medium' as const,
      type: 'preventive' as const
    };
    handleInputChange('existingControls', [...formData.existingControls, newControl]);
  };

  const updateExistingControl = (index: number, field: string, value: any) => {
    const updated = [...formData.existingControls];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('existingControls', updated);
  };

  const removeExistingControl = (index: number) => {
    handleInputChange('existingControls', formData.existingControls.filter((_, i) => i !== index));
  };

  const addProposedControl = () => {
    const newControl = {
      name: '',
      description: '',
      priority: 'medium' as const,
      estimatedCost: 0,
      implementationTime: ''
    };
    handleInputChange('proposedControls', [...formData.proposedControls, newControl]);
  };

  const updateProposedControl = (index: number, field: string, value: any) => {
    const updated = [...formData.proposedControls];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('proposedControls', updated);
  };

  const removeProposedControl = (index: number) => {
    handleInputChange('proposedControls', formData.proposedControls.filter((_, i) => i !== index));
  };

  const getResidualRiskScore = () => formData.residualRisk.impactScore * formData.residualRisk.likelihoodScore;
  const getResidualRiskLevel = () => {
    const score = getResidualRiskScore();
    if (score >= 15) return { level: 'Critical', color: 'text-red-700 bg-red-100' };
    if (score >= 10) return { level: 'High', color: 'text-orange-700 bg-orange-100' };
    if (score >= 6) return { level: 'Medium', color: 'text-yellow-700 bg-yellow-100' };
    return { level: 'Low', color: 'text-green-700 bg-green-100' };
  };

  return (
    <div className="space-y-6">
      {/* Existing Controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Existing Controls</h3>
          <button
            onClick={addExistingControl}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            <ActionIcons.Add size="xs" className="mr-1" />
            Add Control
          </button>
        </div>

        <div className="space-y-3">
          {formData.existingControls.map((control, index) => (
            <div key={control.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={control.name}
                    onChange={(e) => updateExistingControl(index, 'name', e.target.value)}
                    placeholder="Control name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={control.type}
                    onChange={(e) => updateExistingControl(index, 'type', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="preventive">Preventive</option>
                    <option value="detective">Detective</option>
                    <option value="corrective">Corrective</option>
                  </select>
                  <select
                    value={control.effectiveness}
                    onChange={(e) => updateExistingControl(index, 'effectiveness', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    onClick={() => removeExistingControl(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <ActionIcons.Remove size="xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed Controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Proposed Additional Controls</h3>
          <button
            onClick={addProposedControl}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
          >
            <ActionIcons.Add size="xs" className="mr-1" />
            Add Proposal
          </button>
        </div>

        <div className="space-y-4">
          {formData.proposedControls.map((control, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={control.name}
                  onChange={(e) => updateProposedControl(index, 'name', e.target.value)}
                  placeholder="Proposed control name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <select
                    value={control.priority}
                    onChange={(e) => updateProposedControl(index, 'priority', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <button
                    onClick={() => removeProposedControl(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <ActionIcons.Remove size="xs" />
                  </button>
                </div>
              </div>
              <textarea
                value={control.description}
                onChange={(e) => updateProposedControl(index, 'description', e.target.value)}
                placeholder="Control description and implementation details"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    value={control.estimatedCost}
                    onChange={(e) => updateProposedControl(index, 'estimatedCost', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Implementation Time
                  </label>
                  <input
                    type="text"
                    value={control.implementationTime}
                    onChange={(e) => updateProposedControl(index, 'implementationTime', e.target.value)}
                    placeholder="e.g., 2-3 months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Residual Risk Assessment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Residual Risk Assessment</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            Assess the remaining risk after considering existing and proposed controls.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residual Impact (1-5)
              </label>
              <select
                value={formData.residualRisk.impactScore}
                onChange={(e) => handleInputChange('residualRisk', {
                  ...formData.residualRisk,
                  impactScore: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map(score => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residual Likelihood (1-5)
              </label>
              <select
                value={formData.residualRisk.likelihoodScore}
                onChange={(e) => handleInputChange('residualRisk', {
                  ...formData.residualRisk,
                  likelihoodScore: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map(score => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-md border">
            <div>
              <div className="font-medium text-gray-900">Residual Risk Score</div>
              <div className="text-sm text-gray-600">
                {formData.residualRisk.impactScore} × {formData.residualRisk.likelihoodScore} = {getResidualRiskScore()}
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getResidualRiskLevel().color}`}>
              {getResidualRiskLevel().level} Risk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Review and Submit
const ReviewForm: React.FC<WizardStepProps> = ({
  data,
  onDataChange,
  onValidationChange,
  isActive
}) => {
  const [formData, setFormData] = useState<RiskReviewData>({
    reviewNotes: data.reviewNotes || '',
    approvalRequired: data.approvalRequired || false,
    approver: data.approver || '',
    implementationPlan: data.implementationPlan || '',
    reviewDate: data.reviewDate || ''
  });

  useEffect(() => {
    if (isActive) {
      const errors: Record<string, string> = {};
      
      if (formData.approvalRequired && !formData.approver?.trim()) {
        errors.approver = 'Approver is required when approval is needed';
      }
      if (!formData.reviewDate) {
        errors.reviewDate = 'Review date is required';
      }

      onValidationChange({
        isValid: Object.keys(errors).length === 0,
        errors
      });

      onDataChange(formData);
    }
  }, [formData, isActive, onDataChange, onValidationChange]);

  const handleInputChange = (field: keyof RiskReviewData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRiskScore = () => (data.impactScore || 1) * (data.likelihoodScore || 1);
  const getResidualRiskScore = () => (data.residualRisk?.impactScore || 1) * (data.residualRisk?.likelihoodScore || 1);

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Risk Assessment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Risk Title</div>
            <div className="font-medium">{data.title}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Category</div>
            <div className="font-medium">{data.category}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Initial Risk Score</div>
            <div className="font-medium">{getRiskScore()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Residual Risk Score</div>
            <div className="font-medium">{getResidualRiskScore()}</div>
          </div>
        </div>
      </div>

      {/* Review Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Notes
        </label>
        <textarea
          value={formData.reviewNotes}
          onChange={(e) => handleInputChange('reviewNotes', e.target.value)}
          placeholder="Add any additional notes or observations about this risk assessment"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Approval Requirements */}
      <div>
        <div className="flex items-center space-x-3 mb-3">
          <input
            type="checkbox"
            id="approvalRequired"
            checked={formData.approvalRequired}
            onChange={(e) => handleInputChange('approvalRequired', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="approvalRequired" className="text-sm font-medium text-gray-700">
            This risk assessment requires approval
          </label>
        </div>
        
        {formData.approvalRequired && (
          <input
            type="text"
            value={formData.approver}
            onChange={(e) => handleInputChange('approver', e.target.value)}
            placeholder="Enter approver name or email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>

      {/* Implementation Plan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Implementation Plan
        </label>
        <textarea
          value={formData.implementationPlan}
          onChange={(e) => handleInputChange('implementationPlan', e.target.value)}
          placeholder="Outline the plan for implementing proposed controls and monitoring this risk"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Review Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Next Review Date *
        </label>
        <input
          type="date"
          value={formData.reviewDate}
          onChange={(e) => handleInputChange('reviewDate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

// Main Risk Assessment Wizard
interface RiskAssessmentWizardProps {
  initialData?: Partial<CompleteRiskData>;
  onComplete: (data: CompleteRiskData) => Promise<void>;
  onSave?: (data: Partial<CompleteRiskData>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const wizardSteps = [
  {
    id: 'identification',
    title: 'Risk Identification',
    description: 'Define and categorize the risk',
    component: RiskIdentificationForm,
    icon: RiskManagementIcons.Search
  },
  {
    id: 'assessment',
    title: 'Impact & Likelihood',
    description: 'Assess the risk impact and likelihood',
    component: RiskAssessmentForm,
    icon: DataIcons.BarChart
  },
  {
    id: 'controls',
    title: 'Control Mapping',
    description: 'Map existing and proposed controls',
    component: ControlMappingForm,
    icon: RiskManagementIcons.Shield
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review and finalize the assessment',
    component: ReviewForm,
    icon: StatusIcons.CheckCircle
  }
];

export const RiskAssessmentWizard: React.FC<RiskAssessmentWizardProps> = ({
  initialData = {},
  onComplete,
  onSave,
  onCancel,
  className = ''
}) => {
  return (
    <WizardContainer
      steps={wizardSteps}
      initialData={initialData}
      onComplete={onComplete}
      onSave={onSave}
      onCancel={onCancel}
      title="Risk Assessment Wizard"
      description="Complete a comprehensive risk assessment in 4 simple steps"
      autoSave={true}
      autoSaveInterval={30000}
      allowStepSkipping={false}
      showProgress={true}
      className={className}
    />
  );
};

export default RiskAssessmentWizard; 