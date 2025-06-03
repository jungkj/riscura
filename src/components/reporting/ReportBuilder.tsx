'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { Plus, Trash2, Settings, Eye, Save, Play, FileText } from 'lucide-react';

// Types
import type { ReportTemplate, ReportSection, SectionType } from '@/types/reporting.types';

interface ReportBuilderProps {
  template?: ReportTemplate;
  onSave?: (template: ReportTemplate) => void;
  onPreview?: (template: ReportTemplate) => void;
}

export default function ReportBuilder({ template, onSave, onPreview }: ReportBuilderProps) {
  const [reportName, setReportName] = useState(template?.name || '');
  const [reportDescription, setReportDescription] = useState(template?.description || '');
  const [reportCategory, setReportCategory] = useState(template?.category || 'custom');
  const [reportType, setReportType] = useState(template?.type || 'custom');
  const [sections, setSections] = useState<ReportSection[]>(template?.sections || []);

  const addSection = (type: SectionType) => {
    const newSection: Partial<ReportSection> = {
      id: `section-${Date.now()}`,
      name: `New ${type} Section`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      type,
      order: sections.length,
      position: {
        row: 0,
        column: 0,
        rowSpan: 1,
        columnSpan: 1
      },
      size: {
        width: '100%',
        height: '300px'
      },
      config: {
        title: {
          show: true,
          text: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
          style: {}
        },
        borders: {
          width: 1,
          style: 'solid',
          color: '#e0e0e0'
        },
        background: {},
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        interactive: true,
        exportable: true
      },
      dataSource: 'default',
      query: {
        select: [],
        from: 'data'
      },
      visualization: {
        chartType: 'bar',
        chartConfig: {
          data: { x: 'category', y: 'value' },
          series: [],
          dimensions: [],
          measures: [],
          sorting: [],
          grouping: [],
          aggregations: []
        },
        colorScheme: {
          type: 'categorical',
          palette: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300']
        },
        legend: {
          show: true,
          position: 'top',
          alignment: 'center',
          orientation: 'horizontal',
          style: {}
        },
        axes: {
          x: {
            show: true,
            title: { show: true, style: {} },
            labels: { show: true, style: {} },
            grid: { show: true, style: { width: 1, style: 'solid', color: '#f0f0f0' } },
            ticks: { show: true, style: { width: 1, style: 'solid', color: '#ccc' } },
            scale: { type: 'category' }
          },
          y: {
            show: true,
            title: { show: true, style: {} },
            labels: { show: true, style: {} },
            grid: { show: true, style: { width: 1, style: 'solid', color: '#f0f0f0' } },
            ticks: { show: true, style: { width: 1, style: 'solid', color: '#ccc' } },
            scale: { type: 'linear' }
          }
        },
        annotations: [],
        interactions: {
          hover: true,
          click: true,
          zoom: false,
          pan: false,
          brush: false,
          crossfilter: false,
          tooltip: {
            enabled: true,
            format: 'default',
            fields: [],
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderColor: '#ccc',
              textColor: '#fff',
              fontSize: 12,
              padding: { top: 8, right: 8, bottom: 8, left: 8 }
            }
          }
        }
      }
    };

    setSections(prev => [...prev, newSection as ReportSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  const handleSave = () => {
    if (!reportName.trim()) return;

    const template: Partial<ReportTemplate> = {
      id: `rpt-${Date.now()}`,
      name: reportName,
      description: reportDescription,
      category: reportCategory as any,
      type: reportType as any,
      version: '1.0',
      sections,
      config: {
        refreshFrequency: 'manual',
        autoRefresh: false,
        cacheEnabled: true,
        cacheDuration: 60,
        maxDataPoints: 1000,
        dateRange: {
          type: 'relative',
          relative: { unit: 'days', value: 30, includeToday: true }
        },
        aggregationLevel: 'daily',
        includeHistorical: false,
        realTimeUpdates: false
      },
      layout: {
        orientation: 'portrait',
        pageSize: 'A4',
        columns: 2,
        gridTemplate: {
          rows: ['auto'],
          columns: ['1fr', '1fr'],
          areas: [],
          gap: { row: 16, column: 16 }
        },
        responsiveBreakpoints: []
      },
      dataSources: [],
      filters: [],
      parameters: [],
      styling: {} as any,
      permissions: {
        view: [],
        edit: [],
        delete: [],
        export: [],
        schedule: [],
        share: []
      },
      aiFeatures: {
        narrativeGeneration: {
          enabled: false,
          sections: [],
          style: 'paragraph',
          length: 'medium',
          language: 'en',
          tone: 'formal',
          includeInsights: false,
          includeRecommendations: false
        },
        insightGeneration: {
          enabled: false,
          types: [],
          confidence: 80,
          priority: [],
          categories: [],
          maxInsights: 5
        },
        recommendationEngine: {
          enabled: false,
          types: [],
          context: {
            organizationProfile: {
              industry: 'technology',
              size: 'medium',
              region: 'us',
              riskProfile: 'medium',
              maturityLevel: 3
            },
            userRole: 'analyst',
            historicalData: false,
            industryBenchmarks: false,
            regulatoryRequirements: false
          },
          personalization: {
            enabled: false,
            userPreferences: false,
            roleBasedFiltering: false,
            historicalInteractions: false,
            learningEnabled: false
          },
          maxRecommendations: 3
        },
        anomalyDetection: {
          enabled: false,
          algorithms: [],
          sensitivity: 0.7,
          seasonality: false,
          trendFiltering: false,
          minDataPoints: 30
        },
        predictiveAnalytics: {
          enabled: false,
          models: [],
          horizon: 30,
          confidence: 0.8,
          scenarios: []
        },
        naturalLanguageQuery: {
          enabled: false,
          supportedLanguages: ['en'],
          contextAware: false,
          suggestionsEnabled: false,
          maxTokens: 1000
        }
      },
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isPublic: false,
      isSystem: false,
      tags: [],
      organizationId: 'org-1'
    };

    onSave?.(template as ReportTemplate);
  };

  const handlePreview = () => {
    if (!reportName.trim()) return;

    const template: Partial<ReportTemplate> = {
      name: reportName,
      description: reportDescription,
      sections
    };

    onPreview?.(template as ReportTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-notion-text-primary">Report Builder</h2>
          <p className="text-notion-text-secondary">
            Create custom reports with drag-and-drop components
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePreview} disabled={!reportName.trim()}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!reportName.trim()}>
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
            <CardHeader>
              <CardTitle className="text-lg">Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name..."
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter report description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={reportCategory} onValueChange={(value) => setReportCategory(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="risk_management">Risk Management</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Report Type</Label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="detailed_report">Detailed Report</SelectItem>
                    <SelectItem value="summary_report">Summary Report</SelectItem>
                    <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                    <SelectItem value="compliance_report">Compliance Report</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-notion-border">
                <Label className="text-sm font-medium">Add Components</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('chart')}
                    className="text-xs"
                  >
                    Chart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('table')}
                    className="text-xs"
                  >
                    Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('kpi')}
                    className="text-xs"
                  >
                    KPI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection('text')}
                    className="text-xs"
                  >
                    Text
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3">
          <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary min-h-96">
            <CardHeader>
              <CardTitle className="text-lg">Report Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              {sections.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-notion-border rounded-lg">
                  <FileText className="w-12 h-12 text-notion-text-tertiary mx-auto mb-4" />
                  <p className="text-notion-text-secondary mb-4">
                    No sections added yet. Start building your report by adding sections.
                  </p>
                  
                  <Button
                    variant="outline"
                    className="w-full h-16 border-2 border-dashed border-notion-border"
                    onClick={() => addSection('chart')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Section
                  </Button>
                </div>
              )}

              {sections.length > 0 && (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-notion-border rounded-lg p-4 bg-notion-bg-primary"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-notion-blue rounded-full" />
                          <span className="font-medium text-notion-text-primary">
                            {section.title}
                          </span>
                          <span className="text-xs text-notion-text-secondary px-2 py-1 bg-notion-bg-secondary rounded">
                            {section.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Open section configuration modal
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="h-32 bg-notion-bg-secondary rounded border-2 border-dashed border-notion-border flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📊</div>
                          <p className="text-sm text-notion-text-secondary">
                            {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Component
                          </p>
                          <p className="text-xs text-notion-text-tertiary">
                            Configure data source and visualization
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full h-16 border-2 border-dashed border-notion-border"
                    onClick={() => addSection('chart')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Section
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 