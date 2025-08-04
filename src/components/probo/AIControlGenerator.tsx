'use client';

import React, { useState } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Brain, Sparkles, Shield, Target, AlertTriangle, FileCheck } from 'lucide-react';

interface AIControlGeneratorProps {
  riskId: string;
  riskTitle: string;
  riskDescription?: string;
  riskCategory?: string;
  riskSeverity?: 'Critical' | 'High' | 'Medium' | 'Low';
  onControlsGenerated?: (controls: any[], mappings: any[]) => void;
  className?: string;
}

export default function AIControlGenerator({
  riskId,
  riskTitle,
  riskDescription = '',
  riskCategory = 'General',
  riskSeverity = 'Medium',
  onControlsGenerated,
  className = '',
}: AIControlGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateControls = async () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      if (onControlsGenerated) {
        onControlsGenerated([], []);
      }
    }, 2000);
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <DaisyCard className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center gap-3">
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
              <DaisyBadge className="bg-blue-100 text-blue-800 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Probo AI
              </DaisyBadge>
            </div>
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
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
                <DaisyBadge className={getPriorityColor(riskSeverity)}>{riskSeverity}</DaisyBadge>
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
                <p className="font-medium">SOC2</p>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Main Content */}
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Control Generation
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-6">
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Generating Controls...</h3>
              <p className="text-gray-600">
                AI is analyzing your risk and generating appropriate controls.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Generate Controls</h3>
              <p className="text-gray-600 mb-4">
                Click "Generate AI Controls" to start the intelligent control generation process.
              </p>
              <DaisyButton
                onClick={handleGenerateControls}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Controls
              </DaisyButton>
            </div>
          )}
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

// Export the component
export { AIControlGenerator };
