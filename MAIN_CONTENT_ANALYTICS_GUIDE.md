# Main Content Area & Analytics Platform Guide

## Overview

This guide covers the implementation of the **Notion-Style Main Content Area Layout** and **Advanced Analytics & Visualization Platform** for the Riscura platform, providing enterprise-grade content management with a clean, spacious interface.

## 🎨 Main Content Area Layout

### Design Specifications

The main content area follows Notion's spacious, clean layout principles:

#### **Header Structure**
- **Page Title**: Large, bold typography with breadcrumb navigation
- **Action Buttons**: Primary and secondary actions in top-right corner
- **Page Statistics**: Inline metrics with trend indicators
- **Subtle Separation**: Shadow/border separation with consistent padding
- **Consistent Spacing**: 24px padding throughout

#### **Content Layout**
- **Maximum Width**: 1200px with centered alignment (configurable)
- **Card-based Design**: Clean cards for different sections
- **Proper Spacing**: 24px between major sections, 16px between related items
- **Clean Backgrounds**: Subtle borders instead of heavy shadows
- **Interactive Elements**: Hover states and focus management

### Component Architecture

#### **MainContentArea Component**
```typescript
export interface MainContentAreaProps {
  children: ReactNode;
  
  // Header Configuration
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  
  // Actions
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  
  // Page Statistics
  stats?: PageStats[];
  
  // Layout Options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  headerSeparator?: boolean;
  contentPadding?: boolean;
  
  // Styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}
```

#### **Usage Example**
```tsx
<MainContentArea
  title="Executive Dashboard"
  subtitle="Comprehensive overview of organizational risk posture"
  breadcrumbs={[
    { label: 'Dashboards', href: '/dashboard' },
    { label: 'Executive Overview', current: true },
  ]}
  primaryAction={{
    label: 'Create Risk',
    onClick: handleCreateRisk,
    icon: Plus,
    shortcut: '⌘ N',
  }}
  secondaryActions={[
    {
      label: 'Export',
      onClick: handleExport,
      icon: Download,
      variant: 'outline',
    },
  ]}
  stats={[
    {
      label: 'risks',
      value: 127,
      trend: 'down',
      trendValue: '5.2%',
      variant: 'default',
    },
  ]}
  maxWidth="2xl"
>
  {/* Content goes here */}
</MainContentArea>
```

### Content Organization Components

#### **ContentSection Component**
Groups related content with optional titles and actions:

```tsx
<ContentSection 
  title="Performance Overview"
  subtitle="Real-time analytics and key performance indicators"
  action={{
    label: 'View Details',
    onClick: handleViewDetails,
    icon: BarChart3,
    variant: 'outline',
  }}
  spacing="normal"
>
  {/* Section content */}
</ContentSection>
```

#### **ContentCard Component**
Individual content containers with Notion-style design:

```tsx
<ContentCard
  title="SOC 2 Type II"
  subtitle="Security & Availability"
  hover
  className="shadow-notion-sm"
  footer={
    <div className="flex items-center justify-between">
      <span className="text-caption text-text-tertiary">Last audit: Dec 2023</span>
      <div className="flex items-center space-x-enterprise-1">
        <CheckCircle className="h-4 w-4 text-semantic-success" />
        <span className="text-body-sm font-medium text-semantic-success">95% Complete</span>
      </div>
    </div>
  }
>
  {/* Card content */}
</ContentCard>
```

### Interactive Elements

#### **Tables**
- **Clean Lines**: Minimal borders with subtle separators
- **Hover States**: Gentle background color changes
- **Sortable Headers**: Clear visual indicators
- **Responsive Design**: Mobile-friendly scrolling

#### **Forms**
- **Floating Labels**: Smooth label transitions
- **Focus States**: Clear focus indicators with color changes
- **Validation Styling**: Error and success state indicators
- **Accessibility**: Proper ARIA labels and keyboard navigation

#### **Buttons**
- **Rounded Corners**: Consistent border radius
- **Proper Spacing**: Adequate padding and margins
- **Clear Hierarchy**: Primary, secondary, and outline variants
- **Interactive States**: Hover, focus, and active feedback

