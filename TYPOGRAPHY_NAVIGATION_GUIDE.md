# Typography & Navigation System Guide

## Overview

This guide covers the implementation of the **Typography System Overhaul** and **Advanced Navigation & Layout System** for the Riscura platform, transforming it into a Notion-inspired, enterprise-grade interface.

## 🎨 Typography System

### Font Hierarchy

The typography system uses **Inter** font family across all weights for consistency and readability:

#### Font Weights
- `normal` (400): Regular body text
- `medium` (500): Emphasized body text and UI elements
- `semibold` (600): Headings and strong emphasis
- `bold` (700): Display headings and important calls-to-action
- `extrabold` (800): Large display text
- `black` (900): Hero text and brand elements

#### Typography Scale

```typescript
// Body Text Hierarchy
text-body-xs     // 12px, line-height: 1.4, weight: 400
text-body-sm     // 14px, line-height: 1.6, weight: 400
text-body-base   // 16px, line-height: 1.6, weight: 400
text-body-lg     // 18px, line-height: 1.6, weight: 400

// Heading Hierarchy
text-heading-xs   // 14px, line-height: 1.3, weight: 600
text-heading-sm   // 16px, line-height: 1.3, weight: 600
text-heading-base // 18px, line-height: 1.3, weight: 600
text-heading-lg   // 20px, line-height: 1.2, weight: 600
text-heading-xl   // 24px, line-height: 1.2, weight: 700
text-heading-2xl  // 30px, line-height: 1.2, weight: 700
text-heading-3xl  // 36px, line-height: 1.1, weight: 700

// Display Typography
text-display-sm   // 36px, line-height: 1.1, weight: 800
text-display-md   // 48px, line-height: 1.1, weight: 800
text-display-lg   // 60px, line-height: 1.1, weight: 900
text-display-xl   // 72px, line-height: 1.05, weight: 900

// Specialized Text
text-caption      // 12px, line-height: 1.4, weight: 500
text-label        // 14px, line-height: 1.4, weight: 500
text-overline     // 12px, line-height: 1.2, weight: 600, uppercase
text-link         // 16px, line-height: 1.6, weight: 500
text-button       // 14px, line-height: 1.4, weight: 500
text-button-lg    // 16px, line-height: 1.4, weight: 500
```

### Letter Spacing

Optimized letter spacing for better readability:

```css
/* Standard spacing */
letter-spacing: normal     /* 0 */
letter-spacing: tight      /* -0.01em */
letter-spacing: wide       /* 0.01em */

/* Display text specific */
letter-spacing: display-tight   /* -0.025em */
letter-spacing: display-normal  /* -0.015em */
letter-spacing: display-wide    /* -0.005em */
```

### Pre-built Typography Classes

#### Page Structure
```html
<!-- Page title -->
<h1 class="page-title">Risk Management Dashboard</h1>

<!-- Section title -->
<h2 class="section-title">Active Risks</h2>

<!-- Subsection title -->
<h3 class="subsection-title">High Priority Items</h3>

<!-- Card title -->
<h4 class="card-title">Risk Assessment</h4>

<!-- Card description -->
<p class="card-description">Review and update risk assessments quarterly</p>
```

#### Content Typography
```html
<!-- Rich content container -->
<div class="content-text">
  <h1>This becomes heading-3xl</h1>
  <h2>This becomes heading-2xl</h2>
  <p>This becomes properly spaced body text</p>
  <strong>This becomes semibold</strong>
  <em>This becomes italic secondary</em>
  <code>This becomes inline code</code>
</div>
```

#### Interactive Elements
```html
<!-- Link text -->
<a href="#" class="text-link">Navigate to reports</a>

<!-- Success/error states -->
<span class="text-success">Operation completed</span>
<span class="text-error">Validation failed</span>
<span class="text-warning">Review required</span>
```

## 🧭 Advanced Navigation System

### Navigation Structure

The navigation system features a comprehensive enterprise structure with:

#### Core Sections
1. **Overview** - Dashboard and executive metrics
2. **Risk Management** - Risk register, assessments, heat maps, scenarios
3. **Controls** - Control library, testing, effectiveness, compliance mapping
4. **Assessments** - Questionnaires, audits, vendor assessments
5. **Reports & Analytics** - Executive dashboard, compliance reports, trend analysis
6. **AI Insights** - Risk predictions, recommendations, automated analysis
7. **Administration** - User management, settings, integrations, security

### Enhanced Features

#### 1. Global Search (⌘K)
```typescript
// Triggered by keyboard shortcut or search button
// Searches across navigation items and descriptions
// Shows contextual results with shortcuts
```

#### 2. Quick Actions
- **New Risk** (⌘⇧R)
- **New Control** (⌘⇧C)
- **Search** (⌘K)

