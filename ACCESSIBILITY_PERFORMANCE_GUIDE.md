# Accessibility & Performance Optimization Guide

This guide covers the comprehensive accessibility and performance optimization implementation for the Riscura RCSA platform, ensuring WCAG 2.1 AA compliance, optimal performance, and exceptional user experience.

## Table of Contents

1. [Overview](#overview)
2. [Accessibility Implementation](#accessibility-implementation)
3. [Performance Optimization](#performance-optimization)
4. [UX Enhancement Features](#ux-enhancement-features)
5. [Implementation Examples](#implementation-examples)
6. [Testing and Validation](#testing-and-validation)
7. [Configuration](#configuration)
8. [Best Practices](#best-practices)

## Overview

The accessibility and performance optimization system provides:

- **WCAG 2.1 AA Compliance**: Complete accessibility standards compliance
- **Core Web Vitals Optimization**: Performance monitoring and optimization
- **Progressive Enhancement**: Graceful degradation for all users
- **Real-time Monitoring**: Performance metrics and accessibility tracking
- **User Customization**: Accessibility preferences and settings

## Accessibility Implementation

### Core Accessibility Provider

```typescript
import { AccessibilityProvider, useAccessibility } from '@/lib/accessibility/AccessibilityProvider';

function App() {
  return (
    <AccessibilityProvider>
      <YourApplication />
    </AccessibilityProvider>
  );
}
```

### Key Features

#### 1. WCAG 2.1 AA Compliance

- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: Full keyboard accessibility with logical tab order
- **Screen Reader Support**: Comprehensive ARIA implementation
- **Focus Management**: Visible focus indicators and focus trapping
- **Semantic HTML**: Proper heading hierarchy and landmarks

#### 2. Accessibility Settings

```typescript
interface AccessibilitySettings {
  highContrast: boolean;           // High contrast mode
  reducedMotion: boolean;          // Reduced motion preference
  focusVisible: boolean;           // Enhanced focus indicators
  screenReaderMode: boolean;       // Screen reader optimizations
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  keyboardNavigation: boolean;     // Keyboard navigation support
}
```

#### 3. ARIA Implementation

```typescript
// Comprehensive ARIA labels dictionary
const ariaLabels = {
  'nav.main': 'Main navigation',
  'action.search': 'Search',
  'data.loading': 'Loading data',
  'risk.score': 'Risk score',
  // ... 50+ predefined labels
};

// Usage
<AriaLabel labelKey="nav.main" fallback="Navigation">
  {(label) => (
    <nav aria-label={label}>
      {/* Navigation content */}
    </nav>
  )}
</AriaLabel>
```

#### 4. Screen Reader Support

```typescript
const { announceToScreenReader } = useAnnouncements();

// Announce navigation changes
announceNavigation('Dashboard');

// Announce actions
announceAction('Data saved', true);

// Announce data updates
announceDataUpdate(100, 'risks');

// Announce errors
announceError('Failed to load data');
```

#### 5. Keyboard Navigation

```typescript
const { handleKeyPress } = useKeyboardNavigation();

<div onKeyDown={(e) => handleKeyPress(e, {
  onEnter: () => handleSelect(),
  onSpace: () => handleToggle(),
  onEscape: () => handleClose(),
  onArrowUp: () => navigateUp(),
  onArrowDown: () => navigateDown(),
})}>
  {content}
</div>
```

#### 6. Focus Management

```typescript
const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();

// Focus trapping for modals
<FocusTrap active={isOpen}>
  <Modal>{content}</Modal>
</FocusTrap>

// Manual focus management
useEffect(() => {
  if (isModalOpen) {
    saveFocus();
    focusElement('#modal-title');
  } else {
    restoreFocus();
  }
}, [isModalOpen]);
```

### Accessibility Utilities

#### Skip Links
```tsx
// Automatically included in AccessibilityProvider
<button onClick={skipToContent} className="skip-link">
  Skip to main content
</button>
```

#### Live Regions
```tsx
<LiveRegion level="assertive">
  {errorMessage}
</LiveRegion>
```

#### Visually Hidden Content
```tsx
<VisuallyHidden>
  Additional context for screen readers
</VisuallyHidden>
```

## Performance Optimization

### Performance Provider

```typescript
import { PerformanceProvider, usePerformance } from '@/lib/performance/PerformanceProvider';

function App() {
  return (
    <PerformanceProvider>
      <YourApplication />
    </PerformanceProvider>
  );
}
```

### Core Web Vitals Monitoring

```typescript
interface PerformanceMetrics {
  pageLoadTime: number;              // Navigation timing
  firstContentfulPaint: number;      // FCP
  largestContentfulPaint: number;    // LCP
  cumulativeLayoutShift: number;     // CLS
  firstInputDelay: number;           // FID
  memoryUsage: number;               // Memory consumption
  networkSpeed: 'slow' | 'fast' | 'unknown';
}
```

### Performance Features

#### 1. Virtual Scrolling

```typescript
const { visibleItems, totalHeight, containerProps } = useVirtualScrolling(
  items,
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5
);

// Or use the component
<VirtualScrollContainer
  items={largeDataset}
  itemHeight={80}
  height={400}
  renderItem={(item, index) => <ItemComponent {...item} />}
  overscan={5}
/>
```

#### 2. Lazy Loading

```typescript
// Lazy image loading
<LazyImage
  src="/path/to/image.jpg"
  alt="Description"
  width={300}
  height={200}
  placeholder={<SkeletonLoader variant="rectangular" />}
  onLoad={() => console.log('Image loaded')}
/>

// Lazy component loading
<LazyComponent
  componentPath="./HeavyComponent"
  fallback={<LoadingSpinner />}
  onError={(error) => console.error('Failed to load:', error)}
/>
```

#### 3. Offline Support

```typescript
const { fetchWithCache, isOnline } = useOfflineData();

// Fetch with cache fallback
const data = await fetchWithCache(
  'risks-data',
  () => fetch('/api/risks').then(r => r.json()),
  300000 // 5 minutes TTL
);

// React to online status
{!isOnline && (
  <div className="offline-banner">
    Offline Mode - Using cached data
  </div>
)}
```

#### 4. Image Optimization

```typescript
// Automatic lazy loading with optimization
<LazyImage
  src="https://example.com/large-image.jpg"
  alt="Risk visualization"
  width={400}
  height={300}
  placeholder={<SkeletonLoader variant="rectangular" />}
  onLoad={() => trackImageLoad()}
  onError={() => trackImageError()}
/>
```

#### 5. Code Splitting & Preloading

```typescript
// Preload components on hover/visible
<PreloadLink
  href="/dashboard"
  strategy="hover" // or 'visible' or 'immediate'
>
  Dashboard
</PreloadLink>

// Dynamic imports with error handling
const preloadComponent = async (path: string) => {
  try {
    return await preloadComponent(path);
  } catch (error) {
    console.error('Failed to preload:', error);
  }
};
```

#### 6. Performance Monitoring

```typescript
const { measurePerformance } = usePerformance();

// Measure operation performance
measurePerformance('data-processing', () => {
  processLargeDataset(data);
});

// Access real-time metrics
const { metrics } = usePerformance();
console.log('LCP:', metrics.largestContentfulPaint);
console.log('Memory:', metrics.memoryUsage, 'MB');
```

### Caching System

```typescript
// Built-in cache with TTL
const { cacheData, getCachedData, clearCache } = usePerformance();

// Cache API responses
cacheData('user-data', userData, 600000); // 10 minutes

// Retrieve cached data
const cached = getCachedData('user-data');

// Clear cache when needed
clearCache();
```

## UX Enhancement Features

### Loading States

#### Loading Components
```typescript
// Various loading indicators
<LoadingSpinner size="lg" />
<LoadingDots />
<LoadingPulse lines={5} />
<SkeletonLoader variant="card" height={200} />

// Loading overlay
<LoadingOverlay 
  isLoading={isLoading} 
  blur={true}
  loadingComponent={<CustomLoader />}
>
  <ContentComponent />
</LoadingOverlay>
```

#### Progress Indicators
```typescript
// Linear progress
<ProgressBar 
  progress={75} 
  max={100} 
  color="success" 
  showLabel 
/>

// Circular progress
<CircularProgress 
  progress={85} 
  size={120} 
  strokeWidth={8} 
  color="primary" 
/>
```

### Error Handling

#### Error Boundary
```typescript
<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    logError(error, errorInfo);
  }}
  resetOnPropsChange
  resetKeys={[userId, route]}
>
  <ComponentThatMightError />
</ErrorBoundary>
```

### Animations & Transitions

#### Entrance Animations
```typescript
// Fade in animation
<FadeIn duration={500} delay={200}>
  <Content />
</FadeIn>

// Slide in animation
<SlideIn direction="up" distance={20}>
  <Content />
</SlideIn>

// Staggered list animation
<StaggeredList staggerDelay={100}>
  {items.map(item => <Item key={item.id} {...item} />)}
</StaggeredList>
```

### Notifications

#### Toast System
```typescript
const { addToast, ToastContainer } = useToast();

// Add notifications
addToast('Success message', 'success');
addToast('Error occurred', 'error', 10000); // Custom duration

// Render toast container
<ToastContainer />
```

### Custom Hooks

#### Loading State Management
```typescript
const { 
  isLoading, 
  progress, 
  message, 
  startLoading, 
  updateProgress, 
  stopLoading 
} = useLoadingState();

// Usage
const handleAsyncOperation = async () => {
  startLoading('Processing data...');
  
  try {
    updateProgress(25, 'Validating input...');
    await validateData();
    
    updateProgress(50, 'Saving changes...');
    await saveData();
    
    updateProgress(100, 'Complete!');
  } finally {
    stopLoading();
  }
};
```

#### Progressive Enhancement
```typescript
const { isEnhanced } = useProgressiveEnhancement();

// Conditionally enable advanced features
{isEnhanced && <AdvancedFeature />}
{!isEnhanced && <BasicFallback />}
```

## Implementation Examples

### Enhanced Risk Dashboard

The `EnhancedRiskDashboard` component demonstrates integration of all features:

```typescript
// Complete example with all providers
<ErrorBoundary onError={handleError}>
  <AccessibilityProvider>
    <PerformanceProvider>
      <EnhancedRiskDashboard />
    </PerformanceProvider>
  </AccessibilityProvider>
</ErrorBoundary>
```

#### Key Features Demonstrated:
- **Live accessibility settings panel**
- **Real-time performance metrics display**
- **Virtual scrolling for large datasets (1000+ items)**
- **Lazy image loading with placeholders**
- **Offline mode with cache fallback**
- **Keyboard navigation with shortcuts**
- **Screen reader announcements**
- **Responsive design with touch support**
- **Loading states and error handling**
- **Toast notifications**
- **Smooth animations with motion preferences**

### Sample Integration

```typescript
import {
  AccessibilityProvider,
  PerformanceProvider,
  ErrorBoundary,
  useAccessibility,
  usePerformance,
  LoadingSpinner,
  VirtualScrollContainer
} from '@/components/accessibility-performance';

export default function RiskManagementPage() {
  const { settings, announceToScreenReader } = useAccessibility();
  const { metrics, isOnline } = usePerformance();
  
  return (
    <ErrorBoundary>
      <main id="main-content" tabIndex={-1}>
        <h1>Risk Management</h1>
        
        {/* Performance metrics display */}
        <div className="metrics-panel">
          <span>LCP: {metrics.largestContentfulPaint}ms</span>
          <span>Memory: {metrics.memoryUsage}MB</span>
        </div>
        
        {/* Accessibility-aware data table */}
        <VirtualScrollContainer
          items={risks}
          itemHeight={120}
          height={600}
          renderItem={(risk) => (
            <RiskCard 
              {...risk} 
              onUpdate={() => announceToScreenReader('Risk updated')}
            />
          )}
        />
      </main>
    </ErrorBoundary>
  );
}
```

## Testing and Validation

### Accessibility Testing

#### Automated Testing
```typescript
// Jest + Testing Library
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Keyboard navigation testing
import userEvent from '@testing-library/user-event';

test('keyboard navigation works correctly', async () => {
  render(<Component />);
  
  await userEvent.keyboard('{Tab}');
  expect(screen.getByRole('button')).toHaveFocus();
  
  await userEvent.keyboard('{Enter}');
  expect(mockHandler).toHaveBeenCalled();
});
```

#### Manual Testing Checklist

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements accessible via Tab
  - [ ] Logical tab order
  - [ ] Escape key closes modals/dropdowns
  - [ ] Arrow keys navigate lists/grids
  - [ ] Enter/Space activate buttons

- [ ] **Screen Reader Testing**
  - [ ] Meaningful page title
  - [ ] Proper heading hierarchy (h1-h6)
  - [ ] Alt text for images
  - [ ] Form labels and descriptions
  - [ ] Live region announcements

- [ ] **Visual Testing**
  - [ ] 4.5:1 contrast ratio (normal text)
  - [ ] 3:1 contrast ratio (large text)
  - [ ] Focus indicators visible
  - [ ] Content readable at 200% zoom
  - [ ] High contrast mode support

### Performance Testing

#### Core Web Vitals Monitoring
```typescript
// Monitor real-world performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP:', entry.startTime);
    }
  });
});

observer.observe({ entryTypes: ['largest-contentful-paint'] });
```

#### Performance Benchmarks
- **Page Load Time**: < 3 seconds (3G network)
- **First Contentful Paint**: < 1.8 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1

#### Testing Tools
- **Lighthouse**: Automated performance auditing
- **WebPageTest**: Real-world performance testing
- **Chrome DevTools**: Performance profiling
- **React DevTools Profiler**: Component performance analysis

### Load Testing

```typescript
// Simulate large datasets
const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    data: generateMockData()
  }));
};

// Test virtual scrolling performance
test('virtual scrolling handles large datasets', () => {
  const largeDataset = generateLargeDataset(10000);
  const { container } = render(
    <VirtualScrollContainer
      items={largeDataset}
      itemHeight={50}
      height={400}
      renderItem={(item) => <div>{item.data}</div>}
    />
  );
  
  // Should only render visible items
  expect(container.querySelectorAll('[data-item]')).toHaveLength(
    Math.ceil(400 / 50) + 10 // overscan
  );
});
```

## Configuration

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Accessibility spacing scale
      spacing: {
        'touch-target': '44px', // Minimum touch target size
        'enterprise-1': '4px',
        'enterprise-2': '8px',
        'enterprise-3': '12px',
        'enterprise-4': '16px',
        'enterprise-5': '24px',
        'enterprise-6': '32px',
        'enterprise-7': '40px',
        'enterprise-8': '48px',
      },
      
      // High contrast colors
      colors: {
        'high-contrast': {
          bg: '#000000',
          text: '#ffffff',
          border: '#ffffff',
        },
      },
      
      // Animation controls
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    // Focus-visible plugin
    require('@tailwindcss/forms'),
    
    // Custom accessibility plugin
    function({ addUtilities }) {
      const newUtilities = {
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        
        '.focus-visible': {
          '&:focus-visible': {
            outline: '2px solid #3b82f6',
            outlineOffset: '2px',
          },
        },
        
        '.reduced-motion': {
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};
```

### CSS Custom Properties

```css
/* globals.css */
:root {
  /* Base font size controlled by accessibility settings */
  --font-size-base: 16px;
  
  /* Focus ring styling */
  --focus-ring-width: 2px;
  --focus-ring-color: #3b82f6;
  --focus-ring-offset: 2px;
  
  /* High contrast mode variables */
  --high-contrast-bg: #000000;
  --high-contrast-text: #ffffff;
  --high-contrast-border: #ffffff;
  
  /* Animation durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  /* Touch target sizes */
  --touch-target-min: 44px;
  --touch-target-comfortable: 48px;
  
  /* Z-index scale */
  --z-dropdown: 1000;
  --z-modal: 1100;
  --z-toast: 1200;
  --z-tooltip: 1300;
}

/* High contrast mode styles */
.high-contrast {
  background-color: var(--high-contrast-bg);
  color: var(--high-contrast-text);
}

.high-contrast * {
  border-color: var(--high-contrast-border) !important;
  background-color: transparent !important;
  color: var(--high-contrast-text) !important;
}

.high-contrast button,
.high-contrast input,
.high-contrast select,
.high-contrast textarea {
  background-color: var(--high-contrast-bg) !important;
  border: 2px solid var(--high-contrast-border) !important;
}

/* Reduced motion styles */
.reduced-motion *,
.reduced-motion *::before,
.reduced-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Color blind support */
.protanopia {
  filter: url('#protanopia-filter');
}

.deuteranopia {
  filter: url('#deuteranopia-filter');
}

.tritanopia {
  filter: url('#tritanopia-filter');
}

/* Focus styles */
.focus-visible:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Skip link styles */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #3b82f6;
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Screen reader mode optimizations */
.screen-reader-mode {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
  line-height: 1.6;
  letter-spacing: 0.025em;
}

.screen-reader-mode * {
  font-weight: normal !important;
  font-style: normal !important;
  text-decoration: none !important;
}

.screen-reader-mode h1,
.screen-reader-mode h2,
.screen-reader-mode h3,
.screen-reader-mode h4,
.screen-reader-mode h5,
.screen-reader-mode h6 {
  font-weight: bold !important;
}
```

### Environment Configuration

```typescript
// lib/config/accessibility.ts
export const accessibilityConfig = {
  // WCAG compliance level
  wcagLevel: 'AA' as const,
  
  // Minimum contrast ratios
  contrastRatios: {
    normal: 4.5,
    large: 3.0,
    nonText: 3.0,
  },
  
  // Touch target sizes (pixels)
  touchTargets: {
    minimum: 44,
    comfortable: 48,
    desktop: 32,
  },
  
  // Animation preferences
  animations: {
    respectReducedMotion: true,
    defaultDuration: 300,
    fastDuration: 150,
    slowDuration: 500,
  },
  
  // Screen reader settings
  screenReader: {
    enableLiveRegions: true,
    enableDescriptions: true,
    verboseMode: false,
  },
  
  // Keyboard navigation
  keyboard: {
    enableShortcuts: true,
    enableArrowNavigation: true,
    enableEscapeClose: true,
  },
};

// lib/config/performance.ts
export const performanceConfig = {
  // Core Web Vitals thresholds
  thresholds: {
    lcp: 2500, // ms
    fid: 100,  // ms
    cls: 0.1,  // score
    fcp: 1800, // ms
  },
  
  // Cache settings
  cache: {
    defaultTtl: 300000, // 5 minutes
    maxSize: 100,       // entries
    enableOffline: true,
  },
  
  // Virtual scrolling
  virtualScrolling: {
    defaultItemHeight: 80,
    defaultOverscan: 5,
    enableByDefault: true,
  },
  
  // Image optimization
  images: {
    enableLazyLoading: true,
    enableOptimization: true,
    placeholder: 'skeleton',
  },
  
  // Network optimization
  network: {
    enablePreloading: true,
    preloadStrategy: 'viewport' as const,
    enableCompression: true,
  },
};
```

## Best Practices

### Accessibility Best Practices

1. **Semantic HTML First**
   - Use proper HTML elements for their intended purpose
   - Maintain logical heading hierarchy
   - Use landmark elements (nav, main, aside, footer)

2. **Progressive Enhancement**
   - Ensure basic functionality without JavaScript
   - Add enhanced features as capabilities allow
   - Provide fallbacks for advanced features

3. **Keyboard Navigation**
   - Test all interactions with keyboard only
   - Provide visible focus indicators
   - Implement logical tab order

4. **Screen Reader Support**
   - Use descriptive alt text for images
   - Provide form labels and descriptions
   - Announce dynamic content changes

5. **Color and Contrast**
   - Don't rely on color alone to convey information
   - Ensure sufficient contrast ratios
   - Support high contrast mode

### Performance Best Practices

1. **Lazy Loading Strategy**
   - Load content as needed (images, components, data)
   - Use intersection observers for visibility detection
   - Implement progressive loading for large datasets

2. **Caching Strategy**
   - Cache API responses with appropriate TTL
   - Use service workers for offline support
   - Implement cache invalidation strategies

3. **Bundle Optimization**
   - Split code by routes and features
   - Use dynamic imports for large dependencies
   - Tree-shake unused code

4. **Image Optimization**
   - Use appropriate formats (WebP, AVIF)
   - Implement responsive images
   - Provide multiple resolutions

5. **Performance Monitoring**
   - Track Core Web Vitals in production
   - Monitor real user metrics (RUM)
   - Set up performance budgets

### UX Enhancement Best Practices

1. **Loading States**
   - Provide immediate feedback for user actions
   - Use skeleton screens for content loading
   - Show progress for long operations

2. **Error Handling**
   - Provide helpful error messages
   - Offer recovery options
   - Log errors for debugging

3. **Responsive Design**
   - Design mobile-first
   - Use touch-friendly interactive elements
   - Support both mouse and touch interactions

4. **Animation Guidelines**
   - Respect motion preferences
   - Use purposeful animations
   - Keep durations appropriate

5. **Offline Support**
   - Cache critical application data
   - Provide offline indicators
   - Enable offline functionality where possible

### Testing Best Practices

1. **Automated Testing**
   - Include accessibility tests in CI/CD
   - Test keyboard navigation automatically
   - Monitor performance regressions

2. **Manual Testing**
   - Test with actual screen readers
   - Validate with keyboard-only navigation
   - Check different color schemes

3. **Real User Testing**
   - Include users with disabilities in testing
   - Test on various devices and connections
   - Gather feedback on user experience

4. **Performance Testing**
   - Test on slow networks and devices
   - Monitor Core Web Vitals in production
   - Load test with realistic data volumes

## Conclusion

This comprehensive accessibility and performance optimization system provides:

- **Full WCAG 2.1 AA compliance** with automated and manual testing
- **Optimal performance** with Core Web Vitals monitoring and optimization
- **Exceptional user experience** with loading states, error handling, and smooth animations
- **Progressive enhancement** ensuring functionality for all users
- **Real-time monitoring** and customization options

The implementation demonstrates enterprise-grade accessibility and performance standards while maintaining developer productivity and code maintainability.

For questions or implementation support, refer to the component documentation and example implementations provided in this guide.