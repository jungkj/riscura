'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySelect, DaisySelectContent, DaisySelectItem, DaisySelectTrigger, DaisySelectValue } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyRadioGroup, DaisyRadioGroupItem } from '@/components/ui/DaisyRadioGroup';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  FileText, 
  Download,
  Send,
  Calendar,
  Users,
  Shield,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  Eye,
  Printer
} from 'lucide-react';

interface ReportConfig {
  reportType: string;
  timeRange: string;
  sections: {
    executiveSummary: boolean;
    riskOverview: boolean;
    detailedAnalysis: boolean;
    controls: boolean;
    trends: boolean;
    recommendations: boolean;
    appendix: boolean;
  };
  format: 'pdf' | 'excel' | 'word';
  recipients: string[];
}

export default function GenerateRiskReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportType: 'comprehensive',
    timeRange: 'last-quarter',
    sections: {
      executiveSummary: true,
      riskOverview: true,
      detailedAnalysis: true,
      controls: true,
      trends: true,
      recommendations: true,
      appendix: false
    },
    format: 'pdf',
    recipients: []
  });

  const [stats, setStats] = useState({
    totalRisks: 0,
    highRisks: 0,
    totalControls: 0,
    openActions: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [risksResponse, controlsResponse] = await Promise.all([
        fetch('/api/risks'),
        fetch('/api/controls')
      ]);

      if (risksResponse.ok && controlsResponse.ok) {
        const risksData = await risksResponse.json();
        const controlsData = await controlsResponse.json();

        const risks = risksData.data || [];
        const controls = controlsData.data || [];

        setStats({
          totalRisks: risks.length,
          highRisks: risks.filter((r: any) => 
            r.riskScore === 'high' || r.riskScore === 'critical'
          ).length,
          totalControls: controls.length,
          openActions: risks.filter((r: any) => r.status === 'active').length
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (section: keyof typeof reportConfig.sections) => {
    setReportConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section]
      }
    }));
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/reports/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportConfig)
      });

      if (!response.ok) throw new Error('Failed to generate report');

      // In a real implementation, this would return a download URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-assessment-report-${new Date().toISOString().split('T')[0]}.${reportConfig.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReport = () => {
    toast({
      title: 'Report Scheduled',
      description: 'The report will be sent to the selected recipients',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <DaisyButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </DaisyButton>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Risk Report</h1>
                <p className="text-gray-600 mt-1">Create comprehensive risk assessment reports</p>
              </div>
              <DaisyBadge variant="outline" className="text-sm">
                <Clock className="h-4 w-4 mr-1" />
                10-15 min
              </DaisyBadge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Risks</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.totalRisks}
                    </p>
                  </div>
                  <DaisyAlertTriangle className="h-8 w-8 text-orange-400" >
  </div>
</DaisyAlertTriangle>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High/Critical</p>
                    <p className="text-2xl font-bold text-red-600">
                      {loading ? '...' : stats.highRisks}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Controls</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.totalControls}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Actions</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.openActions}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Type */}
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Report Configuration</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-6" >
  <div>
