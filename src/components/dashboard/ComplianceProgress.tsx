'use client';

import { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  FileText,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  progress: number;
  totalControls: number;
  completedControls: number;
  status: 'on-track' | 'at-risk' | 'behind';
  nextDeadline: string;
  lastAssessment: string;
  color: string;
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function ProgressRing({ progress, size = 80, strokeWidth = 8, color = '#199BEC' }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{progress}%</span>
      </div>
    </div>
  );
}

export default function ComplianceProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  const frameworks: ComplianceFramework[] = [
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      shortName: 'SOC 2',
      progress: 85,
      totalControls: 64,
      completedControls: 54,
      status: 'on-track',
      nextDeadline: 'March 15, 2024',
      lastAssessment: '2 weeks ago',
      color: '#199BEC'
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      shortName: 'ISO 27001',
      progress: 72,
      totalControls: 114,
      completedControls: 82,
      status: 'on-track',
      nextDeadline: 'June 30, 2024',
      lastAssessment: '1 month ago',
      color: '#10B981'
    },
    {
      id: 'gdpr',
      name: 'GDPR Compliance',
      shortName: 'GDPR',
      progress: 94,
      totalControls: 32,
      completedControls: 30,
      status: 'on-track',
      nextDeadline: 'Ongoing',
      lastAssessment: '1 week ago',
      color: '#8B5CF6'
    },
    {
      id: 'hipaa',
      name: 'HIPAA Compliance',
      shortName: 'HIPAA',
      progress: 58,
      totalControls: 45,
      completedControls: 26,
      status: 'at-risk',
      nextDeadline: 'February 28, 2024',
      lastAssessment: '3 weeks ago',
      color: '#F59E0B'
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'behind': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="w-4 h-4" />;
      case 'at-risk': return <Clock className="w-4 h-4" />;
      case 'behind': return <DaisyAlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const overallProgress = Math.round(
    frameworks.reduce((sum, framework) => sum + framework.progress, 0) / frameworks.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Progress</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track progress across compliance frameworks and standards
          </p>
        </div>
        <DaisyButton variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </DaisyButton>
      </div>

      {/* Overall Progress */}
      <DaisyCard className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <DaisyCardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Overall Compliance</h4>
              <p className="text-sm text-gray-600 mb-4">
                Average progress across all active frameworks
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="font-medium">+5% this month</span>
                </div>
                <div className="text-sm text-gray-600">
                  {frameworks.reduce((sum, f) => sum + f.completedControls, 0)} of{' '}
                  {frameworks.reduce((sum, f) => sum + f.totalControls, 0)} controls completed
                </div>
              </div>
            </div>
            <DaisyProgressRing progress={overallProgress} size={120} strokeWidth={10} />
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Framework Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {frameworks.map((framework, index) => (
          <DaisyCard 
            key={framework.id}
            className={`cursor-pointer hover:shadow-md transition-all duration-300 transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${selectedFramework === framework.id ? 'ring-2 ring-[#199BEC]' : ''}`}
            style={{ transitionDelay: `${index * 100}ms` }}
            onClick={() => setSelectedFramework(framework.id)}
          >
            <DaisyCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <DaisyCardTitle className="text-sm font-medium">{framework.shortName}</DaisyCardTitle>
                <DaisyBadge className={getStatusColor(framework.status)}>
                  {getStatusIcon(framework.status)}
                  <span className="ml-1 capitalize">{framework.status.replace('-', ' ')}</span>
                </DaisyBadge>
              </div>
            
            <DaisyCardContent className="pt-0">
              <div className="flex items-center justify-center mb-4">
                <DaisyProgressRing 
                  progress={framework.progress} 
                  size={80} 
                  strokeWidth={6}
                  color={framework.color}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Controls</span>
                  <span className="font-medium">
                    {framework.completedControls}/{framework.totalControls}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Next Deadline</span>
                  <span className="font-medium text-right">{framework.nextDeadline}</span>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        ))}
      </div>

      {/* Detailed View */}
      {selectedFramework && (
        <DaisyCard className="transition-all duration-500">
          <DaisyCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <DaisyCardTitle className="text-lg">
                  {frameworks.find(f => f.id === selectedFramework)?.name}
                </DaisyCardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Detailed compliance progress and upcoming tasks
                </p>
              </div>
              <DaisyButton 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedFramework(null)}
              >
                ×
              </DaisyButton>
            </div>
          
          <DaisyCardContent>
            {(() => {
              const framework = frameworks.find(f => f.id === selectedFramework);
              if (!framework) return null;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress Overview */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Progress Overview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-medium">{framework.progress}%</span>
                      </div>
                      <DaisyProgress value={framework.progress} className="h-2" />
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed Controls</span>
                        <span className="text-sm font-medium">
                          {framework.completedControls} of {framework.totalControls}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Assessment</span>
                        <span className="text-sm font-medium">{framework.lastAssessment}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Recent Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Control AC-2 completed</p>
                          <p className="text-xs text-gray-600">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Evidence review pending</p>
                          <p className="text-xs text-gray-600">5 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Team training completed</p>
                          <p className="text-xs text-gray-600">1 week ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Tasks */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Upcoming Tasks</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <DaisyCalendar className="w-4 h-4 text-[#199BEC] mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Quarterly review</p>
                          <p className="text-xs text-gray-600">Due in 2 weeks</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <FileText className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Policy update required</p>
                          <p className="text-xs text-gray-600">Due in 1 month</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Security assessment</p>
                          <p className="text-xs text-gray-600">Due in 6 weeks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DaisyCardBody>
        </DaisyCard>
      )}
    </div>
  );
} 