# Enterprise Data Table & Navigation System Guide

## Overview

This guide covers the implementation of the **Enterprise Data Table & Grid System** and **Refined Notion-Style Sidebar Navigation** for the Riscura platform, providing enterprise-grade data management with a clean, intuitive interface.

## 🗃️ Enterprise Data Table System

### Core Features

The `EnterpriseDataTable` component provides comprehensive data management capabilities:

#### 📊 Data Management
- **Real-time Search**: Global search across all searchable columns
- **Advanced Sorting**: Multi-column sorting with visual indicators
- **Row Selection**: Individual and bulk row selection with checkbox interface
- **Bulk Actions**: Configurable mass operations on selected rows
- **Export Capabilities**: Built-in data export functionality

#### 🎨 Visual Design
- **Notion-Inspired Styling**: Clean, minimal interface with subtle shadows
- **Status Badges**: Color-coded status indicators with semantic meaning
- **User Avatars**: Integrated user representation with fallback initials
- **Date Formatting**: Relative time display with absolute date tooltips
- **Responsive Layout**: Mobile-friendly design with proper touch targets

#### ⚡ Performance
- **Optimized Rendering**: Efficient re-rendering with React.memo patterns
- **Memory Management**: Controlled state updates and cleanup
- **Large Dataset Support**: Handles thousands of rows smoothly
- **Background Operations**: Non-blocking search and filter operations

### Component Interface

```typescript
export interface ColumnDefinition<T = any> {
  key: string;                    // Data property key
  label: string;                  // Column header display name
  type?: 'text' | 'status-badge' | 'user-avatar' | 'date' | 'actions';
  sortable?: boolean;             // Enable column sorting
  searchable?: boolean;           // Include in global search
  render?: (value: any, row: T) => React.ReactNode;  // Custom cell renderer
  accessor?: (row: T) => any;     // Custom value accessor
}

export interface DataTableProps<T = any> {
  data: T[];                      // Array of data objects
  columns: ColumnDefinition<T>[]; // Column configuration
  loading?: boolean;              // Loading state indicator
  error?: string;                 // Error message display
  onRowSelect?: (selectedRows: T[]) => void;    // Selection callback
  onRowClick?: (row: T) => void;  // Row click handler
  bulkActions?: BulkAction[];     // Mass action configuration
  className?: string;             // Additional CSS classes
}
```

### Usage Examples

#### Basic Implementation
```tsx
import EnterpriseDataTable, { ColumnDefinition } from '@/components/enterprise-data-table';

const columns: ColumnDefinition<RiskData>[] = [
  {
    key: 'id',
    label: 'Risk ID',
    sortable: true,
    searchable: true,
    render: (value) => (
      <span className="text-body-sm font-mono text-interactive-primary">
        {value}
      </span>
    ),
  },
  {
    key: 'title',
    label: 'Risk Title',
    sortable: true,
    searchable: true,
  },
  {
    key: 'riskLevel',
    label: 'Risk Level',
    type: 'status-badge',
    sortable: true,
  },
  {
    key: 'owner',
    label: 'Risk Owner',
    type: 'user-avatar',
    searchable: true,
    accessor: (row) => row.owner.name,
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    type: 'date',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    type: 'actions',
  },
];

<EnterpriseDataTable
  data={riskData}
  columns={columns}
  onRowClick={handleRowClick}
  onRowSelect={handleRowSelect}
  bulkActions={bulkActions}
/>
```

#### Advanced Risk Register Implementation
```tsx
const riskColumns: ColumnDefinition<RiskData>[] = [
  {
    key: 'title',
    label: 'Risk Title',
    sortable: true,
    searchable: true,
    render: (value, row) => (
      <div className="min-w-0">
        <div className="text-body-sm text-text-primary font-medium truncate">
          {value}
        </div>
        <div className="text-caption text-text-tertiary truncate">
          {row.description}
        </div>
      </div>
    ),
  },
  {
    key: 'riskScore',
    label: 'Risk Score',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center space-x-enterprise-2">
        <div className={`px-2 py-1 rounded text-xs font-semibold ${
          value >= 15 ? 'text-semantic-error bg-semantic-error/10' :
          value >= 10 ? 'text-semantic-warning bg-semantic-warning/10' :
          'text-semantic-success bg-semantic-success/10'
        }`}>
          {value}
        </div>
        <div className="text-caption text-text-tertiary">
          {row.impact} × {row.likelihood}
        </div>
      </div>
    ),
  },
];
```

