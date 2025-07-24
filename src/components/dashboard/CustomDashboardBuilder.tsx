'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import {
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Shield,
  AlertTriangle,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit,
  Copy,
  Save,
  Download,
  Upload,
  Grid3X3,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Palette,
  Layout as LayoutIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Make ResponsiveGridLayout responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types and configurations
interface WidgetConfig {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  configurable: boolean;
  component: React.ComponentType<any>;
}

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  visible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layouts: { [key: string]: Layout[] };
  isDefault?: boolean;
  isShared?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sample widget components
const SampleChartWidget = ({ title, config }: { title: string; config: any }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-2 border-b">
      <h4 className="font-medium text-sm">{title}</h4>
      <DaisyBadge variant="outline" className="text-xs">Chart</DaisyBadge>
    </div>
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <BarChart3 className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Chart Widget</p>
        <p className="text-xs">Type: {config.chartType || 'bar'}</p>
      </div>
    </div>
  </div>
);

const SampleMetricWidget = ({ title, config }: { title: string; config: any }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-2 border-b">
      <h4 className="font-medium text-sm">{title}</h4>
      <DaisyBadge variant="outline" className="text-xs">Metric</DaisyBadge>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{config.value || '123'}</div>
        <p className="text-sm text-gray-600">{config.label || 'Total Count'}</p>
      </div>
    </div>
  </div>
);

const SampleTableWidget = ({ title, config }: { title: string; config: any }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-2 border-b">
      <h4 className="font-medium text-sm">{title}</h4>
      <DaisyBadge variant="outline" className="text-xs">Table</DaisyBadge>
    </div>
    <div className="flex-1 p-2">
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between p-2 bg-gray-50 rounded text-xs">
            <span>Item {i}</span>
            <span className="font-medium">{Math.floor(Math.random() * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Widget library
const widgetLibrary: WidgetConfig[] = [
  {
    id: 'bar-chart',
    type: 'chart',
    name: 'Bar Chart',
    description: 'Display data in vertical bars',
    icon: <BarChart3 className="w-4 h-4" />,
    category: 'Charts',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 12, h: 8 },
    configurable: true,
    component: SampleChartWidget
  },
  {
    id: 'pie-chart',
    type: 'chart',
    name: 'Pie Chart',
    description: 'Display data in circular segments',
    icon: <PieChart className="w-4 h-4" />,
    category: 'Charts',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 8, h: 8 },
    configurable: true,
    component: SampleChartWidget
  },
  {
    id: 'line-chart',
    type: 'chart',
    name: 'Line Chart',
    description: 'Display trends over time',
    icon: <LineChart className="w-4 h-4" />,
    category: 'Charts',
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    configurable: true,
    component: SampleChartWidget
  },
  {
    id: 'metric-card',
    type: 'metric',
    name: 'Metric Card',
    description: 'Display single key metric',
    icon: <Activity className="w-4 h-4" />,
    category: 'Metrics',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 4 },
    configurable: true,
    component: SampleMetricWidget
  },
  {
    id: 'risk-summary',
    type: 'risk',
    name: 'Risk Summary',
    description: 'Overview of risk metrics',
    icon: <Shield className="w-4 h-4" />,
    category: 'Risk Management',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    configurable: true,
    component: SampleTableWidget
  },
  {
    id: 'alert-list',
    type: 'alerts',
    name: 'Alert List',
    description: 'Recent alerts and notifications',
    icon: <DaisyAlertTriangle className="w-4 h-4" />,
    category: 'Monitoring',
    defaultSize: { w: 4, h: 6 },
    minSize: { w: 3, h: 4 },
    maxSize: { w: 8, h: 12 },
    configurable: true,
    component: SampleTableWidget
  },
  {
    id: 'user-activity',
    type: 'activity',
    name: 'User Activity',
    description: 'Recent user activities',
    icon: <Users className="w-4 h:4" />,
    category: 'Analytics',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 8 },
    configurable: true,
    component: SampleTableWidget
  }
];

// Drag and drop types
const ItemTypes = {
  WIDGET: 'widget'
};

// Draggable widget from library
const DraggableWidget = ({ widget }: { widget: WidgetConfig }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.WIDGET,
    item: { widget },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-3 border rounded-lg cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        {widget.icon}
        <span className="font-medium text-sm">{widget.name}</span>
      </div>
      <p className="text-xs text-gray-600">{widget.description}</p>
      <div className="flex items-center justify-between mt-2">
        <DaisyBadge variant="outline" className="text-xs">{widget.category}</DaisyBadge>
        <span className="text-xs text-gray-500">{widget.defaultSize.w}x{widget.defaultSize.h}</span>
      </div>
    </div>
  );
};

