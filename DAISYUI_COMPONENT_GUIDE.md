# DaisyUI Component Usage Guide

This guide provides standardized patterns for using DaisyUI components in the Riscura codebase, focusing on preventing common JSX syntax errors and ensuring consistent component usage.

## Table of Contents
- [General Guidelines](#general-guidelines)
- [Component Templates](#component-templates)
- [Common Patterns](#common-patterns)
- [Error Prevention](#error-prevention)
- [Best Practices](#best-practices)

## General Guidelines

### 1. Component Hierarchy Rules
- Always use proper nesting: `DaisyCard` → `DaisyCardBody` → `DaisyCardTitle`
- Container components should wrap their children: `<DaisyCard>{children}</DaisyCard>`
- Self-closing components should be properly closed: `<DaisyButton />`

### 2. Import Patterns
```typescript
// ✅ Correct - Import all related components together
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisySelect, DaisySelectContent, DaisySelectItem, DaisySelectTrigger, DaisySelectValue } from '@/components/ui/DaisySelect';

// ❌ Avoid - Separate imports for related components
import { DaisyCard } from '@/components/ui/DaisyCard';
import { DaisyCardBody } from '@/components/ui/DaisyCard';
```

### 3. Fragment Usage
Use React fragments when returning multiple adjacent elements:
```typescript
// ✅ Correct
return (
  <>
    <DaisyCard>...</DaisyCard>
    <DaisyCard>...</DaisyCard>
  </>
);

// ❌ Incorrect - Missing fragment wrapper
return (
  <DaisyCard>...</DaisyCard>
  <DaisyCard>...</DaisyCard>
);
```

## Component Templates

### DaisyCard Pattern

#### Basic Card Structure
```typescript
// ✅ Standard Card Pattern
<DaisyCard className="mb-4">
  <DaisyCardBody>
    <DaisyCardTitle>Card Title</DaisyCardTitle>
    <p>Card content goes here</p>
  </DaisyCardBody>
</DaisyCard>

// ✅ Card with Multiple Sections
<DaisyCard>
  <DaisyCardBody className="space-y-4">
    <DaisyCardTitle>Header Section</DaisyCardTitle>
    <p>Description content</p>
  </DaisyCardBody>
  <DaisyCardBody>
    <div>Additional content section</div>
  </DaisyCardBody>
</DaisyCard>

// ✅ Card with Actions
<DaisyCard>
  <DaisyCardBody>
    <DaisyCardTitle>Card with Actions</DaisyCardTitle>
    <p>Card content</p>
    <DaisyCardActions>
      <DaisyButton variant="outline">Cancel</DaisyButton>
      <DaisyButton>Submit</DaisyButton>
    </DaisyCardActions>
  </DaisyCardBody>
</DaisyCard>
```

#### Common Card Variations
```typescript
// Compact card
<DaisyCard compact>
  <DaisyCardBody>
    <DaisyCardTitle>Compact Card</DaisyCardTitle>
    <p>Less padding</p>
  </DaisyCardBody>
</DaisyCard>

// Metrics/Stats card
<DaisyCard>
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2">
    <DaisyCardTitle className="text-sm font-medium">Metric Label</DaisyCardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </DaisyCardBody>
  <DaisyCardBody>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground">Additional info</p>
  </DaisyCardBody>
</DaisyCard>
```

### DaisySelect Pattern

#### Standard Select Usage
```typescript
// ✅ Complete Select Pattern
<div className="space-y-2">
  <DaisyLabel htmlFor="category">Category</DaisyLabel>
  <DaisySelect
    value={selectedValue}
    onValueChange={(value) => setSelectedValue(value)}
  >
    <DaisySelectTrigger>
      <DaisySelectValue placeholder="Select an option" />
    </DaisySelectTrigger>
    <DaisySelectContent>
      {options.map((option) => (
        <DaisySelectItem key={option.value} value={option.value}>
          {option.label}
        </DaisySelectItem>
      ))}
    </DaisySelectContent>
  </DaisySelect>
</div>

// ✅ Select with Error State
<DaisySelect
  value={formData.category}
  onValueChange={(value) => updateFormData({ category: value })}
>
  <DaisySelectTrigger className={errors.category ? 'border-red-500' : ''}>
    <DaisySelectValue placeholder="Select category" />
  </DaisySelectTrigger>
  <DaisySelectContent>
    {categories.map((category) => (
      <DaisySelectItem key={category} value={category}>
        {category}
      </DaisySelectItem>
    ))}
  </DaisySelectContent>
</DaisySelect>
```

#### Select with Complex Items
```typescript
// ✅ Select with Rich Content
<DaisySelect value={treatment} onValueChange={setTreatment}>
  <DaisySelectTrigger>
    <DaisySelectValue />
  </DaisySelectTrigger>
  <DaisySelectContent>
    {treatmentOptions.map((option) => (
      <DaisySelectItem key={option.value} value={option.value}>
        <div>
          <div className="font-medium">{option.label}</div>
          <div className="text-sm text-gray-500">{option.description}</div>
        </div>
      </DaisySelectItem>
    ))}
  </DaisySelectContent>
</DaisySelect>
```

### DaisyTabs Pattern

#### Standard Tabs Structure
```typescript
// ✅ Complete Tabs Pattern
<DaisyTabs defaultValue="tab1" className="space-y-4">
  <DaisyTabsList>
    <DaisyTabsTrigger value="tab1">First Tab</DaisyTabsTrigger>
    <DaisyTabsTrigger value="tab2">Second Tab</DaisyTabsTrigger>
    <DaisyTabsTrigger value="tab3">Third Tab</DaisyTabsTrigger>
  </DaisyTabsList>
  
  <DaisyTabsContent value="tab1" className="space-y-4">
    <div>Content for first tab</div>
  </DaisyTabsContent>
  
  <DaisyTabsContent value="tab2" className="space-y-4">
    <div>Content for second tab</div>
  </DaisyTabsContent>
  
  <DaisyTabsContent value="tab3" className="space-y-4">
    <div>Content for third tab</div>
  </DaisyTabsContent>
</DaisyTabs>

// ✅ Controlled Tabs
<DaisyTabs value={activeTab} onValueChange={setActiveTab}>
  <DaisyTabsList className="grid w-full grid-cols-3">
    <DaisyTabsTrigger value="basic">Basic Info</DaisyTabsTrigger>
    <DaisyTabsTrigger value="details">Details</DaisyTabsTrigger>
    <DaisyTabsTrigger value="review">Review</DaisyTabsTrigger>
  </DaisyTabsList>
  
  <DaisyTabsContent value="basic">
    <BasicInfoForm />
  </DaisyTabsContent>
  
  <DaisyTabsContent value="details">
    <DetailsForm />
  </DaisyTabsContent>
  
  <DaisyTabsContent value="review">
    <ReviewForm />
  </DaisyTabsContent>
</DaisyTabs>
```

### DaisyButton Pattern

#### Button Variations
```typescript
// ✅ Basic buttons
<DaisyButton variant="primary">Primary Action</DaisyButton>
<DaisyButton variant="outline">Secondary Action</DaisyButton>
<DaisyButton variant="ghost">Tertiary Action</DaisyButton>

// ✅ Button with loading state
<DaisyButton onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</DaisyButton>

// ✅ Button with icon
<DaisyButton variant="outline" size="sm">
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh
</DaisyButton>

// ✅ Icon-only button
<DaisyButton variant="ghost" size="sm" shape="circle">
  <Settings className="h-4 w-4" />
</DaisyButton>
```

### DaisyAlert Pattern

#### Alert Variations
```typescript
// ✅ Basic alert
<DaisyAlert variant="info">
  <Info className="h-4 w-4" />
  <span>Information message</span>
</DaisyAlert>

// ✅ Alert with custom content
<DaisyAlert variant="error">
  <XCircle className="h-4 w-4" />
  <div>
    <div className="font-medium">Error occurred</div>
    <div className="text-sm">Please check your input and try again.</div>
  </div>
</DaisyAlert>

// ✅ Alert with action
<DaisyAlert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <span>Warning message</span>
  <DaisyButton variant="outline" size="sm" className="ml-2">
    Action
  </DaisyButton>
</DaisyAlert>
```

## Common Patterns

### Form Field Pattern
```typescript
// ✅ Complete form field with validation
<div className="space-y-2">
  <DaisyLabel htmlFor="fieldName">Field Label *</DaisyLabel>
  <DaisyInput
    id="fieldName"
    placeholder="Enter value"
    value={formData.fieldName}
    onChange={(e) => updateFormData({ fieldName: e.target.value })}
    className={errors.fieldName ? 'border-red-500' : ''}
  />
  {errors.fieldName && (
    <p className="text-sm text-red-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {errors.fieldName}
    </p>
  )}
</div>
```

### Modal/Dialog Pattern
```typescript
// ✅ Complete dialog structure
<DaisyDialog open={isOpen} onOpenChange={setIsOpen}>
  <DaisyDialogContent className="max-w-2xl">
    <DaisyDialogHeader>
      <DaisyDialogTitle>Dialog Title</DaisyDialogTitle>
      <DaisyDialogDescription>
        Dialog description text
      </DaisyDialogDescription>
    </DaisyDialogHeader>
    
    <div className="space-y-4">
      {/* Dialog content */}
    </div>
    
    <div className="flex justify-end space-x-2 pt-4 border-t">
      <DaisyButton variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </DaisyButton>
      <DaisyButton onClick={handleSubmit}>
        Confirm
      </DaisyButton>
    </div>
  </DaisyDialogContent>
</DaisyDialog>
```

### List with Cards Pattern
```typescript
// ✅ List of cards with proper keys
<div className="space-y-4">
  {items.map((item) => (
    <DaisyCard key={item.id}>
      <DaisyCardBody>
        <div className="flex items-center justify-between">
          <div>
            <DaisyCardTitle>{item.title}</DaisyCardTitle>
            <p className="text-muted-foreground">{item.description}</p>
          </div>
          <div className="flex gap-2">
            <DaisyButton variant="outline" size="sm">
              Edit
            </DaisyButton>
            <DaisyButton variant="ghost" size="sm">
              Delete
            </DaisyButton>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  ))}
</div>
```

## Error Prevention

### Common JSX Syntax Errors to Avoid

#### 1. Missing Fragment Wrappers
```typescript
// ❌ Incorrect - Adjacent JSX elements without wrapper
const Component = () => {
  return (
    <DaisyCard>...</DaisyCard>
    <DaisyCard>...</DaisyCard>
  );
};

// ✅ Correct - Use React.Fragment
const Component = () => {
  return (
    <>
      <DaisyCard>...</DaisyCard>
      <DaisyCard>...</DaisyCard>
    </>
  );
};
```

#### 2. Improper Component Nesting
```typescript
// ❌ Incorrect - Missing DaisyCardBody
<DaisyCard>
  <DaisyCardTitle>Title</DaisyCardTitle>
  <p>Content</p>
</DaisyCard>

// ✅ Correct - Proper nesting
<DaisyCard>
  <DaisyCardBody>
    <DaisyCardTitle>Title</DaisyCardTitle>
    <p>Content</p>
  </DaisyCardBody>
</DaisyCard>
```

#### 3. Missing Keys in Lists
```typescript
// ❌ Incorrect - Missing key prop
{items.map((item) => (
  <DaisyCard>
    <DaisyCardBody>
      <DaisyCardTitle>{item.title}</DaisyCardTitle>
    </DaisyCardBody>
  </DaisyCard>
))}

// ✅ Correct - Include key prop
{items.map((item) => (
  <DaisyCard key={item.id}>
    <DaisyCardBody>
      <DaisyCardTitle>{item.title}</DaisyCardTitle>
    </DaisyCardBody>
  </DaisyCard>
))}
```

#### 4. Incorrect Self-Closing Tags
```typescript
// ❌ Incorrect - Container component self-closed
<DaisyCard />

// ✅ Correct - Container components need closing tags
<DaisyCard>
  <DaisyCardBody>
    <DaisyCardTitle>Content</DaisyCardTitle>
  </DaisyCardBody>
</DaisyCard>

// ✅ Correct - Self-closing for leaf components
<DaisyButton />
<DaisyInput />
<DaisySeparator />
```

#### 5. Missing Required Props
```typescript
// ❌ Incorrect - Missing required value prop
<DaisyTabsTrigger>Tab Label</DaisyTabsTrigger>

// ✅ Correct - Include required props
<DaisyTabsTrigger value="tab1">Tab Label</DaisyTabsTrigger>
```

### Pre-flight Checklist

Before committing code with DaisyUI components, ensure:

- [ ] All components have proper opening and closing tags
- [ ] Fragment wrappers are used for adjacent elements
- [ ] List items have unique `key` props
- [ ] Required props are provided (especially `value` for form components)
- [ ] Proper component hierarchy is maintained
- [ ] Import statements include all used components
- [ ] Error states are handled with proper className conditionals
- [ ] TypeScript types are properly used for event handlers

## Best Practices

### 1. Consistent Spacing
Use consistent spacing patterns with Tailwind classes:
```typescript
// ✅ Consistent spacing
<div className="space-y-4">
  <DaisyCard>...</DaisyCard>
  <DaisyCard>...</DaisyCard>
</div>

<DaisyCard className="mb-6">
  <DaisyCardBody className="space-y-4">
    <DaisyCardTitle>...</DaisyCardTitle>
    <div>...</div>
  </DaisyCardBody>
</DaisyCard>
```

### 2. Responsive Design
Always consider mobile-first responsive design:
```typescript
// ✅ Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <DaisyCard key={item.id}>...</DaisyCard>
  ))}
</div>

// ✅ Responsive tabs
<DaisyTabsList className="grid w-full grid-cols-2 md:grid-cols-4">
  <DaisyTabsTrigger value="tab1">Tab 1</DaisyTabsTrigger>
  <DaisyTabsTrigger value="tab2">Tab 2</DaisyTabsTrigger>
</DaisyTabsList>
```

### 3. Accessibility
Ensure proper accessibility attributes:
```typescript
// ✅ Proper labeling
<DaisyLabel htmlFor="email">Email Address</DaisyLabel>
<DaisyInput
  id="email"
  type="email"
  aria-describedby="email-error"
  className={errors.email ? 'border-red-500' : ''}
/>
{errors.email && (
  <p id="email-error" className="text-sm text-red-500">
    {errors.email}
  </p>
)}
```

### 4. Loading States
Always provide proper loading states:
```typescript
// ✅ Loading card skeleton
{isLoading ? (
  <DaisyCard className="animate-pulse">
    <DaisyCardBody className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </DaisyCardBody>
  </DaisyCard>
) : (
  <DaisyCard>
    <DaisyCardBody>
      <DaisyCardTitle>{data.title}</DaisyCardTitle>
      <p>{data.content}</p>
    </DaisyCardBody>
  </DaisyCard>
)}
```

### 5. Error Boundaries
Implement proper error handling:
```typescript
// ✅ Error state handling
{error ? (
  <DaisyAlert variant="error">
    <XCircle className="h-4 w-4" />
    <div>
      <div className="font-medium">Error loading data</div>
      <div className="text-sm">{error.message}</div>
    </div>
    <DaisyButton variant="outline" size="sm" onClick={retry}>
      Retry
    </DaisyButton>
  </DaisyAlert>
) : (
  <div>Normal content</div>
)}
```

## Component-Specific Notes

### DaisySelect Implementation Note
The current DaisySelect implementation in the codebase is a compatibility layer that wraps native HTML select elements. The `DaisySelectTrigger`, `DaisySelectValue`, and `DaisySelectContent` components are provided for API compatibility but render as pass-through components.

### DaisyTabs State Management
DaisyTabs components require proper state management. Use either `defaultValue` for uncontrolled tabs or `value` + `onValueChange` for controlled tabs.

### DaisyCard Flexibility
DaisyCard components are highly flexible and can contain multiple DaisyCardBody sections for different content areas.

This guide should be referenced when implementing new components or reviewing existing code for consistency and error prevention.