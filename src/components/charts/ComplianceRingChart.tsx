'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Settings
} from 'lucide-react';

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  score: number; // 0-100
  previousScore?: number;
  status: 'compliant' | 'in-progress' | 'needs-review' | 'overdue';
  lastAssessed: Date;
  nextDue: Date;
  criticalGaps: number;
  totalControls: number;
  implementedControls: number;
  color: string;
  icon: React.ComponentType<any>;
}

interface ComplianceRingChartProps {
  data?: ComplianceFramework[];
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  interactive?: boolean;
  onFrameworkClick?: (framework: ComplianceFramework) => void;
  className?: string;
}

const defaultData: ComplianceFramework[] = [
  {
    id: 'sox',
    name: 'Sarbanes-Oxley Act',
    shortName: 'SOX',
    score: 98,
    previousScore: 96,
    status: 'compliant',
    lastAssessed: new Date('2024-01-15'),
    nextDue: new Date('2024-07-15'),
    criticalGaps: 0,
    totalControls: 45,
    implementedControls: 44,
    color: '#10b981', // emerald-500
    icon: Shield
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    shortName: 'ISO',
    score: 85,
    previousScore: 82,
    status: 'in-progress',
    lastAssessed: new Date('2024-01-10'),
    nextDue: new Date('2024-04-10'),
    criticalGaps: 3,
    totalControls: 114,
    implementedControls: 97,
    color: '#3b82f6', // blue-500
    icon: Shield
  },
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation',
    shortName: 'GDPR',
    score: 92,
    previousScore: 94,
    status: 'compliant',
    lastAssessed: new Date('2024-01-12'),
    nextDue: new Date('2024-06-12'),
    criticalGaps: 1,
    totalControls: 32,
    implementedControls: 30,
    color: '#8b5cf6', // violet-500
    icon: Shield
  },
  {
    id: 'hipaa',
    name: 'Health Insurance Portability and Accountability Act',
    shortName: 'HIPAA',
    score: 78,
    previousScore: 75,
    status: 'needs-review',
    lastAssessed: new Date('2024-01-05'),
    nextDue: new Date('2024-03-05'),
    criticalGaps: 5,
    totalControls: 28,
    implementedControls: 22,
    color: '#f59e0b', // amber-500
    icon: Shield
  },
  {
    id: 'pci-dss',
    name: 'Payment Card Industry Data Security Standard',
    shortName: 'PCI DSS',
    score: 88,
    previousScore: 90,
    status: 'in-progress',
    lastAssessed: new Date('2024-01-08'),
    nextDue: new Date('2024-05-08'),
    criticalGaps: 2,
    totalControls: 12,
    implementedControls: 11,
    color: '#ef4444', // red-500
    icon: Shield
  }
];

const statusConfig = {
  compliant: {
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: CheckCircle,
    label: 'Compliant'
  },
  'in-progress': {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: Clock,
    label: 'In Progress'
  },
  'needs-review': {
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: AlertTriangle,
    label: 'Needs Review'
  },
  overdue: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: AlertTriangle,
    label: 'Overdue'
  }
};

