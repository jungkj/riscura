'use client';

import React, { useState, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Table,
  FileText,
  Image,
  Filter,
  Settings,
  Plus,
  Trash2,
  Copy,
  Download,
  Save,
  Eye,
  Grid,
  List
} from 'lucide-react';
import { ReportWidget, ReportConfig, VisualizationConfig } from '@/lib/reporting/engine';
import { ChartWidget } from './widgets/ChartWidget';
import { TableWidget } from './widgets/TableWidget';
import { KPIWidget } from './widgets/KPIWidget';
import { FilterWidget } from './widgets/FilterWidget';
import { TextWidget } from './widgets/TextWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface AvailableWidget {
  id: string;
  type: 'chart' | 'table' | 'kpi' | 'text' | 'filter';
  name: string;
  icon: React.ReactNode;
  description: string;
  defaultConfig: Partial<ReportWidget>;
}

const availableWidgets: AvailableWidget[] = [
  {
    id: 'bar-chart',
    type: 'chart',
    name: 'Bar Chart',
    icon: <BarChart className="w-5 h-5" />,
    description: 'Display data as vertical bars',
    defaultConfig: {
      visualization: {
        chartType: 'bar',
        showLegend: true,
        showGrid: true,
      },
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
  },
  {
    id: 'line-chart',
    type: 'chart',
    name: 'Line Chart',
    icon: <LineChart className="w-5 h-5" />,
    description: 'Display trends over time',
    defaultConfig: {
      visualization: {
        chartType: 'line',
        showLegend: true,
        showGrid: true,
      },
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
  },
  {
    id: 'pie-chart',
    type: 'chart',
    name: 'Pie Chart',
    icon: <PieChart className="w-5 h-5" />,
    description: 'Display proportions as a pie',
    defaultConfig: {
      visualization: {
        chartType: 'pie',
        showLegend: true,
      },
      position: { x: 0, y: 0, w: 4, h: 4 },
    },
  },
  {
    id: 'data-table',
    type: 'table',
    name: 'Data Table',
    icon: <Table className="w-5 h-5" />,
    description: 'Display data in tabular format',
    defaultConfig: {
      position: { x: 0, y: 0, w: 8, h: 6 },
    },
  },
  {
    id: 'kpi',
    type: 'kpi',
    name: 'KPI Metric',
    icon: <div className="w-5 h-5 rounded border-2 border-current flex items-center justify-center text-xs font-bold">KPI</div>,
    description: 'Display key performance indicators',
    defaultConfig: {
      position: { x: 0, y: 0, w: 3, h: 2 },
    },
  },
  {
    id: 'text',
    type: 'text',
    name: 'Text Block',
    icon: <FileText className="w-5 h-5" />,
    description: 'Add custom text and formatting',
    defaultConfig: {
      position: { x: 0, y: 0, w: 6, h: 2 },
    },
  },
  {
    id: 'filter',
    type: 'filter',
    name: 'Filter Control',
    icon: <Filter className="w-5 h-5" />,
    description: 'Add interactive filters',
    defaultConfig: {
      position: { x: 0, y: 0, w: 4, h: 1 },
    },
  },
];

interface ReportBuilderProps {
  reportConfig?: ReportConfig;
  onSave: (config: ReportConfig) => void;
  onPreview: (config: ReportConfig) => void;
  onExport: (config: ReportConfig, format: string) => void;
}

export function ReportBuilder({ 
  reportConfig, 
  onSave, 
  onPreview, 
  onExport 
}: ReportBuilderProps) {
  const [config, setConfig] = useState<Partial<ReportConfig>>(reportConfig || {
    name: 'New Report',
    description: '',
    type: 'dashboard',
    layout: {
      widgets: [],
      gridSettings: {
        cols: 12,
        rowHeight: 60,
        margin: [10, 10],
        containerPadding: [10, 10],
        breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      },
    },
    filters: [],
    scheduledRuns: [],
    permissions: [],
    isPublic: false,
    tags: [],
  });

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<AvailableWidget | null>(null);
  const gridRef = useRef<any>(null);

  // Handle adding new widget to the canvas
  const addWidget = useCallback((widgetTemplate: AvailableWidget) => {
    const newWidget: ReportWidget = {
      id: `widget_${Date.now()}`,
      type: widgetTemplate.type,
      title: widgetTemplate.name,
      position: widgetTemplate.defaultConfig.position || { x: 0, y: 0, w: 4, h: 3 },
      dataSource: {
        type: 'query',
        source: '',
        parameters: {},
      },
      visualization: widgetTemplate.defaultConfig.visualization || {},
      filters: [],
    };

    setConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: [...(prev.layout?.widgets || []), newWidget],
      },
    }));

    setSelectedWidget(newWidget.id);
  }, []);

  // Handle widget deletion
  const deleteWidget = useCallback((widgetId: string) => {
    setConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: prev.layout?.widgets.filter(w => w.id !== widgetId) || [],
      },
    }));
    
    if (selectedWidget === widgetId) {
      setSelectedWidget(null);
    }
  }, [selectedWidget]);

  // Handle widget duplication
  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = config.layout?.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const newWidget: ReportWidget = {
      ...widget,
      id: `widget_${Date.now()}`,
      title: `${widget.title} (Copy)`,
      position: {
        ...widget.position,
        x: Math.min(widget.position.x + 1, (config.layout?.gridSettings.cols || 12) - widget.position.w),
        y: widget.position.y + 1,
      },
    };

    setConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: [...(prev.layout?.widgets || []), newWidget],
      },
    }));
  }, [config.layout]);

  // Handle widget configuration updates
  const updateWidget = useCallback((widgetId: string, updates: Partial<ReportWidget>) => {
    setConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: prev.layout?.widgets.map(w => 
          w.id === widgetId ? { ...w, ...updates } : w
        ) || [],
      },
    }));
  }, []);

  // Handle grid layout changes
  const handleLayoutChange = useCallback((layouts: Layout[]) => {
    setConfig(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: prev.layout?.widgets.map(widget => {
          const layout = layouts.find(l => l.i === widget.id);
          return layout ? {
            ...widget,
            position: { x: layout.x, y: layout.y, w: layout.w, h: layout.h },
          } : widget;
        }) || [],
      },
    }));
  }, []);

  // Handle drag end for adding widgets
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'widget-palette' && destination.droppableId === 'canvas') {
      const widget = availableWidgets[source.index];
      addWidget(widget);
    }
  }, [addWidget]);

  // Convert widgets to grid layout format
  const gridLayouts = config.layout?.widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 2,
    minH: 1,
  })) || [];

  // Render widget based on type
  const renderWidget = (widget: ReportWidget) => {
    const isSelected = selectedWidget === widget.id;
    
    const baseProps = {
      widget,
      isSelected,
      onSelect: () => setSelectedWidget(widget.id),
      onUpdate: (updates: Partial<ReportWidget>) => updateWidget(widget.id, updates),
      onDelete: () => deleteWidget(widget.id),
      onDuplicate: () => duplicateWidget(widget.id),
    };

    switch (widget.type) {
      case 'chart':
        return <ChartWidget key={widget.id} {...baseProps} />;
      case 'table':
        return <TableWidget key={widget.id} {...baseProps} />;
      case 'kpi':
        return <KPIWidget key={widget.id} {...baseProps} />;
      case 'filter':
        return <FilterWidget key={widget.id} {...baseProps} />;
      case 'text':
        return <TextWidget key={widget.id} {...baseProps} />;
      default:
        return <div key={widget.id}>Unknown widget type</div>;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Input
            value={config.name || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Report Name"
            className="text-lg font-semibold"
          />
          <Badge variant="outline">{config.type}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(config as ReportConfig)}
          >
            <Grid className="w-4 h-4 mr-2" />
            Full Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <List className="w-4 h-4 mr-2" />
            {showCode ? 'Visual' : 'JSON'}
          </Button>
          <Select onValueChange={(format) => onExport(config as ReportConfig, format)}>
            <SelectTrigger className="w-32">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => onSave(config as ReportConfig)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {!previewMode && (
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Widget Palette */}
            <div className="w-64 border-r bg-gray-50 p-4">
              <h3 className="font-semibold mb-4">Widget Palette</h3>
              <Droppable droppableId="widget-palette">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {availableWidgets.map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                {widget.icon}
                                <span className="font-medium text-sm">{widget.name}</span>
                              </div>
                              <p className="text-xs text-gray-600">{widget.description}</p>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        )}

        {/* Main Canvas */}
        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            {showCode ? (
              <div className="h-full">
                <textarea
                  className="w-full h-full p-4 border rounded font-mono text-sm"
                  value={JSON.stringify(config, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setConfig(parsed);
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                />
              </div>
            ) : (
              <Droppable droppableId="canvas">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="h-full bg-white border rounded"
                  >
                    <ResponsiveGridLayout
                      ref={gridRef}
                      className="layout"
                      layouts={{ lg: gridLayouts }}
                      breakpoints={config.layout?.gridSettings.breakpoints}
                      cols={{ lg: config.layout?.gridSettings.cols || 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                      rowHeight={config.layout?.gridSettings.rowHeight || 60}
                      onLayoutChange={handleLayoutChange}
                      isDraggable={!previewMode}
                      isResizable={!previewMode}
                      margin={config.layout?.gridSettings.margin || [10, 10]}
                      containerPadding={config.layout?.gridSettings.containerPadding || [10, 10]}
                    >
                      {config.layout?.widgets.map(renderWidget)}
                    </ResponsiveGridLayout>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>

          {/* Properties Panel */}
          {!previewMode && selectedWidget && (
            <div className="w-80 border-l bg-gray-50 p-4">
              <WidgetPropertiesPanel
                widget={config.layout?.widgets.find(w => w.id === selectedWidget)!}
                onUpdate={(updates) => updateWidget(selectedWidget, updates)}
                onClose={() => setSelectedWidget(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Widget Properties Panel Component
interface WidgetPropertiesPanelProps {
  widget: ReportWidget;
  onUpdate: (updates: Partial<ReportWidget>) => void;
  onClose: () => void;
}

function WidgetPropertiesPanel({ widget, onUpdate, onClose }: WidgetPropertiesPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Widget Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={widget.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="refresh">Refresh Interval (seconds)</Label>
            <Input
              id="refresh"
              type="number"
              value={widget.refreshInterval || ''}
              onChange={(e) => onUpdate({ refreshInterval: Number(e.target.value) || undefined })}
            />
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div>
            <Label htmlFor="dataSource">Data Source</Label>
            <Select 
              value={widget.dataSource.type} 
              onValueChange={(value) => onUpdate({ 
                dataSource: { ...widget.dataSource, type: value as any } 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="query">Database Query</SelectItem>
                <SelectItem value="api">External API</SelectItem>
                <SelectItem value="static">Static Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source">Source</Label>
            <textarea
              id="source"
              className="w-full p-2 border rounded text-sm"
              rows={4}
              value={widget.dataSource.source}
              onChange={(e) => onUpdate({
                dataSource: { ...widget.dataSource, source: e.target.value }
              })}
              placeholder={
                widget.dataSource.type === 'query' 
                  ? 'SELECT * FROM risks WHERE status = "open"'
                  : widget.dataSource.type === 'api'
                  ? 'https://api.example.com/data'
                  : '{"data": []}'
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          {widget.type === 'chart' && (
            <>
              <div>
                <Label htmlFor="chartType">Chart Type</Label>
                <Select 
                  value={widget.visualization.chartType || 'bar'} 
                  onValueChange={(value) => onUpdate({ 
                    visualization: { ...widget.visualization, chartType: value as any } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showLegend"
                  checked={widget.visualization.showLegend || false}
                  onChange={(e) => onUpdate({
                    visualization: { ...widget.visualization, showLegend: e.target.checked }
                  })}
                />
                <Label htmlFor="showLegend">Show Legend</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showGrid"
                  checked={widget.visualization.showGrid || false}
                  onChange={(e) => onUpdate({
                    visualization: { ...widget.visualization, showGrid: e.target.checked }
                  })}
                />
                <Label htmlFor="showGrid">Show Grid</Label>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 