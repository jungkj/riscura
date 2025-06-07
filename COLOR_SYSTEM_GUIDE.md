# Enterprise Color System Usage Guide

## **Overview**

This guide documents the complete implementation of the Notion-inspired, enterprise-grade color system for Riscura. The color system has been fully integrated into Tailwind CSS and provides comprehensive theming support with accessibility compliance.

## **Color Categories**

### **1. Surface Colors**
Used for backgrounds, cards, and layout surfaces.

```css
/* Tailwind Classes */
bg-surface-primary      /* #fafbfc - Main background */
bg-surface-secondary    /* #f1f3f4 - Secondary background */
bg-surface-tertiary     /* #e8eaed - Tertiary background */
bg-surface-elevated     /* #ffffff - Cards and elevated surfaces */

/* Usage Examples */
<div className="bg-surface-primary">Main layout background</div>
<div className="bg-surface-elevated">Card or modal background</div>
```

### **2. Text Colors**
Hierarchical text colors for optimal readability.

```css
/* Tailwind Classes */
text-text-primary       /* #37352f - Primary text (headings, important content) */
text-text-secondary     /* #6f6f6f - Secondary text (descriptions, captions) */
text-text-tertiary      /* #9b9a97 - Muted text (metadata, timestamps) */
text-text-inverse       /* #ffffff - Text on dark backgrounds */
text-text-charcoal     /* #3c4043 - Alternative primary text */

/* Usage Examples */
<h1 className="text-text-primary">Page Title</h1>
<p className="text-text-secondary">Description text</p>
<span className="text-text-tertiary">Last updated: 2 days ago</span>
```

### **3. Interactive Colors**
For buttons, links, and interactive elements.

```css
/* Tailwind Classes */
bg-interactive-primary          /* #2383e2 - Primary actions */
bg-interactive-primaryHover     /* #1a73d8 - Primary hover state */
bg-interactive-secondary        /* #e8f0fe - Secondary actions */
bg-interactive-danger           /* #ea4335 - Destructive actions */
bg-interactive-success          /* #34a853 - Success actions */
bg-interactive-warning          /* #fbbc04 - Warning actions */
bg-interactive-purple           /* #6f42c1 - AI/Insights features */

/* Usage Examples */
<button className="bg-interactive-primary hover:bg-interactive-primaryHover text-white">
  Save Changes
</button>
<button className="bg-interactive-danger text-white">Delete</button>
```

### **4. Risk Management Colors**
Specific colors for risk assessment and management.

```css
/* Tailwind Classes */
bg-risk-critical        /* #d32f2f - Critical risk level */
bg-risk-high           /* #f57c00 - High risk level */
bg-risk-medium         /* #fbc02d - Medium risk level */
bg-risk-low            /* #388e3c - Low risk level */
bg-risk-minimal        /* #4caf50 - Minimal risk level */

/* Pre-built Badge Classes */
.badge-risk-critical   /* Complete styled badge for critical risk */
.badge-risk-high       /* Complete styled badge for high risk */
.badge-risk-medium     /* Complete styled badge for medium risk */
.badge-risk-low        /* Complete styled badge for low risk */

/* Usage Examples */
<span className="badge-risk-critical">Critical</span>
<div className="bg-risk-high/10 border border-risk-high/20 text-risk-high">
  High Risk Warning
</div>
```

### **5. Compliance Status Colors**
For compliance tracking and status indicators.

```css
/* Tailwind Classes */
bg-compliance-compliant         /* #4caf50 - Compliant status */
bg-compliance-nonCompliant      /* #f44336 - Non-compliant status */
bg-compliance-inProgress        /* #2196f3 - In progress */
bg-compliance-notStarted        /* #9e9e9e - Not started */
bg-compliance-pending           /* #f57c00 - Pending review */
bg-compliance-overdue           /* #d32f2f - Overdue items */

/* Pre-built Badge Classes */
.badge-compliant               /* Styled compliant badge */
.badge-non-compliant          /* Styled non-compliant badge */
.badge-in-progress            /* Styled in-progress badge */

/* Usage Examples */
<span className="badge-compliant">Compliant</span>
<div className="bg-compliance-inProgress/10 text-compliance-inProgress">
  Review in Progress
</div>
```

### **6. Chart & Data Visualization Colors**
Color-blind friendly palette for charts and graphs.

```css
/* Tailwind Classes */
bg-chart-blue          /* #2383e2 - Primary data series */
bg-chart-green         /* #34a853 - Success/positive data */
bg-chart-orange        /* #f57c00 - Warning/attention data */
bg-chart-red           /* #ea4335 - Error/negative data */
bg-chart-purple        /* #6f42c1 - Special/AI data */
bg-chart-teal          /* #00796b - Secondary data series */
bg-chart-amber         /* #fbc02d - Tertiary data series */
bg-chart-pink          /* #e91e63 - Additional data series */

/* Usage Examples */
<div className="w-full h-4 bg-chart-blue rounded">Progress bar</div>
<!-- Use in chart libraries like Recharts -->
```

### **7. Semantic Colors**
Enhanced semantic colors for various states.

```css
/* Tailwind Classes */
bg-semantic-info       /* #2383e2 - Information states */
bg-semantic-success    /* #0f7b0f - Success states (darker green) */
bg-semantic-warning    /* #f57c00 - Warning states */
bg-semantic-error      /* #d50000 - Error states (darker red) */
bg-semantic-neutral    /* #9aa0a6 - Neutral states */

/* Usage Examples */
<div className="bg-semantic-success/10 border border-semantic-success/20 text-semantic-success">
  Operation completed successfully
</div>
```

