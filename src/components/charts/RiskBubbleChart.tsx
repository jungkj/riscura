'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Target, 
  Filter, 
  Maximize2, 
  Info,
  AlertTriangle,
  Shield,
  Zap
} from 'lucide-react';

interface RiskItem {
  id: string;
  title: string;
  category: 'operational' | 'financial' | 'strategic' | 'compliance' | 'technology';
  impact: number; // 1-5 scale
  likelihood: number; // 1-5 scale
  riskScore: number; // calculated risk score
  status: 'open' | 'mitigated' | 'monitoring' | 'closed';
  owner: string;
  lastUpdated: Date;
}

interface RiskBubbleChartProps {
  data?: RiskItem[];
  height?: number;
  showLegend?: boolean;
  interactive?: boolean;
  onRiskClick?: (risk: RiskItem) => void;
  className?: string;
}

const defaultData: RiskItem[] = [
  {
    id: 'risk-001',
    title: 'Data Breach Vulnerability',
    category: 'technology',
    impact: 5,
    likelihood: 3,
    riskScore: 15,
    status: 'open',
    owner: 'IT Security Team',
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: 'risk-002',
    title: 'Regulatory Compliance Gap',
    category: 'compliance',
    impact: 4,
    likelihood: 4,
    riskScore: 16,
    status: 'monitoring',
    owner: 'Compliance Team',
    lastUpdated: new Date('2024-01-14')
  },
  {
    id: 'risk-003',
    title: 'Market Volatility Impact',
    category: 'financial',
    impact: 3,
    likelihood: 4,
    riskScore: 12,
    status: 'mitigated',
    owner: 'Finance Team',
    lastUpdated: new Date('2024-01-13')
  },
  {
    id: 'risk-004',
    title: 'Supply Chain Disruption',
    category: 'operational',
    impact: 4,
    likelihood: 2,
    riskScore: 8,
    status: 'monitoring',
    owner: 'Operations Team',
    lastUpdated: new Date('2024-01-12')
  },
  {
    id: 'risk-005',
    title: 'Strategic Partnership Risk',
    category: 'strategic',
    impact: 3,
    likelihood: 3,
    riskScore: 9,
    status: 'open',
    owner: 'Strategy Team',
    lastUpdated: new Date('2024-01-11')
  },
  {
    id: 'risk-006',
    title: 'System Downtime Risk',
    category: 'technology',
    impact: 2,
    likelihood: 3,
    riskScore: 6,
    status: 'mitigated',
    owner: 'IT Operations',
    lastUpdated: new Date('2024-01-10')
  },
  {
    id: 'risk-007',
    title: 'Fraud Detection Gap',
    category: 'financial',
    impact: 4,
    likelihood: 2,
    riskScore: 8,
    status: 'open',
    owner: 'Risk Management',
    lastUpdated: new Date('2024-01-09')
  },
  {
    id: 'risk-008',
    title: 'Talent Retention Risk',
    category: 'operational',
    impact: 3,
    likelihood: 4,
    riskScore: 12,
    status: 'monitoring',
    owner: 'HR Team',
    lastUpdated: new Date('2024-01-08')
  }
];

const categoryColors = {
  operational: '#f59e0b', // amber
  financial: '#ef4444', // red
  strategic: '#8b5cf6', // violet
  compliance: '#10b981', // emerald
  technology: '#3b82f6' // blue
};

const categoryIcons = {
  operational: Shield,
  financial: Target,
  strategic: Zap,
  compliance: AlertTriangle,
  technology: Info
};

const statusColors = {
  open: '#ef4444',
  mitigated: '#10b981',
  monitoring: '#f59e0b',
  closed: '#6b7280'
};

