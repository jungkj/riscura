'use client';

import React, { useState } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Target } from 'lucide-react';
import { RiskDetailsModal } from './risk-details-modal';

interface HeatMapData {
  impact: string;
  likelihood: string;
  count: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'closed';
  createdAt: string;
  updatedAt: string;
  nextReview?: Date;
}

interface RiskHeatMapProps {
  className?: string;
}

export const RiskHeatMap: React.FC<RiskHeatMapProps> = ({ className = '' }) => {
  const [selectedCell, setSelectedCell] = useState<{
    impact: string;
    likelihood: string;
    risks: Risk[];
  } | null>(null);

  // Sample risk data mapped to heatmap categories
  const sampleRisks: Risk[] = [
    // Very High Impact, Very likely (2 risks)
    {
      id: 'RSK-001',
      title: 'Critical System Failure',
      description: 'Complete failure of core business systems leading to operational shutdown and significant revenue loss.',
      category: 'Technology',
      likelihood: 5,
      impact: 5,
      riskScore: 25,
      riskLevel: 'critical',
      owner: 'IT Director',
      status: 'identified',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
    },
    {
      id: 'RSK-002',
      title: 'Major Data Breach',
      description: 'Large-scale unauthorized access to customer data resulting in regulatory fines and reputational damage.',
      category: 'Security',
      likelihood: 5,
      impact: 5,
      riskScore: 25,
      riskLevel: 'critical',
      owner: 'CISO',
      status: 'assessed',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-22T11:15:00Z',
    },
    // Very High Impact, Likely (3 risks)
    {
      id: 'RSK-003',
      title: 'Regulatory Non-Compliance',
      description: 'Failure to meet new regulatory requirements resulting in significant penalties and operational restrictions.',
      category: 'Compliance',
      likelihood: 4,
      impact: 5,
      riskScore: 20,
      riskLevel: 'critical',
      owner: 'Compliance Officer',
      status: 'mitigated',
      createdAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-25T16:45:00Z',
    },
    {
      id: 'RSK-004',
      title: 'Supply Chain Disruption',
      description: 'Critical supplier failure affecting production and delivery capabilities.',
      category: 'Operational',
      likelihood: 4,
      impact: 5,
      riskScore: 20,
      riskLevel: 'critical',
      owner: 'Supply Chain Manager',
      status: 'identified',
      createdAt: '2024-01-12T12:00:00Z',
      updatedAt: '2024-01-23T10:20:00Z',
    },
    {
      id: 'RSK-005',
      title: 'Key Personnel Loss',
      description: 'Departure of critical leadership or specialized technical staff.',
      category: 'Human Resources',
      likelihood: 4,
      impact: 5,
      riskScore: 20,
      riskLevel: 'critical',
      owner: 'HR Director',
      status: 'assessed',
      createdAt: '2024-01-08T14:00:00Z',
      updatedAt: '2024-01-21T09:30:00Z',
    },
    // High Impact, Likely (4 risks)
    {
      id: 'RSK-006',
      title: 'Market Competition Risk',
      description: 'Increased competition leading to market share loss and reduced profitability.',
      category: 'Strategic',
      likelihood: 4,
      impact: 4,
      riskScore: 16,
      riskLevel: 'high',
      owner: 'Strategy Director',
      status: 'identified',
      createdAt: '2024-01-14T11:00:00Z',
      updatedAt: '2024-01-24T13:15:00Z',
    },
    {
      id: 'RSK-007',
      title: 'Financial Fraud Risk',
      description: 'Internal or external fraud affecting financial assets and reporting accuracy.',
      category: 'Financial',
      likelihood: 4,
      impact: 4,
      riskScore: 16,
      riskLevel: 'high',
      owner: 'CFO',
      status: 'mitigated',
      createdAt: '2024-01-11T15:00:00Z',
      updatedAt: '2024-01-26T12:00:00Z',
    },
    {
      id: 'RSK-008',
      title: 'Product Quality Issues',
      description: 'Manufacturing defects or quality control failures leading to recalls.',
      category: 'Operational',
      likelihood: 4,
      impact: 4,
      riskScore: 16,
      riskLevel: 'high',
      owner: 'Quality Manager',
      status: 'assessed',
      createdAt: '2024-01-09T10:30:00Z',
      updatedAt: '2024-01-27T14:45:00Z',
    },
    {
      id: 'RSK-009',
      title: 'Customer Data Privacy',
      description: 'Inadequate privacy controls leading to customer data misuse.',
      category: 'Privacy',
      likelihood: 4,
      impact: 4,
      riskScore: 16,
      riskLevel: 'high',
      owner: 'Privacy Officer',
      status: 'identified',
      createdAt: '2024-01-13T16:00:00Z',
      updatedAt: '2024-01-28T11:30:00Z',
    },
    // Medium Impact, Likely (4 risks)
    {
      id: 'RSK-010',
      title: 'Vendor Performance Issues',
      description: 'Third-party vendor underperformance affecting service delivery.',
      category: 'Vendor Management',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: 'medium',
      owner: 'Procurement Manager',
      status: 'mitigated',
      createdAt: '2024-01-16T09:15:00Z',
      updatedAt: '2024-01-29T15:20:00Z',
    },
    {
      id: 'RSK-011',
      title: 'Technology Obsolescence',
      description: 'Legacy systems becoming outdated and unsupported.',
      category: 'Technology',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: 'medium',
      owner: 'IT Manager',
      status: 'assessed',
      createdAt: '2024-01-17T13:45:00Z',
      updatedAt: '2024-01-30T10:10:00Z',
    },
    {
      id: 'RSK-012',
      title: 'Employee Training Gaps',
      description: 'Insufficient training leading to operational errors and compliance issues.',
      category: 'Human Resources',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: 'medium',
      owner: 'Training Manager',
      status: 'identified',
      createdAt: '2024-01-18T11:20:00Z',
      updatedAt: '2024-01-31T14:35:00Z',
    },
    {
      id: 'RSK-013',
      title: 'Environmental Compliance',
      description: 'Potential environmental violations due to operational changes.',
      category: 'Environmental',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: 'medium',
      owner: 'Environmental Manager',
      status: 'closed',
      createdAt: '2024-01-19T08:30:00Z',
      updatedAt: '2024-02-01T16:50:00Z',
    },
  ];

  // Sample data - in a real app, this would come from props or API
  const heatMapData: HeatMapData[] = [
    // Very High Impact
    { impact: 'Very High', likelihood: 'Very unlikely', count: 1, level: 'low' },
    { impact: 'Very High', likelihood: 'Unlikely', count: 1, level: 'medium' },
    { impact: 'Very High', likelihood: 'Somewhat unlikely', count: 1, level: 'high' },
    { impact: 'Very High', likelihood: 'Likely', count: 3, level: 'critical' },
    { impact: 'Very High', likelihood: 'Very likely', count: 2, level: 'critical' },
    
    // High Impact
    { impact: 'High', likelihood: 'Very unlikely', count: 3, level: 'low' },
    { impact: 'High', likelihood: 'Unlikely', count: 1, level: 'low' },
    { impact: 'High', likelihood: 'Somewhat unlikely', count: 1, level: 'medium' },
    { impact: 'High', likelihood: 'Likely', count: 4, level: 'high' },
    { impact: 'High', likelihood: 'Very likely', count: 1, level: 'critical' },
    
    // Medium Impact
    { impact: 'Medium', likelihood: 'Very unlikely', count: 1, level: 'low' },
    { impact: 'Medium', likelihood: 'Unlikely', count: 2, level: 'low' },
    { impact: 'Medium', likelihood: 'Somewhat unlikely', count: 3, level: 'low' },
    { impact: 'Medium', likelihood: 'Likely', count: 4, level: 'medium' },
    { impact: 'Medium', likelihood: 'Very likely', count: 3, level: 'high' },
    
    // Low Impact
    { impact: 'Low', likelihood: 'Very unlikely', count: 2, level: 'low' },
    { impact: 'Low', likelihood: 'Unlikely', count: 1, level: 'low' },
    { impact: 'Low', likelihood: 'Somewhat unlikely', count: 3, level: 'low' },
    { impact: 'Low', likelihood: 'Likely', count: 1, level: 'low' },
    { impact: 'Low', likelihood: 'Very likely', count: 1, level: 'medium' },
    
    // Very Low Impact
    { impact: 'Very Low', likelihood: 'Very unlikely', count: 4, level: 'low' },
    { impact: 'Very Low', likelihood: 'Unlikely', count: 7, level: 'low' },
    { impact: 'Very Low', likelihood: 'Somewhat unlikely', count: 2, level: 'low' },
    { impact: 'Very Low', likelihood: 'Likely', count: 1, level: 'low' },
    { impact: 'Very Low', likelihood: 'Very likely', count: 4, level: 'low' },
  ];

  const impactLevels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
  const likelihoodLevels = ['Very unlikely', 'Unlikely', 'Somewhat unlikely', 'Likely', 'Very likely'];

  const getCellData = (impact: string, likelihood: string) => {
    return heatMapData.find(d => d.impact === impact && d.likelihood === likelihood);
  };

  const getCellColor = (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-red-400 text-white';
      case 'medium':
        return 'bg-yellow-400 text-gray-900';
      case 'low':
      default:
        return 'bg-green-500 text-white';
    }
  };

  // Map impact and likelihood text to numeric values for filtering risks
  const getImpactValue = (impact: string): number => {
    switch (impact) {
      case 'Very High': return 5;
      case 'High': return 4;
      case 'Medium': return 3;
      case 'Low': return 2;
      case 'Very Low': return 1;
      default: return 1;
    }
  };

  const getLikelihoodValue = (likelihood: string): number => {
    switch (likelihood) {
      case 'Very likely': return 5;
      case 'Likely': return 4;
      case 'Somewhat unlikely': return 3;
      case 'Unlikely': return 2;
      case 'Very unlikely': return 1;
      default: return 1;
    }
  };

  const getRisksForCell = (impact: string, likelihood: string): Risk[] => {
    const impactValue = getImpactValue(impact);
    const likelihoodValue = getLikelihoodValue(likelihood);
    
    return sampleRisks.filter(risk => 
      risk.impact === impactValue && risk.likelihood === likelihoodValue
    );
  };

  const handleCellClick = (impact: string, likelihood: string) => {
    const risks = getRisksForCell(impact, likelihood);
    setSelectedCell({ impact, likelihood, risks });
  };

  return (
    <>
      <DaisyCard className={className}>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Inherent Risk Heat Map
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
          <div className="space-y-4">
            {/* Heat Map Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px] flex">
                {/* Y-axis Label (Impact) - Reduced margin */}
                <div className="flex items-center justify-center mr-2">
                  <div className="transform -rotate-90 text-sm font-medium text-gray-600 whitespace-nowrap">
                    Impact
                  </div>
                </div>
                
                {/* Grid Container */}
                <div className="flex-1">
                  {/* Header Row - Likelihood */}
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    <div className="p-2"></div>
                    {likelihoodLevels.map((likelihood) => (
                      <div key={likelihood} className="p-2 text-center text-sm font-medium text-gray-600">
                        {likelihood}
                      </div>
                    ))}
                  </div>
                  
                  {/* Data Rows */}
                  {impactLevels.map((impact) => (
                    <div key={impact} className="grid grid-cols-6 gap-1 mb-1">
                      {/* Impact Label */}
                      <div className="p-2 text-right text-sm font-medium text-gray-600 flex items-center justify-end">
                        {impact}
                      </div>
                      
                      {/* Data Cells */}
                      {likelihoodLevels.map((likelihood) => {
                        const cellData = getCellData(impact, likelihood);
                        return (
                          <div
                            key={`${impact}-${likelihood}`}
                            className={`
                              p-4 text-center font-bold text-lg rounded border border-white
                              ${cellData ? getCellColor(cellData.level) : 'bg-gray-100 text-gray-400'}
                              hover:opacity-80 hover:scale-105 transition-all duration-200 cursor-pointer
                              ${cellData && cellData.count > 0 ? 'hover:shadow-lg' : ''}
                            `}
                            title={`${impact} Impact, ${likelihood} Likelihood: ${cellData?.count || 0} risks - Click to view details`}
                            onClick={() => handleCellClick(impact, likelihood)}
                          >
                            {cellData?.count || 0}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* X-axis Label */}
            <div className="text-center text-sm font-medium text-gray-600 mb-4">
              Likelihood
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-sm font-medium">Critical</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span className="text-sm font-medium">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-sm font-medium">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium">Low</span>
              </div>
            </div>
          </div>
        </DaisyCardContent>
      </DaisyCard>

      {/* Risk Details Modal */}
      <RiskDetailsModal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        risks={selectedCell?.risks || []}
        impact={selectedCell?.impact || ''}
        likelihood={selectedCell?.likelihood || ''}
      />
    </>
  );
}; 