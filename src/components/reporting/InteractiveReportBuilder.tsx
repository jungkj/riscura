'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  FileText,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  Share,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  Brain,
  Filter,
  Layout,
  Palette,
  Clock,
  RefreshCw,
  Copy,
  Move,
  Maximize,
  Minimize,
  Grid,
  List,
  Table,
  Image,
  Type,
  Zap
} from 'lucide-react';

// Report component definitions
interface ReportComponent {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'summary' | 'charts' | 'tables' | 'insights' | 'compliance';
  config: {
    dataSource?: string;
    filters?: any[];
    visualization?: string;
    timeframe?: string;
    groupBy?: string;
    metrics?: string[];
  };
  position: { x: number; y: number; width: number; height: number };
  data?: any;
}

// Available report components
const REPORT_COMPONENTS: Omit<ReportComponent, 'id' | 'position' | 'data'>[] = [
  {
    type: 'risk-summary',
    title: 'Risk Summary',
    description: 'Overview of risk metrics and key indicators',
    icon: Shield,
    category: 'summary',
    config: {
      dataSource: 'risks',
      metrics: ['total', 'high', 'medium', 'low', 'trend'],
      timeframe: '30d'
    }
  },
  {
    type: 'compliance-status',
    title: 'Compliance Status',
    description: 'Current compliance scores and framework status',
    icon: CheckCircle,
    category: 'compliance',
    config: {
      dataSource: 'compliance',
      metrics: ['score', 'frameworks', 'controls', 'gaps'],
      visualization: 'gauge'
    }
  },
  {
    type: 'trend-analysis',
    title: 'Trend Analysis',
    description: 'Risk and compliance trends over time',
    icon: TrendingUp,
    category: 'charts',
    config: {
      dataSource: 'trends',
      visualization: 'line',
      timeframe: '90d',
      groupBy: 'month'
    }
  },
  {
    type: 'ai-recommendations',
    title: 'AI Recommendations',
    description: 'ARIA-generated insights and recommendations',
    icon: Brain,
    category: 'insights',
    config: {
      dataSource: 'ai_insights',
      metrics: ['recommendations', 'confidence', 'priority']
    }
  },
  {
    type: 'risk-heatmap',
    title: 'Risk Heatmap',
    description: 'Visual risk distribution by impact and likelihood',
    icon: Grid,
    category: 'charts',
    config: {
      dataSource: 'risks',
      visualization: 'heatmap',
      groupBy: 'category'
    }
  },
  {
    type: 'control-effectiveness',
    title: 'Control Effectiveness',
    description: 'Control performance and effectiveness metrics',
    icon: CheckCircle,
    category: 'charts',
    config: {
      dataSource: 'controls',
      visualization: 'bar',
      metrics: ['effectiveness', 'coverage', 'testing']
    }
  },
  {
    type: 'incident-timeline',
    title: 'Incident Timeline',
    description: 'Recent incidents and response activities',
    icon: Clock,
    category: 'tables',
    config: {
      dataSource: 'incidents',
      timeframe: '30d',
      groupBy: 'severity'
    }
  },
  {
    type: 'regulatory-changes',
    title: 'Regulatory Changes',
    description: 'Recent regulatory updates and impact assessment',
    icon: AlertTriangle,
    category: 'insights',
    config: {
      dataSource: 'regulations',
      timeframe: '90d'
    }
  }
];

// Report template definitions
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  components: string[];
  layout: 'grid' | 'flow' | 'dashboard';
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for leadership',
    category: 'executive',
    components: ['risk-summary', 'compliance-status', 'trend-analysis', 'ai-recommendations'],
    layout: 'grid'
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    description: 'Detailed risk analysis and metrics',
    category: 'risk',
    components: ['risk-summary', 'risk-heatmap', 'trend-analysis', 'control-effectiveness'],
    layout: 'flow'
  },
  {
    id: 'compliance-dashboard',
    name: 'Compliance Dashboard',
    description: 'Comprehensive compliance monitoring',
    category: 'compliance',
    components: ['compliance-status', 'control-effectiveness', 'regulatory-changes', 'incident-timeline'],
    layout: 'dashboard'
  },
  {
    id: 'operational-review',
    name: 'Operational Review',
    description: 'Operational risk and control performance',
    category: 'operational',
    components: ['control-effectiveness', 'incident-timeline', 'trend-analysis', 'ai-recommendations'],
    layout: 'grid'
  }
];

// Main report builder component
interface InteractiveReportBuilderProps {
  onSave?: (report: any) => void;
  onExport?: (report: any, format: string) => void;
  onShare?: (report: any) => void;
  className?: string;
}

