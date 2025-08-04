'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import { Plus } from 'lucide-react';
// import {
  ActionIcons,
  StatusIcons,
  DataIcons,
  RiskManagementIcons,
  NavigationIcons,
} from '@/components/icons/IconLibrary'
import { Brain, X, Plus } from 'lucide-react';
import { LoadingStates } from '@/components/states/LoadingState';
import { EmptyStates } from '@/components/states/EmptyState';

// Dashboard types and interfaces
interface DashboardWidget {
  id: string
  type: string;
  title: string;
  description?: string;
  component: React.ComponentType<WidgetProps>;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  configurable: boolean;
  category: string;
  icon: React.ComponentType<any>;
  priority: number; // For smart defaults
  userTypes: string[]; // Which user types should see this by default
}

interface WidgetSize {
  width: number; // Grid columns (1-12)
  height: number; // Grid rows (1-6)
}

interface WidgetInstance {
  id: string;
  widgetId: string;
  position: { x: number; y: number }
  size: WidgetSize;
  config: any;
  visible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetInstance[];
  isDefault: boolean;
  userType?: string;
  lastModified: Date;
}

interface WidgetProps {
  config: any;
  onConfigChange: (_config: any) => void;
  size: WidgetSize;
  isEditing: boolean;
}

interface CustomizableDashboardProps {
  userId: string;
  userType: string;
  onLayoutSave?: (layout: DashboardLayout) => Promise<void>;
  onLayoutLoad?: (_userId: string) => Promise<DashboardLayout[]>;
  className?: string;
}

// Sample widgets for demonstration
const sampleWidgets: DashboardWidget[] = [
  {
    id: 'risk-overview',
    type: 'risk-overview',
    title: 'Risk Overview',
    description: 'High-level risk metrics and trends',
    component: RiskOverviewWidget,
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    maxSize: { width: 12, height: 4 },
    configurable: true,
    category: 'Risk Management',
    icon: RiskManagementIcons.Risk,
    priority: 1,
    userTypes: ['risk-manager', 'executive', 'admin'],
  },
  {
    id: 'compliance-status',
    type: 'compliance-status',
    title: 'Compliance Status',
    description: 'Current compliance framework status',
    component: ComplianceStatusWidget,
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    maxSize: { width: 8, height: 4 },
    configurable: true,
    category: 'Compliance',
    icon: RiskManagementIcons.Compliance,
    priority: 2,
    userTypes: ['compliance-officer', 'executive', 'admin'],
  },
  {
    id: 'recent-activities',
    type: 'recent-activities',
    title: 'Recent Activities',
    description: 'Latest risk and compliance activities',
    component: RecentActivitiesWidget,
    defaultSize: { width: 4, height: 4 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 6, height: 6 },
    configurable: false,
    category: 'Activity',
    icon: DataIcons.Activity,
    priority: 3,
    userTypes: ['risk-manager', 'compliance-officer', 'auditor'],
  },
  {
    id: 'ai-insights',
    type: 'ai-insights',
    title: 'AI Insights',
    description: 'Smart recommendations and insights',
    component: AIInsightsWidget,
    defaultSize: { width: 8, height: 3 },
    minSize: { width: 6, height: 2 },
    maxSize: { width: 12, height: 4 },
    configurable: true,
    category: 'AI & Analytics',
    icon: Brain,
    priority: 4,
    userTypes: ['risk-manager', 'executive'],
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    description: 'Frequently used actions and shortcuts',
    component: QuickActionsWidget,
    defaultSize: { width: 4, height: 2 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 3 },
    configurable: true,
    category: 'Productivity',
    icon: ActionIcons.Settings,
    priority: 5,
    userTypes: ['risk-manager', 'compliance-officer', 'auditor', 'admin'],
  },
  {
    id: 'metrics-chart',
    type: 'metrics-chart',
    title: 'Key Metrics',
    description: 'Customizable metrics and KPIs',
    component: MetricsChartWidget,
    defaultSize: { width: 8, height: 4 },
    minSize: { width: 6, height: 3 },
    maxSize: { width: 12, height: 6 },
    configurable: true,
    category: 'Analytics',
    icon: DataIcons.BarChart3,
    priority: 6,
    userTypes: ['executive', 'risk-manager'],
  },
]

