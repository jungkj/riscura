# DaisyUI Component Standardization Guide

## Overview
This guide establishes standardized patterns for DaisyUI component usage across the Riscura codebase, based on analysis of recent JSX fixes and component implementations.

## Component Architecture Analysis

### Core Components Structure

#### DaisyCard Pattern
```tsx
// ✅ CORRECT: Proper nesting hierarchy
<DaisyCard>
  <DaisyCardBody>
    <DaisyCardTitle>Title Here</DaisyCardTitle>
    {/* Content here */}
  </DaisyCardBody>
</DaisyCard>

// ❌ INCORRECT: Self-closing DaisyCardBody
<DaisyCard>
  <DaisyCardBody />  {/* This will cause JSX errors */}
  <DaisyCardTitle>Title</DaisyCardTitle>
</DaisyCard>
```

#### DaisyButton Pattern
```tsx
// ✅ CORRECT: Standard button with proper attributes
<DaisyButton 
  variant="primary" 
  size="sm" 
  onClick={handleClick}
  disabled={isLoading}
>
  Button Text
</DaisyButton>

// ✅ CORRECT: Button with loading state
<DaisyButton onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</DaisyButton>
```

#### DaisySelect Pattern
```tsx
// ✅ CORRECT: Complete select implementation
<DaisySelect
  value={selectedValue}
  onValueChange={(value) => handleChange(value)}
>
  <DaisySelectTrigger className={errors.field ? 'border-red-500' : ''}>
    <DaisySelectValue placeholder="Select option" />
  </DaisySelectTrigger>
  <DaisySelectContent>
    {options.map((option) => (
      <DaisySelectItem key={option.value} value={option.value}>
        {option.label}
      </DaisySelectItem>
    ))}
  </DaisySelectContent>
</DaisySelect>

// ❌ INCORRECT: Missing required sub-components
<DaisySelect value={value} onValueChange={onChange}>
  {/* Missing DaisySelectTrigger and DaisySelectContent */}
  <option value="test">Test</option>
</DaisySelect>
```

## Common Anti-Patterns & Fixes

### 1. Self-Closing Container Components
**Problem**: Using self-closing tags on components that expect children
```tsx
// ❌ INCORRECT
<DaisyCardBody />
<DaisyDialogContent />
<DaisyTabsContent />
```

**Solution**: Always use proper opening/closing tags for container components
```tsx
// ✅ CORRECT
<DaisyCardBody>
  {/* Content here */}
</DaisyCardBody>

<DaisyDialogContent>
  {/* Dialog content */}
</DaisyDialogContent>

<DaisyTabsContent value="tab1">
  {/* Tab content */}
</DaisyTabsContent>
```

### 2. Fragment Misuse for Adjacent Elements
**Problem**: Incorrect fragment usage when returning adjacent JSX elements
```tsx
// ❌ INCORRECT
return <>
  <DaisyCard>...</DaisyCard>
  <DaisyCard>...</DaisyCard>
</>
```

**Solution**: Use proper container or array syntax
```tsx
// ✅ CORRECT - Using container
return (
  <div className="space-y-4">
    <DaisyCard>...</DaisyCard>
    <DaisyCard>...</DaisyCard>
  </div>
);

// ✅ CORRECT - Using fragments properly
return (
  <>
    <DaisyCard>...</DaisyCard>
    <DaisyCard>...</DaisyCard>
  </>
);
```

### 3. Improper Attribute Formatting
**Problem**: Inconsistent className and prop formatting
```tsx
// ❌ INCORRECT
<DaisyButton className={`btn ${isActive ? 'active' : ''}`}>
<DaisyInput class="input-field" />  // Wrong attribute name
```

**Solution**: Use consistent className formatting
```tsx
// ✅ CORRECT
<DaisyButton className={cn('base-classes', isActive && 'active-class')}>
<DaisyInput className="input-field" />
```

## Component-Specific Guidelines

### DaisyCard Components
- **Always use DaisyCard as the outer container**
- **DaisyCardBody is required for content**
- **DaisyCardTitle should be inside DaisyCardBody**
- **DaisyCardActions is optional, place at the end**

```tsx
// ✅ Standard Card Pattern
<DaisyCard compact bordered>
  <DaisyCardBody>
    <DaisyCardTitle className="flex items-center space-x-2">
      <Icon className="h-5 w-5" />
      <span>Card Title</span>
    </DaisyCardTitle>
    <p>Card content goes here</p>
    <DaisyCardActions>
      <DaisyButton variant="primary">Action</DaisyButton>
    </DaisyCardActions>
  </DaisyCardBody>
</DaisyCard>
```

### DaisyDialog Components
- **Proper nesting hierarchy is critical**
- **All sub-components must be properly closed**

```tsx
// ✅ Dialog Pattern
<DaisyDialog open={isOpen} onOpenChange={setIsOpen}>
  <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DaisyDialogHeader>
      <DaisyDialogTitle>Dialog Title</DaisyDialogTitle>
      <DaisyDialogDescription>
        Description text
      </DaisyDialogDescription>
    </DaisyDialogHeader>
    
    {/* Dialog content */}
    
    <DaisyDialogFooter>
      <DaisyButton variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </DaisyButton>
      <DaisyButton onClick={handleSubmit}>
        Submit
      </DaisyButton>
    </DaisyDialogFooter>
  </DaisyDialogContent>
</DaisyDialog>
```

