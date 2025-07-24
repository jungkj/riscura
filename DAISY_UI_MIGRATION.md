# DaisyUI Migration Guide

## Overview

This guide documents the migration from custom Tailwind CSS components to DaisyUI components in the Riscura webapp. DaisyUI provides a comprehensive set of semantic component classes that work on top of Tailwind CSS.

## Migration Status

### Phase 1: Setup and Configuration ✅
- ✅ DaisyUI installed and configured
- ✅ Tailwind config updated with custom themes ('riscura' and 'riscuraDark')
- ✅ Global CSS updated for DaisyUI support
- ✅ ThemeContext updated for DaisyUI theme switching

### Phase 2: Component Creation ✅
- ✅ Created 28 DaisyUI wrapper components
- ✅ All major UI patterns covered
- ✅ Backward compatibility maintained

### Phase 3: Codebase Migration (88% Complete) ✅
- **Initial State**: 1,102 files using old UI components
- **Current State**: 129 files remaining (973 files migrated)
- **Progress**: 88% complete
- ✅ Automated migration script created
- ✅ Major pages and components migrated
- ✅ Authentication pages updated
- ✅ Dashboard pages updated

### Phase 4: Testing and Refinement (In Progress)
- [ ] Test all migrated components
- [ ] Fix any styling inconsistencies
- [ ] Ensure theme switching works properly

### Phase 5: Cleanup (Pending)
- [ ] Remove old component files
- [ ] Update documentation
- [ ] Final code review

## Component Mapping

### Old Component → New Component

| Old Component | New Component | Location |
|--------------|---------------|----------|
| `Button` | `DaisyButton` | `/src/components/ui/DaisyButton.tsx` |
| `Card` | `DaisyCard` | `/src/components/ui/DaisyCard.tsx` |
| `Input` | `DaisyInput` | `/src/components/ui/DaisyInput.tsx` |
| `Alert` | `DaisyAlert` | `/src/components/ui/DaisyAlert.tsx` |
| `Badge` | `DaisyBadge` | `/src/components/ui/DaisyBadge.tsx` |
| `Modal` | `DaisyModal` | `/src/components/ui/DaisyModal.tsx` |
| `Dialog` | `DaisyDialog` | `/src/components/ui/DaisyDialog.tsx` |
| `Table` | `DaisyTable` | `/src/components/ui/DaisyTable.tsx` |
| `Select` | `DaisySelect` | `/src/components/ui/DaisySelect.tsx` |
| `Checkbox` | `DaisyCheckbox` | `/src/components/ui/DaisyCheckbox.tsx` |
| `Progress` | `DaisyProgress` | `/src/components/ui/DaisyProgress.tsx` |
| `Label` | `DaisyLabel` | `/src/components/ui/DaisyLabel.tsx` |
| `Separator` | `DaisySeparator` | `/src/components/ui/DaisySeparator.tsx` |
| `Tabs` | `DaisyTabs` | `/src/components/ui/DaisyTabs.tsx` |
| `Textarea` | `DaisyTextarea` | `/src/components/ui/DaisyTextarea.tsx` |
| `Switch` | `DaisySwitch` | `/src/components/ui/DaisySwitch.tsx` |
| `Avatar` | `DaisyAvatar` | `/src/components/ui/DaisyAvatar.tsx` |
| `Tooltip` | `DaisyTooltip` | `/src/components/ui/DaisyTooltip.tsx` |
| `Dropdown` | `DaisyDropdown` | `/src/components/ui/DaisyDropdown.tsx` |
| `Accordion` | `DaisyAccordion` | `/src/components/ui/DaisyAccordion.tsx` |
| `RadioGroup` | `DaisyRadioGroup` | `/src/components/ui/DaisyRadioGroup.tsx` |
| `Popover` | `DaisyPopover` | `/src/components/ui/DaisyPopover.tsx` |
| `Calendar` | `DaisyCalendar` | `/src/components/ui/DaisyCalendar.tsx` |
| `Skeleton` | `DaisySkeleton` | `/src/components/ui/DaisySkeleton.tsx` |
| `Slider` | `DaisySlider` | `/src/components/ui/DaisySlider.tsx` |
| `ScrollArea` | `DaisyScrollArea` | `/src/components/ui/DaisyScrollArea.tsx` |
| `LoadingSpinner` | `DaisyLoadingSpinner` | `/src/components/ui/DaisyLoadingSpinner.tsx` |
| `AlertDialog` | `DaisyAlertDialog` | `/src/components/ui/DaisyAlertDialog.tsx` |
| `Sheet` | `DaisySheet` | `/src/components/ui/DaisySheet.tsx` |
| `Form` | `DaisyForm` | `/src/components/ui/DaisyForm.tsx` |
| `Toast` | `DaisyToast` | `/src/components/ui/DaisyToast.tsx` |