// Widget Components (simplified for demonstration)
const RiskOverviewWidget = ({ config, onConfigChange, size, isEditing }: WidgetProps) => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">12</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">28</div>
          <div className="text-sm text-gray-600">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">45</div>
          <div className="text-sm text-gray-600">Medium</div>
        </div>
      </div>
      {Boolean(isEditing) && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
          Configure risk categories and thresholds
        </div>
      )}
    </div>
  )
}

const ComplianceStatusWidget = ({ config, onConfigChange, size, isEditing }: WidgetProps) => {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">ISO 27001</span>
          <span className="text-sm font-medium text-green-600">89%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">GDPR</span>
          <span className="text-sm font-medium text-yellow-600">78%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">SOX</span>
          <span className="text-sm font-medium text-green-600">92%</span>
        </div>
      </div>
      {Boolean(isEditing) && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
          Select compliance frameworks to display
        </div>
      )}
    </div>
  );
}

const RecentActivitiesWidget = ({ config, onConfigChange, size, isEditing }: WidgetProps) => {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
          <div className="flex-1">
            <div className="text-sm font-medium">Risk assessment completed</div>
            <div className="text-xs text-gray-500">2 hours ago</div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
          <div className="flex-1">
            <div className="text-sm font-medium">Control updated</div>
            <div className="text-xs text-gray-500">4 hours ago</div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
          <div className="flex-1">
            <div className="text-sm font-medium">Compliance review due</div>
            <div className="text-xs text-gray-500">1 day ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AIInsightsWidget = ({ config, onConfigChange, size, isEditing }: WidgetProps) => {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-md">
          <div className="text-sm font-medium text-blue-900">Trend Alert</div>
          <div className="text-xs text-blue-700">Cybersecurity risks increased 15% this month</div>
        </div>
        <div className="p-3 bg-green-50 rounded-md">
          <div className="text-sm font-medium text-green-900">Recommendation</div>
          <div className="text-xs text-green-700">Consider implementing MFA for admin accounts</div>
        </div>
      </div>
      {Boolean(isEditing) && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
          Configure AI insight types and frequency
        </div>
      )}
    </div>
  );
}

const QuickActionsWidget = ({ config, onConfigChange, size, isEditing }: WidgetProps) => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-2">
        <button className="p-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
          New Risk
        </button>
        <button className="p-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
          Review
        </button>
        <button className="p-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
          Report
        </button>
        <button className="p-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
          Audit
        </button>
      </div>
      {Boolean(isEditing) && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
          Customize quick action buttons
        </div>
      )}
    </div>
  );
}