</DaisyCardBody>
                    <DaisyLabel htmlFor="report-type">Report Type</DaisyLabel>
                    <DaisySelect
                      value={reportConfig.reportType}
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, reportType: value }))}
                    >
                      <DaisySelectTrigger id="report-type" className="mt-1" />
                        <DaisySelectValue /></DaisySelect>
                      <DaisySelectContent />
                        <DaisySelectItem value="comprehensive">Comprehensive Risk Assessment</DaisySelectContent>
                        <DaisySelectItem value="executive">Executive Summary</DaisySelectItem>
                        <DaisySelectItem value="detailed">Detailed Risk Analysis</DaisySelectItem>
                        <DaisySelectItem value="controls">Controls Assessment</DaisySelectItem>
                        <DaisySelectItem value="compliance">Compliance Report</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

                  <div>
                    <DaisyLabel htmlFor="time-range">Time Range</DaisyLabel>
                    <DaisySelect
                      value={reportConfig.timeRange}
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, timeRange: value }))}
                    >
                      <DaisySelectTrigger id="time-range" className="mt-1" />
                        <DaisySelectValue /></DaisySelect>
                      <DaisySelectContent />
                        <DaisySelectItem value="last-month">Last Month</DaisySelectContent>
                        <DaisySelectItem value="last-quarter">Last Quarter</DaisySelectItem>
                        <DaisySelectItem value="last-year">Last Year</DaisySelectItem>
                        <DaisySelectItem value="ytd">Year to Date</DaisySelectItem>
                        <DaisySelectItem value="all-time">All Time</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

                  <div>
                    <DaisyLabel>Report Format</DaisyLabel>
                    <DaisyRadioGroup
                      value={reportConfig.format}
                      onValueChange={(value: 'pdf' | 'excel' | 'word') => 
                        setReportConfig(prev => ({ ...prev, format: value }))
                      }
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <DaisyRadioGroupItem value="pdf" id="pdf" />
                        <DaisyLabel htmlFor="pdf" className="cursor-pointer">PDF Document</DaisyRadioGroup>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DaisyRadioGroupItem value="excel" id="excel" />
                        <DaisyLabel htmlFor="excel" className="cursor-pointer">Excel Spreadsheet</DaisyRadioGroupItem>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DaisyRadioGroupItem value="word" id="word" />
                        <DaisyLabel htmlFor="word" className="cursor-pointer">Word Document</DaisyRadioGroupItem>
                      </div>
                    </DaisyRadioGroup>
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              {/* Sections to Include */}
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Report Sections</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                    {Object.entries(reportConfig.sections).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-3">
                        <DaisyCheckbox
                          id={key}
                          checked={value}
                          onCheckedChange={() => handleSectionToggle(key as keyof typeof reportConfig.sections)}
                        />
                        <DaisyLabel htmlFor={key} className="cursor-pointer" />
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </DaisyCheckbox>
                      </div>
                    ))}
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            </div>

            {/* Report Preview & Actions */}
            <div className="space-y-6">
              {/* Preview */}
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle className="text-lg flex items-center gap-2" >
  <Eye className="h-5 w-5" />
</DaisyCardTitle>
                    Report Preview
                  </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3 text-sm">
</DaisyCardBody>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">Selected Report:</p>
                      <p className="text-gray-600">
                        {reportConfig.reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">Time Period:</p>
                      <p className="text-gray-600">
                        {reportConfig.timeRange.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">Sections Included:</p>
                      <p className="text-gray-600">
                        {Object.entries(reportConfig.sections)
                          .filter(([_, enabled]) => enabled)
                          .length} of {Object.keys(reportConfig.sections).length} sections
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">Output Format:</p>
                      <p className="text-gray-600">{reportConfig.format.toUpperCase()}</p>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              {/* Actions */}
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Generate Report</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-3" >
  <DaisyButton
                    className="w-full"
                    size="lg"
                    onClick={handleGenerateReport}
                    disabled={generating} >
</DaisyCardBody>
  {generating ? (
</DaisyButton>
                      <>Generating...</>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Generate & Download
                      </>
                    )}
                  </DaisyButton>

                  <div className="flex gap-2">
                    <DaisyButton
                      variant="outline"
                      className="flex-1"
                      onClick={() => toast({ title: 'Preview opened in new window' })}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DaisyButton>
                    <DaisyButton
                      variant="outline"
                      className="flex-1"
                      onClick={handleSendReport} >
  <Send className="h-4 w-4 mr-2" />
</DaisyButton>
                      Send
                    </DaisyButton>
                  </div>

                  <DaisyButton
                    variant="outline"
                    className="w-full"
                    onClick={() => window.print()} />
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </DaisyButton>
                </DaisyCardBody>
              </DaisyCard>

              {/* Quick Actions */}
              <DaisyCard >
  <DaisyCardBody />
</DaisyCard>
                  <DaisyCardTitle className="text-lg">Quick Actions</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-2" >
  <DaisyButton
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
</DaisyCardBody> router.push('/dashboard/reporting/schedule')} />
                    <DaisyCalendar className="h-4 w-4 mr-2" />
                    Schedule Recurring Report
                  </DaisyCalendar>
                  <DaisyButton
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reporting/templates')} />
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Templates
                  </DaisyButton>
                  <DaisyButton
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reporting/history')} />
                    <Clock className="h-4 w-4 mr-2" />
                    View Report History
                  </DaisyButton>
                </DaisyCardBody>
              </DaisyCard>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}