#### **Cards**
- **Minimal Borders**: Subtle border styling
- **Hover Elevation**: Gentle shadow increases on hover
- **Consistent Padding**: Standardized internal spacing
- **Responsive Layout**: Proper grid behavior

## 📊 Advanced Analytics & Visualization Platform

### Core Features

#### **Real-time Capabilities**
- **WebSocket Integration**: Live data updates
- **Streaming Data**: Continuous metric monitoring
- **Update Notifications**: Visual indicators for data changes
- **Collaborative Viewing**: Shared dashboard sessions

#### **Chart Types**
- **Statistical Charts**: Bar, line, area, scatter plots
- **Geographical Visualizations**: Maps and location-based data
- **Temporal Analysis**: Time-series and trend visualization
- **Hierarchical Data**: Tree maps and organizational charts
- **Network Visualizations**: Relationship and flow diagrams

#### **Interactivity**
- **Drill-down Navigation**: Click to explore deeper data
- **Cross-filtering**: Interactive data filtering across charts
- **Rich Tooltips**: Contextual information on hover
- **Annotation System**: Add notes and markers to visualizations

### Component Architecture

#### **AnalyticsDashboard Component**
```typescript
export interface DashboardProps {
  title: string;
  subtitle?: string;
  widgets: Widget[];
  layout?: 'grid' | 'masonry';
  realTimeEnabled?: boolean;
  onWidgetClick?: (widget: Widget) => void;
  onExport?: (widget: Widget, format: string) => void;
  className?: string;
}
```

#### **Widget Configuration**
```typescript
export interface Widget {
  id: string;
  title: string;
  type: 'kpi-cards' | 'bar-chart' | 'line-chart' | 'pie-chart' | 'heatmap' | 'progress-rings' | 'table';
  size: 'sm' | 'md' | 'lg' | 'xl';
  data: any;
  config?: any;
  realTime?: boolean;
  drillDown?: string;
  exportable?: boolean;
}
```

#### **KPI Metrics**
```typescript
export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  target?: number;
  format?: 'number' | 'currency' | 'percentage';
  icon?: React.ComponentType<any>;
  color?: 'default' | 'success' | 'warning' | 'error';
}
```

### Executive Dashboard Implementation

#### **Sample KPI Configuration**
```typescript
const executiveKPIs = [
  {
    id: 'total-risks',
    label: 'Total Risks',
    value: 127,
    previousValue: 134,
    trend: 'down',
    trendPercentage: 5.2,
    target: 100,
    format: 'number',
    icon: Shield,
    color: 'default',
  },
  {
    id: 'critical-risks',
    label: 'Critical Risks',
    value: 8,
    previousValue: 12,
    trend: 'down',
    trendPercentage: 33.3,
    target: 5,
    format: 'number',
    icon: AlertTriangle,
    color: 'error',
  },
];
```

#### **Dashboard Widgets**
```typescript
const dashboardWidgets = [
  {
    id: 'kpi-overview',
    title: 'Key Performance Indicators',
    type: 'kpi-cards',
    size: 'xl',
    data: executiveKPIs,
    realTime: true,
    exportable: true,
  },
  {
    id: 'risk-trends',
    title: 'Risk Trends',
    type: 'line-chart',
    size: 'lg',
    data: riskTrendsData,
    realTime: true,
    drillDown: '/dashboard/risks',
    exportable: true,
  },
];
```

#### **Complete Dashboard Usage**
```tsx
<AnalyticsDashboard
  title="Executive Analytics"
  subtitle="Real-time risk and compliance metrics"
  widgets={dashboardWidgets}
  layout="grid"
  realTimeEnabled={true}
  onWidgetClick={handleWidgetClick}
  onExport={handleExport}
/>
```

### Advanced Features

#### **Real-time Updates**
```typescript
// Automatic updates every 30 seconds
useEffect(() => {
  if (!realTimeEnabled) return;

  const interval = setInterval(() => {
    setLastUpdated(new Date());
    // Trigger data refresh
  }, 30000);

  return () => clearInterval(interval);
}, [realTimeEnabled]);
```