### Class Mapping

#### Buttons
- `bg-blue-600 hover:bg-blue-700 text-white` → `btn btn-primary`
- `bg-gray-200 hover:bg-gray-300` → `btn btn-ghost`
- `border border-gray-300` → `btn btn-outline`

#### Inputs
- `border border-gray-300 rounded-md focus:ring-2` → `input input-bordered`
- `border-red-500` → `input input-error`

#### Cards
- `bg-white rounded-lg shadow-sm border` → `card bg-base-100 shadow-xl`
- `p-6` → `card-body`

#### Alerts
- Custom alert styles → `alert alert-{variant}`

## Theme Configuration

### Available Themes

1. **riscura** (Light theme)
   - Primary: #3b82f6 (Blue)
   - Secondary: #10b981 (Green)
   - Accent: #f59e0b (Orange)
   - Base colors: White backgrounds

2. **riscuraDark** (Dark theme)
   - Primary: #60a5fa (Light Blue)
   - Secondary: #34d399 (Light Green)
   - Accent: #fbbf24 (Light Orange)
   - Base colors: Dark backgrounds

### Theme Switching

```typescript
import { useTheme } from '@/context/ThemeContext';

const { theme, toggleTheme } = useTheme();
// theme will be 'riscura' or 'riscuraDark'
```

## Migration Examples

### Before (Custom Tailwind)

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card className="p-6 bg-white shadow-lg">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
      Click me
    </Button>
  </CardContent>
</Card>
```

### After (DaisyUI)

```tsx
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

<DaisyCard>
  <DaisyCardBody>
    <DaisyCardTitle>Title</DaisyCardTitle>
    <DaisyButton variant="primary">
      Click me
    </DaisyButton>
  </DaisyCardBody>
</DaisyCard>
```

## Benefits of Migration

1. **Consistency**: All components follow DaisyUI design system
2. **Theme Support**: Easy switching between light/dark themes
3. **Less Custom CSS**: Reduced maintenance burden
4. **Better Accessibility**: DaisyUI components are accessibility-tested
5. **Faster Development**: Pre-built components speed up development
6. **Smaller Bundle**: Semantic classes reduce CSS duplication

## Migration Checklist

For each component file:

- [ ] Replace imports from old UI components to DaisyUI components
- [ ] Update component usage to use DaisyUI props/variants
- [ ] Replace custom Tailwind classes with DaisyUI classes
- [ ] Test theme switching works correctly
- [ ] Verify responsive behavior
- [ ] Check accessibility features

## Common Patterns

### Forms

```tsx
// DaisyUI form pattern
<div className="form-control">
  <label className="label">
    <span className="label-text">Email</span>
  </label>
  <label className="input input-bordered flex items-center gap-2">
    <Mail className="h-4 w-4 opacity-70" />
    <input type="email" className="grow" placeholder="Enter email" />
  </label>
</div>
```

### Loading States

```tsx
// DaisyUI loading spinner
<span className="loading loading-spinner loading-lg text-primary"></span>

// Loading button
<DaisyButton loading={isLoading}>
  Submit
</DaisyButton>
```

### Modals

```tsx
// DaisyUI modal pattern
<DaisyModal open={isOpen} onClose={handleClose}>
  <h3 className="font-bold text-lg">Modal Title</h3>
  <p className="py-4">Modal content here</p>
  <DaisyModalAction>
    <DaisyButton variant="ghost" onClick={handleClose}>Cancel</DaisyButton>
    <DaisyButton variant="primary">Save</DaisyButton>
  </DaisyModalAction>
</DaisyModal>
```

## Testing

After migration, test:

1. **Visual Consistency**: Components look correct in both themes
2. **Functionality**: All interactions work as expected
3. **Responsive Design**: Components adapt to different screen sizes
4. **Theme Switching**: Smooth transition between themes
5. **Accessibility**: Keyboard navigation and screen readers work

## Rollback Plan

If issues arise:

1. Keep old components until migration is complete
2. Use feature flags to toggle between old/new components
3. Gradually migrate one section at a time
4. Monitor for visual regressions

## Next Steps

1. Continue migrating remaining pages
2. Update component library documentation
3. Train team on DaisyUI patterns
4. Remove old component files once migration is complete
5. Update CI/CD to check for non-DaisyUI patterns

## Resources

- [DaisyUI Documentation](https://daisyui.com/)
- [DaisyUI Components](https://daisyui.com/components/)
- [DaisyUI Themes](https://daisyui.com/docs/themes/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)