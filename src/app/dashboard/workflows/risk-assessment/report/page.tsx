'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Risk Report</h1>
                <p className="text-gray-600 mt-1">Create comprehensive risk assessment reports</p>
              </div>
              <Badge variant="outline" className="text-sm">
                <Clock className="h-4 w-4 mr-1" />
                10-15 min
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Risks</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.totalRisks}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High/Critical</p>
                    <p className="text-2xl font-bold text-red-600">
                      {loading ? '...' : stats.highRisks}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Controls</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.totalControls}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Actions</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stats.openActions}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select
                      value={reportConfig.reportType}
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, reportType: value }))}
                    >
                      <SelectTrigger id="report-type" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprehensive">Comprehensive Risk Assessment</SelectItem>
                        <SelectItem value="executive">Executive Summary</SelectItem>
                        <SelectItem value="detailed">Detailed Risk Analysis</SelectItem>
                        <SelectItem value="controls">Controls Assessment</SelectItem>
                        <SelectItem value="compliance">Compliance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="time-range">Time Range</Label>
                    <Select
                      value={reportConfig.timeRange}
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, timeRange: value }))}
                    >
                      <SelectTrigger id="time-range" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-quarter">Last Quarter</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                        <SelectItem value="all-time">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Report Format</Label>
                    <RadioGroup
                      value={reportConfig.format}
                      onValueChange={(value: 'pdf' | 'excel' | 'word') => 
                        setReportConfig(prev => ({ ...prev, format: value }))
                      }
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="cursor-pointer">PDF Document</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="excel" id="excel" />
                        <Label htmlFor="excel" className="cursor-pointer">Excel Spreadsheet</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="word" id="word" />
                        <Label htmlFor="word" className="cursor-pointer">Word Document</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              {/* Sections to Include */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(reportConfig.sections).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-3">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={() => handleSectionToggle(key as keyof typeof reportConfig.sections)}
                        />
                        <Label htmlFor={key} className="cursor-pointer">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Preview & Actions */}
            <div className="space-y-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Report Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
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
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generate Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerateReport}
                    disabled={generating}
                  >
                    {generating ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Generate & Download
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => toast({ title: 'Preview opened in new window' })}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSendReport}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reporting/schedule')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Recurring Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reporting/templates')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Templates
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/reporting/history')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Report History
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}