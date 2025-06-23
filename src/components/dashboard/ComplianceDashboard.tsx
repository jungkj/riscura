'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ComplianceDonut } from './ComplianceDonut';
import { ComplianceRingChart } from '@/components/charts/ComplianceRingChart';
import { VisualMetricCard } from '@/components/widgets/VisualMetricCard';
import { useRouter } from 'next/navigation';
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
  Activity,
  Zap,
  Database
} from 'lucide-react';

interface ComplianceFramework {
  name: string;
  status: 'compliant' | 'in-progress' | 'needs-review';
  score: number;
  lastAssessed: string;
  nextDue: string;
  proboIntegrated?: boolean;
  controlsCount?: number;
}

export default function ComplianceDashboard() {
  const router = useRouter();

  const frameworks: ComplianceFramework[] = [
    {
      name: 'SOC 2 Type II',
      status: 'compliant',
      score: 98,
      lastAssessed: '2024-05-15',
      nextDue: '2024-11-15',
      proboIntegrated: true,
      controlsCount: 67
    },
    {
      name: 'ISO 27001',
      status: 'in-progress',
      score: 85,
      lastAssessed: '2024-04-20',
      nextDue: '2024-07-20',
      proboIntegrated: true,
      controlsCount: 114
    },
    {
      name: 'GDPR',
      status: 'compliant',
      score: 96,
      lastAssessed: '2024-05-01',
      nextDue: '2024-08-01',
      proboIntegrated: false,
      controlsCount: 42
    },
    {
      name: 'HIPAA',
      status: 'needs-review',
      score: 78,
      lastAssessed: '2024-03-10',
      nextDue: '2024-06-10',
      proboIntegrated: false,
      controlsCount: 45
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

  const handleProboIntegrationClick = (frameworkName: string) => {
    if (frameworkName === 'SOC 2 Type II') {
      router.push('/probo?tab=soc2-assessment');
    } else {
      router.push('/probo?tab=controls-library');
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
          title="Probo Controls"
          value={651}
          previousValue={0}
          icon={Database}
          color="#199BEC"
          status="info"
          trend="up"
          trendPercentage={100}
          subtitle="Available Controls"
          onClick={() => router.push('/probo?tab=controls-library')}
        />
      </div>

      {/* Probo Integration Banner */}
      <Card className="bg-gradient-to-r from-[#199BEC]/5 to-[#199BEC]/10 border-[#199BEC]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#199BEC]/10 rounded-lg">
                <Zap className="h-6 w-6 text-[#199BEC]" />
              </div>
              <div>
                <CardTitle className="text-[#191919] font-inter">Probo Integration Active</CardTitle>
                <p className="text-sm text-[#A8A8A8] mt-1">
                  Access 650+ security controls and AI-powered compliance assessments
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/probo')}
              className="bg-[#199BEC] hover:bg-[#199BEC]/90 text-white"
            >
              Open Probo Hub
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Compliance Overview with Ring Chart */}
      <div className="mb-8">
        <ComplianceRingChart 
          onFrameworkClick={(framework) => {
            console.log('Framework clicked:', framework);
            // Navigate to appropriate Probo tab based on framework
            if (framework.name.toLowerCase().includes('soc')) {
              router.push('/probo?tab=soc2-assessment');
            } else {
              router.push('/probo?tab=controls-library');
            }
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
                      {framework.proboIntegrated && (
                        <Badge variant="outline" className="text-xs bg-[#199BEC]/10 text-[#199BEC] border-[#199BEC]/30">
                          Probo
                        </Badge>
                      )}
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
                  {framework.proboIntegrated && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-[#A8A8A8]">
                        {framework.controlsCount} controls available
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs text-[#199BEC] hover:text-[#199BEC]/80 hover:bg-[#199BEC]/5"
                        onClick={() => handleProboIntegrationClick(framework.name)}
                      >
                        View in Probo
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
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