// Dashboard builder props
interface CustomDashboardBuilderProps {
  initialLayout?: DashboardLayout;
  onSave?: (layout: DashboardLayout) => void;
  onLoad?: (layoutId: string) => void;
  onShare?: (layout: DashboardLayout) => void;
  className?: string;
}

export default function CustomDashboardBuilder({
  initialLayout,
  onSave,
  onLoad,
  onShare,
  className = ''
}: CustomDashboardBuilderProps) {
  const { toast } = useToast();
  
  // State management
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(
    initialLayout || {
      id: 'new-dashboard',
      name: 'New Dashboard',
      description: '',
      widgets: [],
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      isDefault: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );
  
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [breakpoint, setBreakpoint] = useState('lg');
  
  // Breakpoint configurations
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  
  // Widget categories
  const categories = useMemo(() => {
    const cats = new Set(widgetLibrary.map(w => w.category));
    return Array.from(cats);
  }, []);
  
  // Handle widget drop
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.WIDGET,
    drop: (item: { widget: WidgetConfig }, monitor) => {
      if (!monitor.didDrop()) {
        addWidget(item.widget);
      }
    },
  }));
  
  // Add widget to dashboard
  const addWidget = useCallback((widgetConfig: WidgetConfig) => {
    const newWidget: DashboardWidget = {
      id: `${widgetConfig.id}-${Date.now()}`,
      type: widgetConfig.type,
      title: widgetConfig.name,
      config: {},
      layout: {
        x: 0,
        y: 0,
        w: widgetConfig.defaultSize.w,
        h: widgetConfig.defaultSize.h
      },
      visible: true
    };
    
    setCurrentLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date()
    }));
    
    toast({
      title: 'Widget Added',
      description: `${widgetConfig.name} has been added to your dashboard.`,
    });
  }, [toast]);
  
  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    setCurrentLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date()
    }));
    
    if (selectedWidget === widgetId) {
      setSelectedWidget(null);
    }
    
    toast({
      title: 'Widget Removed',
      description: 'Widget has been removed from your dashboard.',
    });
  }, [selectedWidget, toast]);
  
  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setCurrentLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w),
      updatedAt: new Date()
    }));
  }, []);
  
  // Handle layout change
  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setCurrentLayout(prev => ({
      ...prev,
      layouts,
      updatedAt: new Date()
    }));
  }, []);
  
  // Save dashboard
  const saveDashboard = useCallback(() => {
    if (onSave) {
      onSave(currentLayout);
    } else {
      // Default save to localStorage
      const savedLayouts = JSON.parse(localStorage.getItem('dashboardLayouts') || '[]');
      const existingIndex = savedLayouts.findIndex((l: DashboardLayout) => l.id === currentLayout.id);
      
      if (existingIndex >= 0) {
        savedLayouts[existingIndex] = currentLayout;
      } else {
        savedLayouts.push(currentLayout);
      }
      
      localStorage.setItem('dashboardLayouts', JSON.stringify(savedLayouts));
    }
    
    toast({
      title: 'Dashboard Saved',
      description: `"${currentLayout.name}" has been saved successfully.`,
    });
  }, [currentLayout, onSave, toast]);
  
  // Export dashboard
  const exportDashboard = useCallback(() => {
    const dataStr = JSON.stringify(currentLayout, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLayout.name.replace(/\s+/g, '-').toLowerCase()}-dashboard.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Dashboard Exported',
      description: 'Dashboard configuration has been exported successfully.',
    });
  }, [currentLayout, toast]);
  
  // Render widget
  const renderWidget = useCallback((widget: DashboardWidget) => {
    const widgetConfig = widgetLibrary.find(w => w.id === widget.type);
    if (!widgetConfig) return null;
    
    const WidgetComponent = widgetConfig.component;
    
    return (
      <div
        key={widget.id}
        className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
          selectedWidget === widget.id ? 'ring-2 ring-blue-500' : ''
        } ${!widget.visible ? 'opacity-50' : ''}`}
        onClick={() => setSelectedWidget(widget.id)}
      >
        {isEditMode && (
          <div className="absolute top-1 right-1 z-10 flex space-x-1">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateWidget(widget.id, { visible: !widget.visible });
              }}
              className="h-6 w-6 p-0"
            >
              {widget.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </DaisyButton>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeWidget(widget.id);
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </DaisyButton>
          </div>
        )}
        <WidgetComponent title={widget.title} config={widget.config} />
      </div>
    );
  }, [isEditMode, selectedWidget, updateWidget, removeWidget]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex h-screen bg-gray-100 ${className}`}>
        {/* Widget Library Sidebar */}
        {showWidgetLibrary && (
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Widget Library</h3>
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWidgetLibrary(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </DaisyButton>
              </div>
              
              <DaisyTabs defaultValue={categories[0]} className="w-full">
                <DaisyTabsList className="grid w-full grid-cols-2">
                  {categories.slice(0, 2).map(category => (
                    <DaisyTabsTrigger key={category} value={category} className="text-xs">
                      {category}
                    </DaisyTabsTrigger>
                  ))}
                </DaisyTabsList>
                
                {categories.map(category => (
                  <DaisyTabsContent key={category} value={category} className="mt-4">
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {widgetLibrary
                          .filter(widget => widget.category === category)
                          .map(widget => (
                            <DraggableWidget key={widget.id} widget={widget} />
                          ))}
                      </div>
                    </ScrollArea>
                  </DaisyTabsContent>
                ))}
              </DaisyTabs>
            </div>
          </div>
        )}
        
        {/* Main Dashboard Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <LayoutIcon className="w-5 h-5 text-blue-600" />
                  <DaisyInput
                    value={currentLayout.name}
                    onChange={(e) => setCurrentLayout(prev => ({ ...prev, name: e.target.value }))}
                    className="font-semibold border-none p-0 h-auto focus-visible:ring-0"
                  />
                </div>
                
                <DaisyBadge variant={isEditMode ? 'default' : 'secondary'}>
                  {isEditMode ? 'Edit Mode' : 'View Mode'}
                </DaisyBadge>
              </div>
              
              <div className="flex items-center space-x-2">
                {!showWidgetLibrary && (
                  <DaisyButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWidgetLibrary(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Widgets
                  </DaisyButton>
                )}
                
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditMode ? 'Preview' : 'Edit'}
                </DaisyButton>
                
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={exportDashboard}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DaisyButton>
                
                <DaisyButton
                  size="sm"
                  onClick={saveDashboard}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </DaisyButton>
                
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </DaisyButton>
              </div>
            </div>
          </div>
          
          {/* Dashboard Canvas */}
          <div ref={drop as any} className="flex-1 p-4 overflow-auto">
            {currentLayout.widgets.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Empty Dashboard</h3>
                  <p className="text-sm mb-4">Drag widgets from the library to get started</p>
                  {!showWidgetLibrary && (
                    <DaisyButton onClick={() => setShowWidgetLibrary(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Open Widget Library
                    </DaisyButton>
                  )}
                </div>
              </div>
            ) : (
              <ResponsiveGridLayout
                className="layout"
                layouts={currentLayout.layouts}
                breakpoints={breakpoints}
                cols={cols}
                rowHeight={60}
                width={1200}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={setBreakpoint}
                margin={[16, 16]}
                containerPadding={[0, 0]}
              >
                {currentLayout.widgets.map(renderWidget)}
              </ResponsiveGridLayout>
            )}
          </div>
        </div>
        
        {/* Settings Dialog */}
        <DaisyDialog open={showSettings} onOpenChange={setShowSettings}>
          <DaisyDialogContent className="max-w-md">
            <DaisyDialogHeader>
              <DaisyDialogTitle>Dashboard Settings</DaisyDialogTitle>
            </DaisyDialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dashboard Name</label>
                <DaisyInput
                  value={currentLayout.name}
                  onChange={(e) => setCurrentLayout(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <DaisyInput
                  value={currentLayout.description || ''}
                  onChange={(e) => setCurrentLayout(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  placeholder="Optional description..."
                />
              </div>
              
              <DaisySeparator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Dashboard Info</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Widgets: {currentLayout.widgets.length}</p>
                  <p>Created: {currentLayout.createdAt.toLocaleDateString()}</p>
                  <p>Updated: {currentLayout.updatedAt.toLocaleDateString()}</p>
                  <p>Current Breakpoint: {breakpoint}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <DaisyButton variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </DaisyButton>
                <DaisyButton onClick={() => setShowSettings(false)}>
                  Save Changes
                </DaisyButton>
              </div>
            </div>
          </DaisyDialogContent>
        </DaisyDialog>
      </div>
    </DndProvider>
  );
} 