export const InteractiveReportBuilder: React.FC<InteractiveReportBuilderProps> = ({
  onSave,
  onExport,
  onShare,
  className = ''
}) => {
  const [reportTitle, setReportTitle] = useState('New Report');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [components, setComponents] = useState<ReportComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'flow' | 'custom'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggedComponent = useRef<string | null>(null);

  // Generate sample data for components
  const generateSampleData = useCallback((componentType: string) => {
    switch (componentType) {
      case 'risk-summary':
        return {
          totalRisks: 47,
          highRisks: 8,
          mediumRisks: 23,
          lowRisks: 16,
          trend: '+12%',
          riskScore: 3.2
        };
      case 'compliance-status':
        return {
          overallScore: 94,
          frameworks: [
            { name: 'SOX', score: 96, status: 'compliant' },
            { name: 'ISO 27001', score: 92, status: 'compliant' },
            { name: 'GDPR', score: 89, status: 'minor-gaps' }
          ]
        };
      case 'trend-analysis':
        return {
          data: [
            { month: 'Jan', risks: 42, compliance: 91 },
            { month: 'Feb', risks: 45, compliance: 93 },
            { month: 'Mar', risks: 47, compliance: 94 }
          ]
        };
      case 'ai-recommendations':
        return {
          recommendations: [
            {
              title: 'Enhance Access Controls',
              confidence: 92,
              priority: 'high',
              description: 'Implement multi-factor authentication for privileged accounts'
            },
            {
              title: 'Update Risk Assessments',
              confidence: 87,
              priority: 'medium',
              description: 'Quarterly review of cybersecurity risk assessments'
            }
          ]
        };
      default:
        return {};
    }
  }, []);

  // Add component to report
  const addComponent = useCallback((componentType: string) => {
    const template = REPORT_COMPONENTS.find(c => c.type === componentType);
    if (!template) return;

    const newComponent: ReportComponent = {
      ...template,
      id: `${componentType}-${Date.now()}`,
      position: {
        x: Math.floor(Math.random() * 400),
        y: Math.floor(Math.random() * 300),
        width: 400,
        height: 300
      },
      data: generateSampleData(componentType)
    };

    setComponents(prev => [...prev, newComponent]);
  }, [generateSampleData]);

  // Remove component
  const removeComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  // Update component
  const updateComponent = useCallback((componentId: string, updates: Partial<ReportComponent>) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, ...updates } : c
    ));
  }, []);

  // Load template
  const loadTemplate = useCallback((templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setReportTitle(template.name);
    setReportDescription(template.description);
    setLayoutMode(template.layout === 'dashboard' ? 'grid' : template.layout);
    
    // Clear existing components
    setComponents([]);
    
    // Add template components
    template.components.forEach((componentType, index) => {
      setTimeout(() => addComponent(componentType), index * 100);
    });
    
    setSelectedTemplate(templateId);
  }, [addComponent]);

  // Save report
  const saveReport = useCallback(() => {
    const report = {
      title: reportTitle,
      description: reportDescription,
      components,
      layout: layoutMode,
      template: selectedTemplate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave?.(report);
    setLastSaved(new Date());
  }, [reportTitle, reportDescription, components, layoutMode, selectedTemplate, onSave]);

  // Export report
  const exportReport = useCallback((format: 'pdf' | 'excel' | 'powerpoint') => {
    setIsGenerating(true);
    
    const report = {
      title: reportTitle,
      description: reportDescription,
      components,
      format
    };

    // Simulate export process
    setTimeout(() => {
      onExport?.(report, format);
      setIsGenerating(false);
    }, 2000);
  }, [reportTitle, reportDescription, components, onExport]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (components.length > 0) {
        saveReport();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [components, saveReport]);

  // Drag and drop handlers
  const handleDragStart = (componentType: string) => {
    draggedComponent.current = componentType;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedComponent.current) {
      addComponent(draggedComponent.current);
      draggedComponent.current = null;
    }
  };

  // Render component preview
  const renderComponentPreview = (component: ReportComponent) => {
    const Icon = component.icon;
    
    return (
      <DaisyCard
        key={component.id}
        className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
          selectedComponent === component.id ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          width: component.position.width,
          height: component.position.height,
          minWidth: '300px',
          minHeight: '200px'
        }}
        onClick={() => setSelectedComponent(component.id)}
      >
        <DaisyCardHeader className="pb-2">
          <DaisyCardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span>{component.title}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Open component settings
                }}
              >
                <Settings className="w-3 h-3" />
              </DaisyButton>
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeComponent(component.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </DaisyButton>
            </div>
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="pt-0">
          {renderComponentContent(component)}
        </DaisyCardContent>
      </DaisyCard>
    );
  };

  // Render component content based on type
  const renderComponentContent = (component: ReportComponent) => {
    switch (component.type) {
      case 'risk-summary':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{component.data?.highRisks}</div>
                <div className="text-xs text-gray-500">High Risks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{component.data?.totalRisks}</div>
                <div className="text-xs text-gray-500">Total Risks</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Risk Score</span>
              <DaisyBadge variant="secondary">{component.data?.riskScore}/5</DaisyBadge>
            </div>
          </div>
        );
      
      case 'compliance-status':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{component.data?.overallScore}%</div>
              <div className="text-xs text-gray-500">Overall Compliance</div>
            </div>
            <div className="space-y-2">
              {component.data?.frameworks?.slice(0, 2).map((framework: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{framework.name}</span>
                  <DaisyBadge variant={framework.status === 'compliant' ? 'default' : 'secondary'}>
                    {framework.score}%
                  </DaisyBadge>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'trend-analysis':
        return (
          <div className="space-y-3">
            <div className="h-24 bg-gradient-to-r from-blue-100 to-green-100 rounded flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-xs text-gray-500 text-center">
              Risk trends over last 3 months
            </div>
          </div>
        );
      
      case 'ai-recommendations':
        return (
          <div className="space-y-3">
            {component.data?.recommendations?.slice(0, 2).map((rec: any, index: number) => (
              <div key={index} className="p-2 bg-purple-50 rounded">
                <div className="font-medium text-sm">{rec.title}</div>
                <div className="text-xs text-gray-600">{rec.description}</div>
                <DaisyBadge variant="outline" className="text-xs mt-1">
                  {rec.confidence}% confidence
                </DaisyBadge>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <component.icon className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">{component.description}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`h-screen flex bg-gray-50 ${className}`}>
      {/* Component Library Sidebar */}
      {showComponentLibrary && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Component Library</h3>
            <p className="text-sm text-gray-600">Drag components to build your report</p>
          </div>
          
          {/* Templates */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Quick Templates</h4>
            <div className="space-y-2">
              {REPORT_TEMPLATES.map(template => (
                <DaisyButton
                  key={template.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => loadTemplate(template.id)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {template.name}
                </DaisyButton>
              ))}
            </div>
          </div>
          
          {/* Components by Category */}
          <div className="flex-1 overflow-y-auto">
            {['summary', 'charts', 'tables', 'insights', 'compliance'].map(category => (
              <div key={category} className="p-4 border-b border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3 capitalize">{category}</h4>
                <div className="space-y-2">
                  {REPORT_COMPONENTS
                    .filter(comp => comp.category === category)
                    .map(component => {
                      const Icon = component.icon;
                      return (
                        <div
                          key={component.type}
                          className="p-3 border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={() => handleDragStart(component.type)}
                          onClick={() => addComponent(component.type)}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">{component.title}</div>
                              <div className="text-xs text-gray-500">{component.description}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Report Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DaisyInput
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="font-semibold text-lg border-none p-0 h-auto focus:ring-0"
                placeholder="Report Title"
              />
              <DaisyBadge variant="secondary" className="text-xs">
                {components.length} components
              </DaisyBadge>
            </div>
            
            <div className="flex items-center space-x-2">
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setShowComponentLibrary(!showComponentLibrary)}
              >
                <Layout className="w-4 h-4" />
              </DaisyButton>
              
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-4 h-4" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </DaisyButton>
              
              <DaisyButton variant="outline" size="sm" onClick={saveReport}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </DaisyButton>
              
              <div className="flex items-center space-x-1">
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('pdf')}
                  disabled={isGenerating}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Export'}
                </DaisyButton>
                
                <DaisyButton variant="outline" size="sm" onClick={() => onShare?.({ title: reportTitle, components })}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DaisyButton>
              </div>
            </div>
          </div>
          
          {lastSaved && (
            <div className="text-xs text-gray-500 mt-2">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 p-6 overflow-auto"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {components.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Start Building Your Report</h3>
                <p className="text-sm mb-4">
                  Drag components from the sidebar or choose a template to get started
                </p>
                <DaisyButton onClick={() => loadTemplate('executive-summary')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Use Executive Summary Template
                </DaisyButton>
              </div>
            </div>
          ) : (
            <div className={`space-y-6 ${layoutMode === 'grid' ? 'grid grid-cols-2 gap-6' : ''}`}>
              {components.map(component => renderComponentPreview(component))}
            </div>
          )}
        </div>
      </div>

      {/* Component Settings Panel */}
      {selectedComponent && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Component Settings</h3>
          {/* Component configuration options would go here */}
          <div className="space-y-4">
            <div>
              <DaisyLabel>Data Source</DaisyLabel>
              <select className="w-full mt-1 p-2 border border-gray-300 rounded">
                <option>Live Data</option>
                <option>Sample Data</option>
                <option>Custom Query</option>
              </select>
            </div>
            <div>
              <DaisyLabel>Time Range</DaisyLabel>
              <select className="w-full mt-1 p-2 border border-gray-300 rounded">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last year</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <DaisyLabel>Refresh Rate</DaisyLabel>
              <select className="w-full mt-1 p-2 border border-gray-300 rounded">
                <option>Real-time</option>
                <option>Every 5 minutes</option>
                <option>Hourly</option>
                <option>Daily</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveReportBuilder; 