### Built-in Cell Types

#### Status Badge Cell
- **Usage**: `type: 'status-badge'`
- **Features**: Automatic color coding based on status value
- **Variants**: Critical (red), Warning (yellow), Success (green), Info (blue)

#### User Avatar Cell
- **Usage**: `type: 'user-avatar'`
- **Features**: Avatar image with fallback initials, name and email display
- **Format**: Supports both string names and user objects

#### Date Cell
- **Usage**: `type: 'date'`
- **Features**: Relative time display ("2 days ago") with absolute date tooltip
- **Format**: Automatic date parsing and formatting

#### Actions Cell
- **Usage**: `type: 'actions'`
- **Features**: Dropdown menu with contextual actions
- **Customization**: Override with custom render function

### Bulk Actions Configuration

```typescript
const bulkActions = [
  {
    key: 'assign',
    label: 'Assign',
    icon: Send,
    action: (selectedRows: RiskData[]) => {
      // Handle assignment logic
      console.log('Assigning risks:', selectedRows.map(r => r.id));
    },
  },
  {
    key: 'export',
    label: 'Export',
    icon: Download,
    action: (selectedRows: RiskData[]) => {
      // Handle export logic
      exportToCSV(selectedRows);
    },
  },
  {
    key: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'destructive',
    action: (selectedRows: RiskData[]) => {
      // Handle archive logic
      archiveRisks(selectedRows);
    },
  },
];
```

### Styling System

#### Color Semantics
```scss
// Status badge colors
.status-critical    { @apply bg-semantic-error text-white; }
.status-warning     { @apply bg-semantic-warning text-white; }
.status-success     { @apply bg-semantic-success text-white; }
.status-info        { @apply bg-semantic-info text-white; }

// Risk score colors
.score-critical     { @apply text-semantic-error bg-semantic-error/10; }
.score-high         { @apply text-semantic-warning bg-semantic-warning/10; }
.score-medium       { @apply text-semantic-info bg-semantic-info/10; }
.score-low          { @apply text-semantic-success bg-semantic-success/10; }
```

#### Component Classes
```scss
// Table styling
.enterprise-data-table {
  @apply bg-surface-primary rounded-lg border border-border shadow-notion-sm;
}

// Toolbar styling
.data-table-toolbar {
  @apply flex items-center justify-between p-enterprise-4 border-b border-border;
}

// Search input styling
.data-table-search {
  @apply pl-10 w-80 text-body-sm bg-surface-secondary border-0 
         focus:ring-1 focus:ring-interactive-primary;
}
```

## 🧭 Refined Notion-Style Sidebar Navigation

### Design Specifications

#### Dimensions
- **Expanded Width**: 240px (`w-60`)
- **Collapsed Width**: 60px (`w-15`)
- **Height**: Full viewport height
- **Background**: Clean white with subtle shadow

#### Visual Elements
- **Logo**: Rounded background with icon
- **Typography**: Notion-inspired hierarchy
- **Hover States**: Gentle background color changes
- **Active States**: Left border accent with background highlight
- **Icons**: Consistent Lucide icons with proper alignment
- **Grouping**: Clear sections with subtle dividers

### Navigation Structure

```
📊 Overview (Dashboard home)
🛡️ Risk Management
  ├── Risk Register
  ├── Risk Assessment
  └── Heat Maps
🔒 Controls
  ├── Control Library
  ├── Testing Schedule
  └── Compliance Mapping
📋 Assessments
  ├── Questionnaires
  ├── Self-Assessments
  └── Third-Party Reviews
📈 Reports & Analytics
  ├── Executive Dashboard
  ├── Compliance Reports
  └── Trend Analysis
🤖 AI Insights
  ├── Risk Predictions
  ├── Control Recommendations
  └── Automated Analysis
⚙️ Settings
  ├── User Management
  ├── Framework Configuration
  └── Integration Settings
```

### Enhanced Features