export const RiskBubbleChart: React.FC<RiskBubbleChartProps> = ({
  data = defaultData,
  height = 400,
  showLegend = true,
  interactive = true,
  onRiskClick,
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredRisk, setHoveredRisk] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!selectedCategory) return data;
    return data.filter(risk => risk.category === selectedCategory);
  }, [data, selectedCategory]);

  const categories = useMemo(() => {
    const categoryStats = data.reduce((acc, risk) => {
      if (!acc[risk.category]) {
        acc[risk.category] = { count: 0, totalScore: 0 };
      }
      acc[risk.category].count++;
      acc[risk.category].totalScore += risk.riskScore;
      return acc;
    }, {} as Record<string, { count: number; totalScore: number }>);

    return Object.entries(categoryStats).map(([category, stats]) => ({
      name: category,
      count: stats.count,
      avgScore: Math.round(stats.totalScore / stats.count),
      color: categoryColors[category as keyof typeof categoryColors]
    }));
  }, [data]);

  const getBubbleSize = (impact: number) => {
    return Math.max(20, impact * 8); // Min 20px, max 40px
  };

  const getPosition = (likelihood: number, impact: number, index: number) => {
    // Add slight randomization to prevent overlapping
    const jitter = (index % 3 - 1) * 5;
    const x = (likelihood - 1) * 20 + 10 + jitter; // 10-90% range
    const y = 90 - (impact - 1) * 20 + jitter; // Inverted Y (high impact at top)
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 15) return 'Critical';
    if (riskScore >= 12) return 'High';
    if (riskScore >= 8) return 'Medium';
    return 'Low';
  };

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore >= 15) return '#dc2626'; // red-600
    if (riskScore >= 12) return '#ea580c'; // orange-600
    if (riskScore >= 8) return '#ca8a04'; // yellow-600
    return '#16a34a'; // green-600
  };

  return (
    <Card 
      className={`bg-[#FAFAFA] border-gray-200 chart-container ${className}`}
      role="img"
      aria-labelledby="risk-bubble-chart-title"
      aria-describedby="risk-bubble-chart-description"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle 
              id="risk-bubble-chart-title"
              className="flex items-center gap-2 chart-title text-contrast-medium"
            >
              <Target className="h-5 w-5 text-[#199BEC]" aria-hidden="true" />
              Risk at a Glance
            </CardTitle>
            <p 
              id="risk-bubble-chart-description"
              className="text-sm text-contrast-low chart-description mt-1"
            >
              Interactive risk assessment showing {filteredData.length} risks by impact and likelihood. 
              Bubble size represents risk score. Use keyboard navigation to explore risks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-[#199BEC] text-white' : ''}
              aria-label="Show all risk categories"
            >
              All
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              aria-label="Filter risks"
            >
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              Filter
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              aria-label="Expand chart to full screen"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Category Legend */}
          {showLegend && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons];
                return (
                  <Button
                    key={category.name}
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.name ? null : category.name
                    )}
                    className={`flex items-center gap-2 ${
                      selectedCategory === category.name ? 'bg-[#199BEC] text-white' : ''
                    }`}
                    aria-label={`${selectedCategory === category.name ? 'Hide' : 'Show only'} ${category.name} risks. ${category.count} risks in this category.`}
                    aria-pressed={selectedCategory === category.name}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <IconComponent className="h-3 w-3" />
                    <span className="capitalize">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Bubble Chart */}
          <div className="relative bg-white rounded-lg border border-gray-100 p-4" style={{ height }}>
            {/* Grid Lines */}
            <div className="absolute inset-4">
              {/* Vertical grid lines */}
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={`v-${i}`}
                  className="absolute top-0 bottom-0 border-l border-gray-100"
                  style={{ left: `${(i - 1) * 20 + 10}%` }}
                />
              ))}
              {/* Horizontal grid lines */}
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: `${90 - (i - 1) * 20}%` }}
                />
              ))}
            </div>

            {/* Axis Labels */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600">
              Likelihood →
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600">
              Impact →
            </div>

            {/* Risk Level Zones */}
            <div className="absolute inset-4 pointer-events-none">
              {/* High Risk Zone (top-right) */}
              <div className="absolute top-0 right-0 w-2/5 h-2/5 bg-red-50 rounded opacity-30" />
              <div className="absolute top-2 right-2 text-xs font-medium text-red-600">
                High Risk
              </div>
              
              {/* Medium Risk Zone (middle) */}
              <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-yellow-50 rounded opacity-30" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-yellow-600">
                Medium
              </div>
              
              {/* Low Risk Zone (bottom-left) */}
              <div className="absolute bottom-0 left-0 w-2/5 h-2/5 bg-green-50 rounded opacity-30" />
              <div className="absolute bottom-2 left-2 text-xs font-medium text-green-600">
                Low Risk
              </div>
            </div>

            {/* Risk Bubbles */}
            <TooltipProvider>
              {filteredData.map((risk, index) => {
                const position = getPosition(risk.likelihood, risk.impact, index);
                const size = getBubbleSize(risk.impact);
                const IconComponent = categoryIcons[risk.category];
                
                return (
                  <Tooltip key={risk.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 chart-element interactive-element focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-interactive-focus ${
                          interactive ? 'hover:scale-110' : ''
                        }`}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          width: size,
                          height: size
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: hoveredRisk === risk.id ? 1.2 : 1, 
                          opacity: 1 
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20,
                          delay: index * 0.1 
                        }}
                        onHoverStart={() => setHoveredRisk(risk.id)}
                        onHoverEnd={() => setHoveredRisk(null)}
                        onClick={() => onRiskClick?.(risk)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRiskClick?.(risk);
                          }
                        }}
                        aria-label={`${risk.title}. ${risk.category} risk. Impact: ${risk.impact}/5, Likelihood: ${risk.likelihood}/5, Risk Score: ${risk.riskScore}. Status: ${risk.status}. Owner: ${risk.owner}.`}
                        tabIndex={0}
                      >
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                          style={{
                            backgroundColor: categoryColors[risk.category],
                            opacity: selectedCategory && selectedCategory !== risk.category ? 0.3 : 0.8
                          }}
                        >
                          <IconComponent className="h-4 w-4 text-white" aria-hidden="true" />
                        </div>
                        
                        {/* Risk Score Badge */}
                        <div 
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: getRiskLevelColor(risk.riskScore) }}
                          aria-hidden="true"
                        >
                          {risk.riskScore}
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="font-semibold">{risk.title}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-1 capitalize">{risk.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Risk Level:</span>
                            <span className="ml-1 font-medium" style={{ color: getRiskLevelColor(risk.riskScore) }}>
                              {getRiskLevel(risk.riskScore)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Impact:</span>
                            <span className="ml-1">{risk.impact}/5</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Likelihood:</span>
                            <span className="ml-1">{risk.likelihood}/5</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Owner:</span>
                          <span className="ml-1">{risk.owner}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: statusColors[risk.status] + '20', color: statusColors[risk.status] }}
                          >
                            {risk.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Updated {risk.lastUpdated.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>

            {/* Scale Indicators */}
            <div className="absolute bottom-2 left-4 text-xs text-gray-500">
              1 (Low)
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-gray-500">
              5 (High)
            </div>
            <div className="absolute top-2 left-2 text-xs text-gray-500 transform -rotate-90 origin-left">
              5 (High)
            </div>
            <div className="absolute bottom-8 left-2 text-xs text-gray-500 transform -rotate-90 origin-left">
              1 (Low)
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-red-600">
                {filteredData.filter(r => r.riskScore >= 15).length}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-orange-600">
                {filteredData.filter(r => r.riskScore >= 12 && r.riskScore < 15).length}
              </div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredData.filter(r => r.riskScore >= 8 && r.riskScore < 12).length}
              </div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-green-600">
                {filteredData.filter(r => r.riskScore < 8).length}
              </div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>

          {/* Data Table for Screen Readers */}
          <table 
            className="chart-data-table"
            tabIndex={0}
            aria-label="Risk data table - alternative representation of the bubble chart"
          >
            <caption className="sr-only">
              Risk assessment data showing {filteredData.length} risks with their impact, likelihood, and risk scores
            </caption>
            <thead>
              <tr>
                <th scope="col">Risk Title</th>
                <th scope="col">Category</th>
                <th scope="col">Impact (1-5)</th>
                <th scope="col">Likelihood (1-5)</th>
                <th scope="col">Risk Score</th>
                <th scope="col">Risk Level</th>
                <th scope="col">Status</th>
                <th scope="col">Owner</th>
                <th scope="col">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((risk) => (
                <tr key={risk.id}>
                  <td>{risk.title}</td>
                  <td className="capitalize">{risk.category}</td>
                  <td>{risk.impact}</td>
                  <td>{risk.likelihood}</td>
                  <td>{risk.riskScore}</td>
                  <td>{getRiskLevel(risk.riskScore)}</td>
                  <td className="capitalize">{risk.status}</td>
                  <td>{risk.owner}</td>
                  <td>{risk.lastUpdated.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}; 