### DaisyTabs Components
- **Use proper value/onValueChange pattern**
- **Each tab content must have corresponding trigger**

```tsx
// ✅ Tabs Pattern
<DaisyTabs value={activeTab} onValueChange={setActiveTab}>
  <DaisyTabsList className="grid w-full grid-cols-3">
    <DaisyTabsTrigger value="tab1">Tab 1</DaisyTabsTrigger>
    <DaisyTabsTrigger value="tab2">Tab 2</DaisyTabsTrigger>
    <DaisyTabsTrigger value="tab3">Tab 3</DaisyTabsTrigger>
  </DaisyTabsList>
  
  <DaisyTabsContent value="tab1" className="space-y-4">
    {/* Tab 1 content */}
  </DaisyTabsContent>
  
  <DaisyTabsContent value="tab2" className="space-y-4">
    {/* Tab 2 content */}
  </DaisyTabsContent>
  
  <DaisyTabsContent value="tab3" className="space-y-4">
    {/* Tab 3 content */}
  </DaisyTabsContent>
</DaisyTabs>
```

## Error Prevention Guidelines

### 1. Component Import Patterns
```tsx
// ✅ CORRECT: Group related components
import {
  DaisyCard,
  DaisyCardBody,
  DaisyCardTitle,
  DaisyCardActions,
} from '@/components/ui/DaisyCard';

import {
  DaisyDialog,
  DaisyDialogContent,
  DaisyDialogHeader,
  DaisyDialogTitle,
  DaisyDialogDescription,
} from '@/components/ui/DaisyDialog';
```

### 2. Required Props Validation
Always include required props and provide defaults:
```tsx
// ✅ CORRECT: Proper prop handling
<DaisyButton
  variant="primary"          // Always specify variant
  size="md"                 // Always specify size
  onClick={handleClick}      // Required for interactive buttons
  type="button"             // Explicit type for non-form buttons
>
  Button Text
</DaisyButton>
```

### 3. Conditional Rendering Patterns
```tsx
// ✅ CORRECT: Safe conditional rendering
{isVisible && (
  <DaisyCard>
    <DaisyCardBody>
      <DaisyCardTitle>Conditional Content</DaisyCardTitle>
    </DaisyCardBody>
  </DaisyCard>
)}

// ✅ CORRECT: Error state handling
<DaisyInput
  value={inputValue}
  onChange={handleChange}
  className={cn(
    'base-input-styles',
    errors.field && 'border-red-500'
  )}
/>
{errors.field && (
  <p className="text-sm text-red-600 mt-1">{errors.field}</p>
)}
```

## Build Failure Prevention Checklist

### Pre-commit Checks
- [ ] All container components use proper opening/closing tags
- [ ] No self-closing tags on components that expect children
- [ ] Proper fragment usage for adjacent elements
- [ ] Consistent className attribute usage (not class)
- [ ] All required props are provided
- [ ] Proper TypeScript types for component props

### Component State Management
- [ ] State updates use proper patterns (functional updates)
- [ ] Event handlers are properly typed
- [ ] Loading states are handled consistently
- [ ] Error states are properly displayed

### Accessibility Compliance
- [ ] Form elements have associated labels
- [ ] Interactive elements have proper ARIA attributes
- [ ] Focus management is implemented
- [ ] Keyboard navigation works correctly

## Performance Optimizations

### 1. Component Memoization
```tsx
// ✅ Memoize expensive components
const MemoizedRiskCard = React.memo(({ risk, onUpdate }) => (
  <DaisyCard>
    <DaisyCardBody>
      <DaisyCardTitle>{risk.title}</DaisyCardTitle>
      {/* Component content */}
    </DaisyCardBody>
  </DaisyCard>
));
```

### 2. Event Handler Optimization
```tsx
// ✅ Use useCallback for stable references
const handleRiskUpdate = useCallback((id: string, data: RiskData) => {
  updateRisk(id, data);
}, [updateRisk]);
```

## Testing Patterns

### Unit Test Template
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DaisyButton } from '@/components/ui/DaisyButton';

describe('DaisyButton', () => {
  it('renders with correct variant class', () => {
    render(<DaisyButton variant="primary">Test</DaisyButton>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<DaisyButton onClick={handleClick}>Test</DaisyButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Migration Guidelines

### From Legacy Patterns
When updating existing code:

1. **Identify self-closing container components**
2. **Add proper opening/closing tags**
3. **Update fragment usage where needed**
4. **Standardize className formatting**
5. **Add missing required props**
6. **Implement proper error handling**

### Version Control Best Practices
- Create separate commits for component standardization
- Use descriptive commit messages: "fix: standardize DaisyCard component usage"
- Test each component change individually
- Update related tests and documentation

## Common Error Messages & Solutions

### "Expected corresponding JSX closing tag"
**Cause**: Self-closing tag used on container component
**Solution**: Use proper opening/closing tags

### "Cannot read property of undefined"
**Cause**: Missing required props or improper state management
**Solution**: Provide all required props and handle undefined states

### "Invalid prop type"
**Cause**: Incorrect prop types passed to components
**Solution**: Check component prop interfaces and provide correct types

This standardization guide should be referenced for all DaisyUI component usage and updated as patterns evolve.