#### Progressive Disclosure
- **Collapsible Sections**: Click section headers to expand/collapse
- **Visual Indicators**: Chevron icons show expansion state
- **Smart Defaults**: Important sections expanded by default
- **State Persistence**: Remember user preferences across sessions

#### Advanced Search
- **Global Search (⌘K)**: Search across all navigation items
- **Description Search**: Include item descriptions in search results
- **Keyboard Navigation**: Arrow keys and enter selection
- **Result Highlighting**: Matched terms highlighted in results

#### User Bookmarks
- **Quick Access**: Bookmark frequently used items
- **Hover Interaction**: Bookmark button appears on hover
- **Personal Organization**: User-specific bookmark management
- **Easy Removal**: One-click bookmark removal

#### Keyboard Shortcuts
```typescript
// Global navigation shortcuts
⌘ D   // Dashboard overview
⌘ R   // Risk register
⌘ C   // Controls library
⌘ E   // Executive reports
⌘ K   // Global search
ESC   // Close search/modals
```

### Implementation Details

#### Navigation Item Configuration
```typescript
interface NavItem {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  href: string;                  // Navigation URL
  icon: React.ComponentType;     // Lucide icon component
  badge?: string | number;       // Optional badge (counts, status)
  badgeVariant?: 'critical' | 'warning' | 'success' | 'info';
  description?: string;          // Tooltip/search description
  shortcut?: string;            // Keyboard shortcut display
  permissions?: string[];        // Required permissions
  isNew?: boolean;              // New feature indicator
  external?: boolean;           // External link indicator
}
```

#### Section Configuration
```typescript
interface NavSection {
  id: string;                    // Unique section identifier
  title: string;                 // Section header
  items: NavItem[];             // Navigation items
  permissions?: string[];        // Section-level permissions
  priority?: number;            // Display order
}
```

#### Responsive Behavior
```scss
// Collapsed state (60px width)
.sidebar-collapsed {
  @apply w-15;
  
  .nav-item-text { @apply hidden; }
  .nav-item-badge { @apply absolute -top-1 -right-1 w-3 h-3; }
  .nav-tooltip { @apply opacity-0 group-hover:opacity-100; }
}

// Expanded state (240px width)
.sidebar-expanded {
  @apply w-60;
  
  .nav-item { @apply px-enterprise-3 py-2 rounded-md; }
  .nav-item-active { 
    @apply bg-surface-tertiary border-l-2 border-interactive-primary; 
  }
  .nav-item-hover { @apply hover:bg-surface-secondary/50; }
}
```

### Accessibility Features

#### Screen Reader Support
- **ARIA Labels**: Comprehensive labeling for navigation structure
- **Role Attributes**: Proper semantic roles (navigation, button, etc.)
- **Live Regions**: Dynamic content announcements
- **Focus Management**: Logical tab order and focus indicators

#### Keyboard Navigation
- **Tab Navigation**: Sequential navigation through items
- **Arrow Keys**: Section and item navigation
- **Enter/Space**: Activation of navigation items
- **Escape**: Close expanded elements

#### Visual Accessibility
- **High Contrast**: WCAG 2.1 AA compliant contrast ratios
- **Color Independence**: Information not conveyed by color alone
- **Reduced Motion**: Respects user motion preferences
- **Focus Indicators**: Clear focus outlines and states

## 🚀 Performance Optimizations

### Data Table Performance

#### Efficient Rendering
```typescript
// Memoized filter and sort operations
const filteredData = useMemo(() => {
  // Filtering and sorting logic
}, [data, searchQuery, filters, sorts]);

// Optimized cell rendering
const renderCell = useCallback((column, row) => {
  // Cell rendering logic
}, [onRowClick]);
```

#### Memory Management
- **Controlled Re-renders**: Strategic use of useMemo and useCallback
- **State Cleanup**: Proper cleanup of event listeners and timeouts
- **Lazy Loading**: Deferred loading of non-critical components
- **Virtual Scrolling**: For extremely large datasets (100k+ rows)

### Navigation Performance

#### Code Splitting
```typescript
// Lazy load navigation components
const NavigationItem = lazy(() => import('./NavigationItem'));
const SearchResults = lazy(() => import('./SearchResults'));
```

