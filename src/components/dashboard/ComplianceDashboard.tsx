'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ComplianceDonut } from './ComplianceDonut';
import { ComplianceRingChart } from '@/components/charts/ComplianceRingChart';
import { VisualMetricCard } from '@/components/widgets/VisualMetricCard';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  FileText, 
  TrendingUp,
  ExternalLink,
  Calendar,
  Target,
  Activity
} from 'lucide-react';

interface ComplianceFramework {
  name: string;
  status: 'compliant' | 'in-progress' | 'needs-review';
  score: number;
  lastAssessed: string;
  nextDue: string;
}

export default function ComplianceDashboard() {
  const frameworks: ComplianceFramework[] = [
    {
      name: 'SOC 2 Type II',
      status: 'compliant',
      score: 98,
      lastAssessed: '2024-05-15',
      nextDue: '2024-11-15'
    },
    {
      name: 'ISO 27001',
      status: 'in-progress',
      score: 85,
      lastAssessed: '2024-04-20',
      nextDue: '2024-07-20'
    },
    {
      name: 'GDPR',
      status: 'compliant',
      score: 96,
      lastAssessed: '2024-05-01',
      nextDue: '2024-08-01'
    },
    {
      name: 'HIPAA',
      status: 'needs-review',
      score: 78,
      lastAssessed: '2024-03-10',
      nextDue: '2024-06-10'
    }
  ];

  const getStatusBadge = (status: ComplianceFramework['status']) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Compliant</Badge>;
      case 'in-progress':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">In Progress</Badge>;
      case 'needs-review':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Needs Review</Badge>;
    }
  };

  const getStatusIcon = (status: ComplianceFramework['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'needs-review':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Overview Cards with Visual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <VisualMetricCard
          title="Compliant Frameworks"
          value={2}
          previousValue={1}
          icon={CheckCircle}
          color="#10b981"
          status="success"
          trend="up"
          trendPercentage={100}
          subtitle="SOC 2, GDPR"
        />
        
        <VisualMetricCard
          title="In Progress"
          value={1}
          previousValue={2}
          icon={Clock}
          color="#f59e0b"
          status="warning"
          trend="down"
          trendPercentage={-50}
          subtitle="ISO 27001"
        />
        
        <VisualMetricCard
          title="Need Review"
          value={1}
          previousValue={0}
          icon={AlertTriangle}
          color="#ef4444"
          status="error"
          trend="up"
          trendPercentage={100}
          subtitle="HIPAA"
        />
        
        <VisualMetricCard
          title="Overall Score"
          value={89}
          previousValue={85}
          unit="%"
          icon={Target}
          color="#3b82f6"
          status="info"
          trend="up"
          trendPercentage={4.7}
          target={95}
          showProgress={true}
          sparklineData={[
            { value: 82, timestamp: new Date('2024-01-01') },
            { value: 85, timestamp: new Date('2024-01-02') },
            { value: 87, timestamp: new Date('2024-01-03') },
            { value: 88, timestamp: new Date('2024-01-04') },
            { value: 89, timestamp: new Date('2024-01-05') }
          ]}
        />
      </div>

      {/* Enhanced Compliance Overview with Ring Chart */}
      <div className="mb-8">
        <ComplianceRingChart 
          onFrameworkClick={(framework) => {
            console.log('Framework clicked:', framework);
          }}
        />
      </div>

      {/* Traffic Light System for Quick Status Overview */}
      <Card className="bg-[#FAFAFA] border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#199BEC]" />
            Framework Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {frameworks.map((framework, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(framework.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#191919] text-sm">{framework.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-lg font-bold text-[#191919]">{framework.score}%</div>
                      {getStatusBadge(framework.status)}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress 
                    value={framework.score} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Last: {framework.lastAssessed}</span>
                    <span>Due: {framework.nextDue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Framework Progress */}
      <Card className="bg-[#FAFAFA] border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#199BEC]" />
            Framework Progress Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {frameworks.map((framework, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-[#191919]">{framework.name}</h4>
                    {getStatusBadge(framework.status)}
                  </div>
                  <span className="text-sm text-gray-600">{framework.score}%</span>
                </div>
                <Progress value={framework.score} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Last assessed: {framework.lastAssessed}</span>
                  <span>Next due: {framework.nextDue}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button className="w-full bg-[#199BEC] hover:bg-[#0f7dc7] text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Generate Detailed Compliance Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
      );
  } 