export const ComplianceRingChart: React.FC<ComplianceRingChartProps> = ({
  data = defaultData,
  size = 'md',
  showDetails = true,
  interactive = true,
  onFrameworkClick,
  className
}) => {
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});

  const sizeConfig = {
    sm: { radius: 60, strokeWidth: 8, center: 70 },
    md: { radius: 80, strokeWidth: 12, center: 100 },
    lg: { radius: 100, strokeWidth: 16, center: 120 }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;

  // Animate scores on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const scores: Record<string, number> = {};
      data.forEach(framework => {
        scores[framework.id] = framework.score;
      });
      setAnimatedScores(scores);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  const getStrokeDasharray = (score: number) => {
    const animatedScore = animatedScores[data.find(f => f.score === score)?.id || ''] || 0;
    const progress = (animatedScore / 100) * circumference;
    return `${progress} ${circumference}`;
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="w-3 h-3 text-gray-400" />;
    
    if (current > previous) {
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    } else {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendPercentage = (current: number, previous?: number): string => {
    if (!previous || previous === 0) return '0%';
    
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return '#10b981'; // green
    if (score >= 85) return '#3b82f6'; // blue
    if (score >= 75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const overallScore = Math.round(data.reduce((sum, f) => sum + f.score, 0) / data.length);
  const totalGaps = data.reduce((sum, f) => sum + f.criticalGaps, 0);

  return (
    <DaisyCard className={`bg-[#FAFAFA] border-gray-200 ${className}`}>
      <DaisyCardBody >
  <div className="flex items-center justify-between">
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Shield className="h-5 w-5 text-[#199BEC]" />
</DaisyCardTitle>
            Compliance Overview
          </DaisyCardTitle>
          <div className="flex items-center gap-2">
            <DaisyButton variant="outline" size="sm" >
  <Eye className="h-4 w-4 mr-2" />
</DaisyButton>
              View All
            </DaisyButton>
            <DaisyButton variant="outline" size="sm" >
  <Settings className="h-4 w-4" />
</DaisyButton>
            </DaisyButton>
          </div>
        </div>
      
      <DaisyCardBody >
  <div className="space-y-6">
</DaisyCardBody>
          {/* Overall Score Ring */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg
                width={config.center * 2}
                height={config.center * 2}
                className="transform -rotate-90"
              >
                {/* Background circle */}
                <circle
                  cx={config.center}
                  cy={config.center}
                  r={config.radius}
                  stroke="#e5e7eb"
                  strokeWidth={config.strokeWidth}
                  fill="none"
                />
                
                {/* Progress circle */}
                <motion.circle
                  cx={config.center}
                  cy={config.center}
                  r={config.radius}
                  stroke={getScoreColor(overallScore)}
                  strokeWidth={config.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ 
                    strokeDashoffset: circumference - (overallScore / 100) * circumference 
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-[#191919]">
                  {overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall</div>
                <div className="text-xs text-gray-500">Compliance</div>
              </div>
            </div>
          </div>

          {/* Framework Rings Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.map((framework, index) => {
              const StatusIcon = statusConfig[framework.status].icon;
              const isSelected = selectedFramework === framework.id;
              
              return (
                <motion.div
                  key={framework.id}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    interactive ? 'hover:scale-105' : ''
                  } ${isSelected ? 'ring-2 ring-[#199BEC] rounded-lg' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (interactive) {
                      setSelectedFramework(isSelected ? null : framework.id);
                      onFrameworkClick?.(framework);
                    }
                  }}
                >
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
                    {/* Mini Ring Chart */}
                    <div className="relative mx-auto mb-3" style={{ width: 80, height: 80 }}>
                      <svg width={80} height={80} className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                          cx={40}
                          cy={40}
                          r={30}
                          stroke="#e5e7eb"
                          strokeWidth={6}
                          fill="none"
                        />
                        
                        {/* Progress circle */}
                        <motion.circle
                          cx={40}
                          cy={40}
                          r={30}
                          stroke={framework.color}
                          strokeWidth={6}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 30}
                          initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                          animate={{ 
                            strokeDashoffset: 2 * Math.PI * 30 - (framework.score / 100) * 2 * Math.PI * 30 
                          }}
                          transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                        />
                      </svg>
                      
                      {/* Center score */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-lg font-bold text-[#191919]">
                          {framework.score}%
                        </div>
                      </div>
                    </div>

                    {/* Framework Info */}
                    <div className="space-y-2">
                      <div className="font-semibold text-sm text-[#191919]">
                        {framework.shortName}
                      </div>
                      
                      <div className="flex items-center justify-center gap-1">
                        <StatusIcon 
                          className="w-3 h-3" 
                          style={{ color: statusConfig[framework.status].color }}
                        />
                        <DaisyBadge 
                          variant="secondary"
                          className="text-xs"
                          style={{ 
                            backgroundColor: statusConfig[framework.status].bgColor,
                            color: statusConfig[framework.status].color
                          }}
                        >
                          {statusConfig[framework.status].label}
                        </DaisyBadge>
                      </div>

                      {/* Trend Indicator */}
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {getTrendIcon(framework.score, framework.previousScore)}
                        <span className="text-gray-500">
                          {getTrendPercentage(framework.score, framework.previousScore)}
                        </span>
                      </div>

                      {/* Critical Gaps */}
                      {framework.criticalGaps > 0 && (
                        <div className="text-xs text-red-600 font-medium">
                          {framework.criticalGaps} gaps
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detailed View */}
          {showDetails && selectedFramework && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg border border-gray-100 p-4"
            >
              {(() => {
                const framework = data.find(f => f.id === selectedFramework);
                if (!framework) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#191919]">{framework.name}</h3>
                      <DaisyButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFramework(null)} />
                        ×
                      </DaisyButton>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#191919]">
                          {framework.score}%
                        </div>
                        <div className="text-sm text-gray-600">Current Score</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#191919]">
                          {framework.implementedControls}/{framework.totalControls}
                        </div>
                        <div className="text-sm text-gray-600">Controls</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {framework.criticalGaps}
                        </div>
                        <div className="text-sm text-gray-600">Critical Gaps</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-bold text-[#191919]">
                          {framework.nextDue.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">Next Due</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Implementation Progress</span>
                        <span>{Math.round((framework.implementedControls / framework.totalControls) * 100)}%</span>
                      </div>
                      <DaisyProgress 
                        value={(framework.implementedControls / framework.totalControls) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-[#191919]">
                {data.filter(f => f.status === 'compliant').length}
              </div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-orange-600">
                {totalGaps}
              </div>
              <div className="text-sm text-gray-600">Total Gaps</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">
                {data.filter(f => f.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>
      </DaisyProgress>
    </DaisyCard>
  );
}; 