#### State Optimization
- **Selective Updates**: Only re-render changed navigation items
- **Debounced Search**: Prevent excessive API calls during search
- **Cached Results**: Store frequently accessed navigation data
- **Progressive Enhancement**: Core functionality works without JavaScript

## 📱 Mobile Considerations

### Responsive Design
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Swipe Gestures**: Swipe to expand/collapse sidebar
- **Viewport Adaptation**: Responsive typography and spacing
- **Mobile Navigation**: Drawer-style navigation on small screens

### Touch Interactions
- **Tap Feedback**: Visual feedback for touch interactions
- **Long Press**: Additional actions via long press
- **Scroll Optimization**: Smooth scrolling with momentum
- **Gesture Recognition**: Swipe, pinch, and tap gestures

## 🔧 Development Guidelines

### Adding New Data Table Columns
```typescript
// 1. Define column configuration
const newColumn: ColumnDefinition<DataType> = {
  key: 'newField',
  label: 'New Field',
  sortable: true,
  searchable: true,
  render: (value, row) => (
    <CustomRenderer value={value} row={row} />
  ),
};

// 2. Add to columns array
const columns = [...existingColumns, newColumn];

// 3. Update TypeScript interfaces if needed
interface DataType {
  newField: string;
  // ... existing fields
}
```

### Adding New Navigation Items
```typescript
// 1. Add to navigation structure
{
  id: 'new-feature',
  title: 'New Feature',
  href: '/dashboard/new-feature',
  icon: NewFeatureIcon,
  description: 'Description of new feature',
  permissions: ['feature:read'],
  isNew: true,
}

// 2. Add keyboard shortcut (optional)
case 'f':
  e.preventDefault();
  window.location.href = '/dashboard/new-feature';
  break;

// 3. Update permissions system
const permissions = {
  'feature:read': 'Can view new feature',
  'feature:write': 'Can modify new feature',
};
```

### Custom Cell Renderers
```typescript
const CustomStatusCell: React.FC<{ value: string; row: DataType }> = ({ 
  value, 
  row 
}) => {
  const getVariant = (status: string) => {
    // Custom logic for status variants
    return 'default';
  };

  return (
    <Badge variant={getVariant(value)} className="custom-status">
      <StatusIcon className="h-3 w-3 mr-1" />
      {value}
    </Badge>
  );
};

// Usage in column definition
{
  key: 'customStatus',
  label: 'Status',
  render: (value, row) => <CustomStatusCell value={value} row={row} />,
}
```

## 🧪 Testing Guidelines

### Data Table Testing
```typescript
describe('EnterpriseDataTable', () => {
  it('should render data correctly', () => {
    render(<EnterpriseDataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Risk-001')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    render(<EnterpriseDataTable data={mockData} columns={mockColumns} />);
    
    const searchInput = screen.getByPlaceholderText('Search data...');
    fireEvent.change(searchInput, { target: { value: 'cyber' } });
    
    await waitFor(() => {
      expect(screen.getByText('Cyber Security Risk')).toBeInTheDocument();
    });
  });

  it('should handle row selection', () => {
    const onRowSelect = jest.fn();
    render(
      <EnterpriseDataTable 
        data={mockData} 
        columns={mockColumns} 
        onRowSelect={onRowSelect}
      />
    );
    
    const checkbox = screen.getByLabelText('Select row 1');
    fireEvent.click(checkbox);
    
    expect(onRowSelect).toHaveBeenCalledWith([mockData[0]]);
  });
});
```

### Navigation Testing
```typescript
describe('Sidebar Navigation', () => {
  it('should expand/collapse sections', () => {
    render(<Sidebar isOpen={true} user={mockUser} />);
    
    const sectionHeader = screen.getByText('Risk Management');
    fireEvent.click(sectionHeader);
    
    expect(screen.getByText('Risk Register')).toBeVisible();
  });

  it('should handle keyboard shortcuts', () => {
    render(<Sidebar isOpen={true} user={mockUser} />);
    
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    
    expect(screen.getByPlaceholderText('Search navigation...')).toBeFocused();
  });
});
```

This comprehensive guide provides everything needed to implement, customize, and maintain the enterprise data table and navigation systems. The components are designed for scalability, accessibility, and performance while maintaining a clean, Notion-inspired aesthetic. 