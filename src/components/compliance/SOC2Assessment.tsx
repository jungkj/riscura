'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Shield, 
  Users, 
  Database,
  Monitor,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOC2Control {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: string;
  status: 'NOT_ASSESSED' | 'IN_PROGRESS' | 'NEEDS_EVIDENCE' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED';
  effectiveness?: 'NOT_EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'LARGELY_EFFECTIVE' | 'FULLY_EFFECTIVE';
  evidence?: string;
  notes?: string;
  lastAssessed?: Date;
}

interface SOC2Framework {
  id: string;
  name: string;
  version: string;
  controls: SOC2Control[];
  requirements: {
    id: string;
    title: string;
    description: string;
    controls: string[];
  }[];
}

interface AssessmentProgress {
  totalControls: number;
  assessedControls: number;
  passedControls: number;
  failedControls: number;
  percentage: number;
}

export function SOC2Assessment() {
  const [framework, setFramework] = useState<SOC2Framework | null>(null);
  const [progress, setProgress] = useState<AssessmentProgress>({
    totalControls: 0,
    assessedControls: 0,
    passedControls: 0,
    failedControls: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadSOC2Framework();
  }, []);

  useEffect(() => {
    if (framework) {
      calculateProgress();
    }
  }, [framework]);

  const loadSOC2Framework = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/probo/soc2');
      if (response.ok) {
        const data = await response.json();
        setFramework(data);
      }
    } catch (error) {
      console.error('Failed to load SOC 2 framework:', error);
    } finally {
      setLoading(false);
    }
  };

  const importSOC2Framework = async () => {
    setImporting(true);
    try {
      const organizationId = 'current-org-id'; // Get from context
      const response = await fetch('/api/probo/soc2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFramework(data);
      }
    } catch (error) {
      console.error('Failed to import SOC 2 framework:', error);
    } finally {
      setImporting(false);
    }
  };

  const calculateProgress = () => {
    if (!framework) return;

    const totalControls = framework.controls.length;
    const assessedControls = framework.controls.filter(c => 
      c.status !== 'NOT_ASSESSED'
    ).length;
    const passedControls = framework.controls.filter(c => 
      c.status === 'PASSED'
    ).length;
    const failedControls = framework.controls.filter(c => 
      c.status === 'FAILED'
    ).length;

    setProgress({
      totalControls,
      assessedControls,
      passedControls,
      failedControls,
      percentage: totalControls > 0 ? (assessedControls / totalControls) * 100 : 0
    });
  };

  const getStatusIcon = (status: SOC2Control['status']) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <DaisyAlertCircle className="h-4 w-4 text-red-500" />;
      case 'IN_PROGRESS':
      case 'UNDER_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: SOC2Control['status']) => {
    const variants = {
      'NOT_ASSESSED': 'secondary',
      'IN_PROGRESS': 'default',
      'NEEDS_EVIDENCE': 'destructive',
      'UNDER_REVIEW': 'secondary',
      'PASSED': 'default',
      'FAILED': 'destructive'
    } as const;

    const colors = {
      'NOT_ASSESSED': 'bg-gray-100 text-gray-700',
      'IN_PROGRESS': 'bg-blue-100 text-blue-700',
      'NEEDS_EVIDENCE': 'bg-orange-100 text-orange-700',
      'UNDER_REVIEW': 'bg-purple-100 text-purple-700',
      'PASSED': 'bg-green-100 text-green-700',
      'FAILED': 'bg-red-100 text-red-700'
    };

    return (
      <DaisyBadge className={cn('text-xs', colors[status])}>
        {status.replace('_', ' ')}
      </DaisyBadge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'control environment':
        return <Shield className="h-4 w-4" />;
      case 'communication and information':
        return <FileText className="h-4 w-4" />;
      case 'logical and physical access controls':
        return <Users className="h-4 w-4" />;
      case 'system operations':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const filteredControls = framework?.controls.filter(control => 
    selectedCategory === 'all' || control.category === selectedCategory
  ) || [];

  const categories = framework?.controls.reduce((acc, control) => {
    if (!acc.includes(control.category)) {
      acc.push(control.category);
    }
    return acc;
  }, [] as string[]) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC]"></div>
      </div>
    );
  }

  if (!framework) {
    return (
      <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
        <DaisyCardHeader>
          <DaisyCardTitle className="text-[#191919] font-inter">
            SOC 2 Compliance Assessment
          </DaisyCardTitle>
          <DaisyCardDescription>
            Import SOC 2 framework to begin compliance assessment
          </CardDescription>
        
        <DaisyCardContent>
          <DaisyAlert>
            <Shield className="h-4 w-4" />
            <DaisyAlertDescription>
              No SOC 2 framework found. Import the framework to begin your compliance assessment.
            
          </DaisyAlert>
          <div className="mt-4">
            <DaisyButton 
              onClick={importSOC2Framework}
              disabled={importing}
              className="bg-[#199BEC] hover:bg-[#199BEC]/90"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing Framework...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import SOC 2 Framework
                </>
              )}
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Total Controls</p>
                <p className="text-2xl font-bold text-[#191919]">{progress.totalControls}</p>
              </div>
              <Shield className="h-8 w-8 text-[#199BEC]" />
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Assessed</p>
                <p className="text-2xl font-bold text-[#191919]">{progress.assessedControls}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Passed</p>
                <p className="text-2xl font-bold text-green-600">{progress.passedControls}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A8A8A8]">Failed</p>
                <p className="text-2xl font-bold text-red-600">{progress.failedControls}</p>
              </div>
              <DaisyAlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Progress Bar */}
      <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
        <DaisyCardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#191919]">Assessment Progress</h3>
            <span className="text-sm text-[#A8A8A8]">{Math.round(progress.percentage)}% Complete</span>
          </div>
          <DaisyProgress value={progress.percentage} className="h-3" />
        </DaisyCardBody>
      </DaisyCard>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
              <DaisyCardHeader>
                <DaisyCardTitle className="text-[#191919] font-inter">Framework Information</DaisyCardTitle>
              
              <DaisyCardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#A8A8A8]">Framework:</span>
                    <span className="text-[#191919] font-medium">{framework.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A8A8A8]">Version:</span>
                    <span className="text-[#191919] font-medium">{framework.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A8A8A8]">Total Controls:</span>
                    <span className="text-[#191919] font-medium">{framework.controls.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A8A8A8]">Requirements:</span>
                    <span className="text-[#191919] font-medium">{framework.requirements.length}</span>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
              <DaisyCardHeader>
                <DaisyCardTitle className="text-[#191919] font-inter">Assessment Status</DaisyCardTitle>
              
              <DaisyCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A8A8A8]">Not Assessed</span>
                    <DaisyBadge className="bg-gray-100 text-gray-700">
                      {progress.totalControls - progress.assessedControls}
                    </DaisyBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A8A8A8]">In Progress</span>
                    <DaisyBadge className="bg-blue-100 text-blue-700">
                      {framework.controls.filter(c => c.status === 'IN_PROGRESS').length}
                    </DaisyBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A8A8A8]">Under Review</span>
                    <DaisyBadge className="bg-purple-100 text-purple-700">
                      {framework.controls.filter(c => c.status === 'UNDER_REVIEW').length}
                    </DaisyBadge>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-[#191919]">SOC 2 Controls</h3>
              <DaisyBadge variant="outline">{filteredControls.length} controls</DaisyBadge>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-[#D8C3A5] rounded-md text-sm focus:outline-none focus:border-[#199BEC]"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <DaisyButton size="sm" className="bg-[#199BEC] hover:bg-[#199BEC]/90">
                <Plus className="h-4 w-4 mr-1" />
                Add Control
              </DaisyButton>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredControls.map(control => (
              <DaisyCard key={control.id} className="bg-[#FAFAFA] border-[#D8C3A5]">
                <DaisyCardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getCategoryIcon(control.category)}
                        <h4 className="font-medium text-[#191919]">{control.name}</h4>
                        {getStatusIcon(control.status)}
                      </div>
                      <p className="text-sm text-[#A8A8A8] mb-2">{control.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-[#A8A8A8]">
                        <span>Requirement: {control.requirement}</span>
                        <span>Category: {control.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(control.status)}
                      <DaisyButton size="sm" variant="outline" className="text-xs">
                        Assess
                      </DaisyButton>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
            <DaisyCardHeader>
              <DaisyCardTitle className="text-[#191919] font-inter">Evidence Collection</DaisyCardTitle>
              <DaisyCardDescription>
                Upload and manage evidence for SOC 2 controls
              </CardDescription>
            
            <DaisyCardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-[#A8A8A8] mx-auto mb-4" />
                <p className="text-[#A8A8A8] mb-4">No evidence uploaded yet</p>
                <DaisyButton className="bg-[#199BEC] hover:bg-[#199BEC]/90">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence
                </DaisyButton>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
            <DaisyCardHeader>
              <DaisyCardTitle className="text-[#191919] font-inter">Assessment Reports</DaisyCardTitle>
              <DaisyCardDescription>
                Generate and download SOC 2 assessment reports
              </CardDescription>
            
            <DaisyCardContent>
              <div className="space-y-4">
                <DaisyButton className="bg-[#199BEC] hover:bg-[#199BEC]/90 w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Assessment Summary
                </DaisyButton>
                <DaisyButton variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Control Matrix
                </DaisyButton>
                <DaisyButton variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Gap Analysis Report
                </DaisyButton>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </TabsContent>
      </Tabs>
    </div>
  );
} 