#### **Export Capabilities**
- **Multiple Formats**: PNG, PDF, SVG, Excel
- **Custom Styling**: Branded export templates
- **Batch Export**: Multiple widgets simultaneously
- **Scheduled Reports**: Automated report generation

#### **Performance Optimization**
- **Virtual Scrolling**: Handle large datasets efficiently
- **Lazy Loading**: Load widgets on demand
- **Caching Strategy**: Intelligent data caching
- **Background Updates**: Non-blocking data refresh

### Chart Components

#### **KPI Cards**
- **Trend Indicators**: Visual trend arrows and percentages
- **Progress Bars**: Target achievement visualization
- **Real-time Status**: Live data indicators
- **Interactive Drill-down**: Click to navigate to detailed views

#### **Chart Containers**
- **Unified Actions**: Export, expand, drill-down buttons
- **Real-time Badges**: Live update indicators
- **Responsive Design**: Adaptive sizing
- **Loading States**: Skeleton loading animations

#### **Placeholder System**
Ready for integration with charting libraries:
- **Chart.js Integration**: Ready for implementation
- **D3.js Support**: Advanced visualization capability
- **Recharts Compatibility**: React-native chart library
- **Custom Renderers**: Extensible chart system

## 🎯 Implementation Examples

### Executive Dashboard Page
```tsx
export const ExecutiveDashboard: React.FC = () => {
  return (
    <MainContentArea
      title="Executive Dashboard"
      subtitle="Comprehensive overview of organizational risk posture"
      breadcrumbs={[
        { label: 'Dashboards', href: '/dashboard' },
        { label: 'Executive Overview', current: true },
      ]}
      primaryAction={{
        label: 'Create Risk',
        onClick: handleCreateRisk,
        icon: Plus,
        shortcut: '⌘ N',
      }}
      stats={[
        { label: 'risks', value: 127, trend: 'down', trendValue: '5.2%' },
        { label: 'critical', value: 8, trend: 'down', trendValue: '33%' },
        { label: 'compliance', value: '94.2%', trend: 'up', trendValue: '2.6%' },
      ]}
      maxWidth="2xl"
    >
      {/* Analytics Dashboard */}
      <ContentSection title="Performance Overview">
        <AnalyticsDashboard
          widgets={dashboardWidgets}
          layout="grid"
          realTimeEnabled={true}
          onWidgetClick={handleWidgetClick}
          onExport={handleExport}
        />
      </ContentSection>

      {/* Risk Activity Table */}
      <ContentSection title="Recent Risk Activity">
        <ContentCard hover className="shadow-notion-sm">
          <RiskRegisterTable />
        </ContentCard>
      </ContentSection>

      {/* Compliance Cards */}
      <ContentSection title="Compliance Frameworks">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-6">
          {/* Individual compliance cards */}
        </div>
      </ContentSection>

      {/* Quick Actions */}
      <ContentSection title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-enterprise-4">
          {/* Action cards */}
        </div>
      </ContentSection>
    </MainContentArea>
  );
};
```

### Risk Register Page
```tsx
export const RiskRegisterPage: React.FC = () => {
  return (
    <MainContentArea
      title="Risk Register"
      subtitle="Comprehensive view of organizational risks"
      breadcrumbs={[
        { label: 'Risk Management', href: '/dashboard/risks' },
        { label: 'Risk Register', current: true },
      ]}
      primaryAction={{
        label: 'Add Risk',
        onClick: handleAddRisk,
        icon: Plus,
      }}
      secondaryActions={[
        { label: 'Import', onClick: handleImport, icon: Upload },
        { label: 'Export', onClick: handleExport, icon: Download },
      ]}
      stats={[
        { label: 'total risks', value: 127 },
        { label: 'high priority', value: 23, variant: 'destructive' },
        { label: 'overdue', value: 5, variant: 'warning' },
      ]}
    >
      <ContentSection>
        <RiskRegisterTable />
      </ContentSection>
    </MainContentArea>
  );
};
```

## 🚀 Performance Guidelines

### Main Content Area
- **Lazy Loading**: Load sections progressively
- **Virtual Scrolling**: Handle large content efficiently
- **Optimized Rendering**: Strategic use of React.memo
- **State Management**: Efficient state updates