## **Enterprise Component Classes**

### **Pre-built Component Styles**

#### **Buttons**
```css
/* Enterprise Button Classes */
.btn-enterprise        /* Base button styling */
.btn-primary          /* Primary action button */
.btn-secondary        /* Secondary action button */
.btn-danger           /* Destructive action button */

/* Usage */
<button className="btn-primary">Save Changes</button>
<button className="btn-secondary">Cancel</button>
<button className="btn-danger">Delete Item</button>
```

#### **Cards**
```css
/* Card Component Classes */
.card-notion          /* Basic Notion-style card */
.card-interactive     /* Interactive card with hover effects */

/* Usage */
<div className="card-notion">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

#### **Form Inputs**
```css
/* Input Component Classes */
.input-enterprise     /* Styled form input */

/* Usage */
<input className="input-enterprise" placeholder="Enter value..." />
```

#### **Tables**
```css
/* Table Component Classes */
.table-enterprise     /* Complete table styling */
.table-header        /* Table header styling */
.table-cell          /* Table cell styling */
.table-row           /* Table row with hover effects */

/* Usage */
<table className="table-enterprise">
  <thead className="table-header">
    <tr>
      <th className="table-cell">Column 1</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row">
      <td className="table-cell">Data</td>
    </tr>
  </tbody>
</table>
```

## **Layout & Spacing Classes**

### **Enterprise Layout System**
```css
/* Layout Classes */
.layout-enterprise    /* Main layout container */
.sidebar-enterprise   /* Sidebar styling */
.sidebar-collapsed    /* Collapsed sidebar state */
.main-content        /* Main content area */
.page-header         /* Page header styling */
.content-area        /* Content container with max-width */

/* Spacing Classes */
px-enterprise-4       /* 16px horizontal padding */
py-enterprise-2       /* 8px vertical padding */
gap-enterprise-6      /* 24px gap between elements */
```

### **Typography Classes**
```css
/* Enterprise Typography */
.text-enterprise-xs   /* Extra small text */
.text-enterprise-sm   /* Small text */
.text-enterprise-base /* Base text size */
.text-enterprise-lg   /* Large text */
.text-enterprise-xl   /* Extra large text */

/* Display Typography */
.text-display-sm      /* Small display heading */
.text-display-md      /* Medium display heading */
.text-display-lg      /* Large display heading */
```

## **Shadow System**

### **Notion-inspired Shadows**
```css
/* Shadow Classes */
shadow-notion-sm      /* Subtle small shadow */
shadow-notion         /* Standard shadow */
shadow-notion-md      /* Medium shadow */
shadow-notion-lg      /* Large shadow */
shadow-notion-xl      /* Extra large shadow */

/* Interactive Shadows */
shadow-card           /* Card shadow */
shadow-interactive    /* Interactive element shadow */
shadow-focus          /* Focus ring shadow */
```

## **Dark Mode Support**

The color system automatically supports dark mode through CSS variables. All colors have appropriate dark mode variants that maintain contrast ratios and accessibility standards.

```jsx
// Dark mode usage is automatic with Tailwind's dark: prefix
<div className="bg-surface-primary dark:bg-surface-primary">
  Content adapts automatically
</div>
```

## **Accessibility Features**

### **High Contrast Mode**
```css
/* Automatic high contrast support */
@media (prefers-contrast: high) {
  /* Colors automatically adjust for high contrast */
}
```

### **Reduced Motion**
```css
/* Respects user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  /* Animations are reduced or disabled */
}
```

### **Focus Management**
```css
/* Enhanced focus styles */
:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2;
}
```

## **Brand Customization**

### **Tenant Branding Support**
```css
/* Brand variable override support */
--brand-primary: 213 94% 50%;    /* Can be overridden per tenant */
--brand-secondary: 210 17% 95%;  /* Can be overridden per tenant */
--brand-accent: 291 64% 42%;     /* Can be overridden per tenant */

/* Usage with CSS variables */
.brand-primary { @apply bg-brand-primary; }
```

## **Migration from Old Color System**

### **Color Mapping**
```css
/* Old beige system → New enterprise system */
bg-beige-100        → bg-surface-primary
bg-beige-300        → bg-surface-secondary
text-dark-black     → text-text-primary
text-muted-gray     → text-text-secondary
border-warm-beige   → border-border
```

### **Component Updates Required**
1. Update all `bg-beige-*` classes to `bg-surface-*`
2. Replace `text-dark-black` with `text-text-primary`
3. Update shadows from `shadow-beige-*` to `shadow-notion-*`
4. Replace custom color references with new semantic colors

## **Best Practices**

### **Color Usage Guidelines**
1. **Use semantic colors** for status indicators and states
2. **Maintain contrast ratios** of at least 4.5:1 for normal text
3. **Test in dark mode** to ensure readability
4. **Use consistent spacing** with enterprise spacing scale
5. **Leverage pre-built components** for consistency

### **Performance Considerations**
1. The color system uses CSS variables for optimal performance
2. Dark mode switching is instant with no layout shift
3. All colors are optimized for production builds

This comprehensive color system provides the foundation for building beautiful, accessible, and consistent enterprise interfaces that scale across the entire Riscura platform. 