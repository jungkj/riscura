'use client';

import React, { useState, useEffect, Fragment } from 'react';
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
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real risks from API
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await fetch('/api/risks');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setRisks(data.data);
          }
        }
      } catch (error) {
        // console.error('Failed to fetch risks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, []);

  // Keep sample risks for development/demo mode
  const sampleRisks: Risk[] = [
    // Very High Impact, Very likely (2 risks)
    {
      id: 'RSK-001',
      title: 'Critical System Failure',
      description:
        'Complete failure of core business systems leading to operational shutdown and significant revenue loss.',
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
      description:
        'Large-scale unauthorized access to customer data resulting in regulatory fines and reputational damage.',
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
      description:
        'Failure to meet new regulatory requirements resulting in significant penalties and operational restrictions.',
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

  // Use real risks if available, otherwise use empty data
  const activeRisks = risks.length > 0 ? risks : [];

  // Generate heat map data from actual risks
  const generateHeatMapData = (): HeatMapData[] => {
    const data: HeatMapData[] = [];
    const impactLevels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
    const likelihoodLevels = [
      'Very unlikely',
      'Unlikely',
      'Somewhat unlikely',
      'Likely',
      'Very likely',
    ];

    impactLevels.forEach((impact, impactIndex) => {
      likelihoodLevels.forEach((likelihood, likelihoodIndex) => {
        const impactValue = 5 - impactIndex;
        const likelihoodValue = likelihoodIndex + 1;

        const count = activeRisks.filter(
          (risk) => risk.impact === impactValue && risk.likelihood === likelihoodValue
        ).length;

        // Determine risk level based on impact and likelihood
        let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
        const score = impactValue * likelihoodValue;
        if (score >= 20) level = 'critical';
        else if (score >= 12) level = 'high';
        else if (score >= 6) level = 'medium';

        data.push({ impact, likelihood, count, level });
      });
    });

    return data;
  };

  const heatMapData = generateHeatMapData();

  // Keep sample data for demo/development
  const sampleHeatMapData: HeatMapData[] = [
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
  const likelihoodLevels = [
    'Very unlikely',
    'Unlikely',
    'Somewhat unlikely',
    'Likely',
    'Very likely',
  ];

  const getCellData = (impact: string, likelihood: string) => {
    return heatMapData.find((d) => d.impact === impact && d.likelihood === likelihood);
  };

  const getCellColor = (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return 'bg-red-500 text-white border-red-600';
      case 'high':
        return 'bg-red-300 text-red-900 border-red-400';
      case 'medium':
        return 'bg-orange-400 text-white border-orange-500';
      case 'low':
      default:
        return 'bg-green-400 text-white border-green-500';
    }
  };

  // Map impact and likelihood text to numeric values for filtering risks
  const getImpactValue = (impact: string): number => {
    switch (impact) {
      case 'Very High':
        return 5;
      case 'High':
        return 4;
      case 'Medium':
        return 3;
      case 'Low':
        return 2;
      case 'Very Low':
        return 1;
      default:
        return 1;
    }
  };

  const getLikelihoodValue = (likelihood: string): number => {
    switch (likelihood) {
      case 'Very likely':
        return 5;
      case 'Likely':
        return 4;
      case 'Somewhat unlikely':
        return 3;
      case 'Unlikely':
        return 2;
      case 'Very unlikely':
        return 1;
      default:
        return 1;
    }
  };

  const getRisksForCell = (impact: string, likelihood: string): Risk[] => {
    const impactValue = getImpactValue(impact);
    const likelihoodValue = getLikelihoodValue(likelihood);

    return activeRisks.filter(
      (risk) => risk.impact === impactValue && risk.likelihood === likelihoodValue
    );
  };

  const handleCellClick = (impact: string, likelihood: string) => {
    const risks = getRisksForCell(impact, likelihood);
    setSelectedCell({ impact, likelihood, risks });
  };

  // Simplified level labels for compact display
  const compactImpactLabels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
  const compactLikelihoodLabels = [
    'Very unlikely',
    'Unlikely',
    'Somewhat unlikely',
    'Likely',
    'Very likely',
  ];

  // Calculate total risks from heatMapData
  const totalRisks = heatMapData.reduce((sum, cell) => sum + cell.count, 0);

  return (
    <Fragment>
      <DaisyCard className={`${className} bg-white border border-gray-200`}>
        <DaisyCardBody className="pb-4">
          <DaisyCardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Risk Heat Map</h2>
                <p className="text-sm text-gray-500 font-normal">
                  {loading
                    ? 'Loading risks...'
                    : totalRisks === 0
                      ? 'No risks yet - add your first risk to see it here'
                      : 'Interactive risk assessment matrix'}
                </p>
              </div>
            </div>
            <DaisyBadge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
              {totalRisks} Total Risks
            </DaisyBadge>
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="pb-4">
          <div className="space-y-3">
            {/* Compact Heat Map Grid */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                {/* Y-axis Label (Impact) */}
                <div className="flex items-center justify-center">
                  <div className="transform -rotate-90 text-sm font-bold text-gray-800 whitespace-nowrap">
                    Impact Level
                  </div>
                </div>

                {/* Grid Container */}
                <div className="flex-1 min-w-0">
                  {/* Header Row - Likelihood */}
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    <div className="h-4" />
                    {compactLikelihoodLabels.map((likelihood) => (
                      <div key={likelihood} className="flex justify-center">
                        <div className="text-center text-sm font-bold text-gray-800 px-1 py-1 w-full">
                          <div className="truncate" title={likelihood}>
                            {likelihood.split(' ')[0]}
                            {likelihood.includes('unlikely') && <br />}
                            {likelihood.includes('unlikely') && 'unlikely'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Data Rows */}
                  {compactImpactLabels.map((impact) => (
                    <div key={impact} className="grid grid-cols-6 gap-2 mb-2">
                      {/* Impact Label */}
                      <div className="text-center flex items-center justify-center">
                        <div
                          className="text-sm font-bold text-gray-800 px-2 py-1 w-full text-center"
                          title={impact}
                        >
                          {impact.split(' ')[0]}
                          {impact.includes(' ') && <br />}
                          {impact.split(' ')[1]}
                        </div>
                      </div>

                      {/* Data Cells */}
                      {compactLikelihoodLabels.map((likelihood) => {
                        const cellData = getCellData(impact, likelihood);
                        return (
                          <div key={`${impact}-${likelihood}`} className="flex justify-center">
                            <div
                              className={`
                                w-20 h-20 text-center font-bold text-xl rounded-lg border
                              ${cellData ? getCellColor(cellData.level) : 'bg-gray-100 text-gray-400 border-gray-200'}
                                hover:scale-105 hover:shadow-sm
                                transition-all duration-150 cursor-pointer
                                flex items-center justify-center
                            `}
                              title={`${impact} Impact, ${likelihood} Likelihood: ${cellData?.count || 0} risks`}
                              onClick={() => handleCellClick(impact, likelihood)}
                            >
                              {cellData?.count || 0}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis Label - Centered */}
              <div className="text-center mt-3">
                <div className="inline-block text-sm font-bold text-gray-800">Likelihood Level</div>
              </div>
            </div>

            {/* Risk Level Legend - Moved to Bottom */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="text-center mb-3">
                <div className="text-sm font-bold text-gray-800">Risk Levels</div>
              </div>
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-400 rounded border border-green-500" />
                  <span className="text-xs font-medium text-gray-700">Low</span>
                  <DaisyBadge
                    variant="secondary"
                    className="text-xs px-1 py-0 h-4 bg-green-100 text-green-800"
                  >
                    {heatMapData
                      .filter((d) => d.level === 'low')
                      .reduce((sum, d) => sum + d.count, 0)}
                  </DaisyBadge>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-400 rounded border border-orange-500" />
                  <span className="text-xs font-medium text-gray-700">Medium</span>
                  <DaisyBadge
                    variant="secondary"
                    className="text-xs px-1 py-0 h-4 bg-orange-100 text-orange-800"
                  >
                    {heatMapData
                      .filter((d) => d.level === 'medium')
                      .reduce((sum, d) => sum + d.count, 0)}
                  </DaisyBadge>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-300 rounded border border-red-400" />
                  <span className="text-xs font-medium text-gray-700">High</span>
                  <DaisyBadge
                    variant="secondary"
                    className="text-xs px-1 py-0 h-4 bg-red-100 text-red-800"
                  >
                    {heatMapData
                      .filter((d) => d.level === 'high')
                      .reduce((sum, d) => sum + d.count, 0)}
                  </DaisyBadge>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded border border-red-600" />
                  <span className="text-xs font-medium text-gray-700">Critical</span>
                  <DaisyBadge variant="error" className="text-xs px-1 py-0 h-4">
                    {heatMapData
                      .filter((d) => d.level === 'critical')
                      .reduce((sum, d) => sum + d.count, 0)}
                  </DaisyBadge>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-xs text-gray-500">Click any cell to view risks</div>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Risk Details Modal */}
      <RiskDetailsModal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        risks={selectedCell?.risks || []}
        impact={selectedCell?.impact || ''}
        likelihood={selectedCell?.likelihood || ''}
      />
    </Fragment>
  );
};