### Analytics Platform
- **Data Streaming**: WebSocket connections for real-time updates
- **Caching Strategy**: Intelligent data caching with TTL
- **Background Processing**: Non-blocking data operations
- **Memory Management**: Proper cleanup of chart instances

## 📱 Responsive Design

### Breakpoint Strategy
```scss
// Mobile First Approach
.main-content {
  @apply px-enterprise-4 py-enterprise-4;
  
  @screen md {
    @apply px-enterprise-6 py-enterprise-6;
  }
  
  @screen lg {
    @apply px-enterprise-8 py-enterprise-8;
  }
}

// Grid Layouts
.analytics-grid {
  @apply grid grid-cols-1 gap-enterprise-4;
  
  @screen md {
    @apply grid-cols-2 gap-enterprise-6;
  }
  
  @screen lg {
    @apply grid-cols-4 gap-enterprise-6;
  }
}
```

### Mobile Optimizations
- **Touch Targets**: Minimum 44px for mobile interaction
- **Responsive Typography**: Fluid text scaling
- **Gesture Support**: Swipe and pinch interactions
- **Collapsible Sections**: Space-efficient mobile layout

## 🔧 Customization Guide

### Theme Integration
```typescript
// Color customization
const customTheme = {
  colors: {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    enterprise: {
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
    },
  },
};
```

### Widget Development
```typescript
// Custom widget implementation
const CustomWidget: React.FC<WidgetProps> = ({ data, config }) => {
  return (
    <ChartContainer
      title="Custom Visualization"
      onExport={() => exportChart('custom-viz')}
      onExpand={() => navigateToDetail()}
    >
      <CustomVisualization data={data} config={config} />
    </ChartContainer>
  );
};

// Register widget type
const widgetTypes = {
  'custom-viz': CustomWidget,
  // ... other widget types
};
```

### Layout Customization
```typescript
// Custom layout configurations
export const layoutConfig = {
  maxWidths: {
    'content': '1200px',
    'wide': '1400px',
    'full': '100%',
  },
  spacing: {
    'tight': 'space-y-enterprise-4',
    'normal': 'space-y-enterprise-6',
    'loose': 'space-y-enterprise-8',
  },
  shadows: {
    'notion-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'notion-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    'notion-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
};
```

## 🧪 Testing Guidelines

### Component Testing
```typescript
describe('MainContentArea', () => {
  it('should render title and subtitle correctly', () => {
    render(
      <MainContentArea 
        title="Test Title" 
        subtitle="Test Subtitle"
      >
        <div>Content</div>
      </MainContentArea>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should handle breadcrumb navigation', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/dashboard' },
      { label: 'Current', current: true },
    ];
    
    render(
      <MainContentArea title="Test" breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </MainContentArea>
    );
    
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });
});

describe('AnalyticsDashboard', () => {
  it('should render widgets correctly', () => {
    const widgets = [
      {
        id: 'test-widget',
        title: 'Test Widget',
        type: 'kpi-cards',
        size: 'md',
        data: mockKPIData,
      },
    ];
    
    render(
      <AnalyticsDashboard 
        title="Test Dashboard" 
        widgets={widgets}
      />
    );
    
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });

  it('should handle real-time updates', async () => {
    const { rerender } = render(
      <AnalyticsDashboard 
        title="Test" 
        widgets={widgets}
        realTimeEnabled={true}
      />
    );
    
    expect(screen.getByText('Real-time enabled')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
describe('Executive Dashboard Integration', () => {
  it('should integrate all components correctly', () => {
    render(<ExecutiveDashboard />);
    
    // Check main layout
    expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
    
    // Check analytics widgets
    expect(screen.getByText('Total Risks')).toBeInTheDocument();
    expect(screen.getByText('Critical Risks')).toBeInTheDocument();
    
    // Check data table
    expect(screen.getByText('Risk Register')).toBeInTheDocument();
    
    // Check compliance cards
    expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
  });
});
```

This comprehensive system provides a complete Notion-inspired interface for enterprise risk management, combining clean design principles with powerful analytics capabilities. The modular architecture allows for easy customization and extension while maintaining consistent design patterns throughout the application. 