const MetricsChartWidget = ({ config, onConfigChange, size, isEditing }: WidgetProps) => {
  return (
    <div className="p-4">
      <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-center">
          <DataIcons.BarChart3 size="lg" color="secondary" />
          <div className="text-sm text-gray-600 mt-2">Chart Visualization</div>
        </div>
      </div>
      {Boolean(isEditing) && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
          Select metrics and chart type
        </div>
      )}
    </div>
  );
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  userId,
  userType,
  onLayoutSave,
  onLayoutLoad,
  className = '',
}) => {
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);
  const [availableLayouts, setAvailableLayouts] = useState<DashboardLayout[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Load user layouts and create smart defaults
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      try {
        let layouts: DashboardLayout[] = [];

        if (onLayoutLoad) {
          layouts = await onLayoutLoad(userId);
        }

        if (layouts.length === 0) {
          // Create smart default layout based on user type
          const defaultLayout = createSmartDefaultLayout(userType)
          layouts = [defaultLayout];
          setCurrentLayout(defaultLayout);
        } else {
          // Use the default layout or the first one
          const defaultLayout = layouts.find((l) => l.isDefault) || layouts[0]
          setCurrentLayout(defaultLayout);
        }

        setAvailableLayouts(layouts);
      } catch (error) {
        // console.error('Failed to load dashboard:', error)
        // Fallback to smart default
        const defaultLayout = createSmartDefaultLayout(userType)
        setCurrentLayout(defaultLayout);
        setAvailableLayouts([defaultLayout]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [userId, userType, onLayoutLoad]);

  // Create smart default layout based on user type and widget priorities
  const createSmartDefaultLayout = (userType: string): DashboardLayout => {
    const relevantWidgets = sampleWidgets
      .filter((widget) => widget.userTypes.includes(userType))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6); // Limit to 6 widgets for default layout

    const widgets: WidgetInstance[] = [];
    let currentX = 0;
    let currentY = 0;

    relevantWidgets.forEach((widget, index) => {
      const size = widget.defaultSize;

      // Check if widget fits in current row
      if (currentX + size.width > 12) {
        currentX = 0
        currentY += Math.max(...widgets.slice(-3).map((w) => w.size.height)); // Move to next row
      }

      widgets.push({
        id: `instance-${widget.id}-${Date.now()}-${index}`,
        widgetId: widget.id,
        position: { x: currentX, y: currentY },
        size: size,
        config: {},
        visible: true,
      });

      currentX += size.width;
    });

    return {
      id: `default-${userType}-${Date.now()}`,
      name: `Default ${userType.replace('-', ' ')} Dashboard`,
      description: 'Smart default layout based on your role',
      widgets,
      isDefault: true,
      userType,
      lastModified: new Date(),
    }
  }

  // Save current layout
  const saveLayout = async () => {
    if (!currentLayout || !onLayoutSave) return

    try {
      const updatedLayout = {
        ...currentLayout,
        lastModified: new Date(),
      }

      await onLayoutSave(updatedLayout);
      setCurrentLayout(updatedLayout);

      // Update available layouts
      setAvailableLayouts((prev) =>
        prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout))
      )
    } catch (error) {
      // console.error('Failed to save layout:', error)
    }
  }

  // Add widget to dashboard
  const addWidget = (widgetId: string) => {
    if (!currentLayout) return

    const widget = sampleWidgets.find((w) => w.id === widgetId);
    if (!widget) return;

    // Find available position
    const position = findAvailablePosition(widget.defaultSize)

    const newInstance: WidgetInstance = {
      id: `instance-${widgetId}-${Date.now()}`,
      widgetId,
      position,
      size: widget.defaultSize,
      config: {},
      visible: true,
    }

    setCurrentLayout((prev) =>
      prev
        ? {
            ...prev,
            widgets: [...prev.widgets, newInstance],
          }
        : null
    );

    setShowWidgetLibrary(false);
  }

  // Remove widget from dashboard
  const removeWidget = (instanceId: string) => {
    if (!currentLayout) return

    setCurrentLayout((prev) =>
      prev
        ? {
            ...prev,
            widgets: prev.widgets.filter((w) => w.id !== instanceId),
          }
        : null
    );
  }

  // Find available position for new widget
  const findAvailablePosition = (size: WidgetSize): { x: number; y: number } => {
    if (!currentLayout) return { x: 0, y: 0 }

    // Simple algorithm to find first available position
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x <= 12 - size.width; x++) {
        const isOccupied = currentLayout.widgets.some((widget) => {
          const wx = widget.position.x;
          const wy = widget.position.y;
          const ww = widget.size.width;
          const wh = widget.size.height;

          return !(x >= wx + ww || x + size.width <= wx || y >= wy + wh || y + size.height <= wy);
        });

        if (!isOccupied) {
          return { x, y }
        }
      }
    }

    return { x: 0, y: 0 }
  }

  // Update widget configuration
  const updateWidgetConfig = (instanceId: string, config: any) => {
    if (!currentLayout) return

    setCurrentLayout((prev) =>
      prev
        ? {
            ...prev,
            widgets: prev.widgets.map((widget) =>
              widget.id === instanceId ? { ...widget, config } : widget
            ),
          }
        : null
    );
  }

  // Render widget instance
  const renderWidget = (instance: WidgetInstance) => {
    const widget = sampleWidgets.find((w) => w.id === instance.widgetId)
    if (!widget || !instance.visible) return null;

    const WidgetComponent = widget.component;

    return (
      <div
        key={instance.id}
        className="bg-white border border-gray-200 rounded-lg shadow-sm relative group"
        style={{
          gridColumn: `span ${instance.size.width}`,
          gridRow: `span ${instance.size.height}`,
        }}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <widget.icon size="sm" color="secondary" />
            <h3 className="font-medium text-gray-900 text-sm">{widget.title}</h3>
          </div>

          {Boolean(isEditing) && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {widget.configurable && (
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Configure widget"
                >
                  <ActionIcons.Settings size="xs" />
                </button>
              )}
              <button
                onClick={() => removeWidget(instance.id)}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Remove widget"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Widget Content */}
        <WidgetComponent
          config={instance.config}
          onConfigChange={(config) => updateWidgetConfig(instance.id, config)}
          size={instance.size}
          isEditing={isEditing}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <LoadingStates.Dashboard />
      </div>
    );
  }

  if (!currentLayout) {
    return (
      <div className={`p-6 ${className}`}>
        <EmptyStates.NoData
          title="No dashboard layout"
          description="Unable to load or create a dashboard layout."
        />
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentLayout.name}</h1>
          {currentLayout.description && (
            <p className="text-sm text-gray-600 mt-1">{currentLayout.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Layout Selector */}
          {availableLayouts.length > 1 && (
            <select
              value={currentLayout.id}
              onChange={(e) => {
                const layout = availableLayouts.find((l) => l.id === e.target.value);
                if (layout) setCurrentLayout(layout);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableLayouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          )}

          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isEditing
                ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <ActionIcons.Edit size="xs" className="mr-2" />
            {isEditing ? 'Done Editing' : 'Customize'}
          </button>

          {/* Add Widget */}
          {Boolean(isEditing) && (
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add Widget
            </button>
          )}

          {/* Save Layout */}
          {Boolean(isEditing) && onLayoutSave && (
            <button
              onClick={saveLayout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
            >
              <ActionIcons.Save size="xs" className="mr-2" />
              Save Layout
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-12 gap-4 auto-rows-min"
        style={{ minHeight: '400px' }}
      >
        {currentLayout.widgets.map(renderWidget)}
      </div>

      {/* Empty State */}
      {currentLayout.widgets.length === 0 && (
        <div className="text-center py-12">
          <EmptyStates.NoData
            title="No widgets added"
            description="Add widgets to customize your dashboard experience."
          />
          {Boolean(isEditing) && (
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add Your First Widget
            </button>
          )}
        </div>
      )}

      {/* Widget Library Modal */}
      {Boolean(showWidgetLibrary) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Widget Library</h2>
              <button
                onClick={() => setShowWidgetLibrary(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleWidgets.map((widget) => {
                const isAdded = currentLayout.widgets.some((w) => w.widgetId === widget.id);

                return (
                  <div
                    key={widget.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <widget.icon size="md" color="secondary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{widget.title}</h3>
                        <p className="text-sm text-gray-600">{widget.description}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                          {widget.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => addWidget(widget.id)}
                      disabled={isAdded}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isAdded
                          ? 'text-gray-500 bg-gray-100 cursor-not-allowed'
                          : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                      }`}
                    >
                      {isAdded ? 'Already Added' : 'Add Widget'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomizableDashboard;