#### 3. Keyboard Navigation
```typescript
// Global shortcuts
⌘ D   // Dashboard
⌘ R   // Risk Register
⌘ C   // Controls
⌘ E   // Executive Reports
⌘ K   // Search
ESC   // Close search/modals
```

#### 4. User Bookmarks
- Bookmark frequently accessed items
- Hover to reveal bookmark button
- Persistent across sessions
- Quick removal

#### 5. Progressive Disclosure
- Collapsible sections with visual indicators
- Expanded state management
- Permission-based filtering
- Smart defaults

#### 6. Badge System
```typescript
interface NavItem {
  badge?: string | number;
  badgeVariant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  isNew?: boolean;
}
```

#### 7. Permissions Integration
```typescript
// Automatic filtering based on user permissions
permissions: ['risk:read', 'control:write', 'admin:read']
```

### Implementation Examples

#### Basic Navigation Item
```typescript
{
  id: 'risk-register',
  title: 'Risk Register',
  href: '/dashboard/risks',
  icon: Shield,
  badge: 23,
  badgeVariant: 'critical',
  description: 'Comprehensive risk inventory and tracking',
  shortcut: '⌘ R',
  permissions: ['risk:read'],
  analytics: true,
}
```

#### Section with Subsections
```typescript
{
  id: 'risk-management',
  title: 'Risk Management',
  priority: 2,
  permissions: ['risk:read'],
  items: [
    // Navigation items array
  ]
}
```

#### Quick Action
```typescript
{
  id: 'new-risk',
  title: 'New Risk',
  icon: Plus,
  href: '/dashboard/risks/new',
  shortcut: '⌘ ⇧ R',
}
```

### Responsive Behavior

#### Collapsed State (w-16)
- Icon-only navigation
- Hover tooltips with full information
- Badge indicators
- User avatar with role information

#### Expanded State (w-80)
- Full navigation with descriptions
- Search functionality
- Quick actions bar
- Bookmark management
- Collapsible sections

### Accessibility Features

#### Keyboard Support
- Full keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader optimization

#### Visual Accessibility
- High contrast ratios (WCAG 2.1 AA)
- Color-blind friendly badges
- Clear visual hierarchy
- Reduced motion support

## 🎯 Usage Guidelines

### Typography Best Practices

1. **Hierarchy**: Use consistent heading levels for content structure
2. **Contrast**: Ensure sufficient contrast ratios for accessibility
3. **Line Length**: Keep body text between 45-75 characters per line
4. **Spacing**: Use consistent spacing scale for visual rhythm

### Navigation Best Practices

1. **Permissions**: Always check user permissions before showing navigation items
2. **State Management**: Preserve user preferences (expanded sections, bookmarks)
3. **Performance**: Lazy load navigation icons and optimize for mobile
4. **Analytics**: Track navigation usage for UX optimization

### Development Examples

#### Adding New Navigation Item
```typescript
// 1. Add to navigation structure
{
  id: 'new-feature',
  title: 'New Feature',
  href: '/dashboard/new-feature',
  icon: NewIcon,
  description: 'Description of new feature',
  permissions: ['feature:read'],
  isNew: true,
}

// 2. Add keyboard shortcut (optional)
case 'f':
  e.preventDefault();
  window.location.href = '/dashboard/new-feature';
  break;

// 3. Add quick action (optional)
{
  id: 'new-feature-action',
  title: 'Create Feature',
  icon: Plus,
  href: '/dashboard/new-feature/new',
  shortcut: '⌘ ⇧ F',
}
```

#### Using Typography Classes
```jsx
// Component with proper typography
export function FeatureCard({ title, description, metrics }) {
  return (
    <div className="notion-card">
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
      <div className="text-caption text-text-tertiary">
        {metrics}
      </div>
    </div>
  );
}
```

## 🚀 Migration Guide

### From Existing System

1. **Update Tailwind Classes**: Replace old typography classes with new hierarchy
2. **Update Navigation Structure**: Add IDs and permissions to existing nav items
3. **Add Keyboard Shortcuts**: Implement global shortcut handling
4. **Test Accessibility**: Verify keyboard navigation and screen reader support

### Breaking Changes

- Typography font weights changed to lighter defaults
- Navigation sections now require `id` field
- Badge variants updated to match new design system
- Sidebar width increased from 64 to 80 (320px) in expanded state

## 📱 Mobile Considerations

- Touch-friendly navigation targets (44px minimum)
- Swipe gestures for sidebar toggle
- Responsive typography scaling
- Mobile-specific keyboard shortcuts (tap and hold)

This implementation provides a comprehensive, enterprise-grade navigation and typography system that matches Notion's clean aesthetic while maintaining the sophisticated functionality required for RCSA automation platforms. 