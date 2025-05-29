# Content Selection & AI Analysis System - Phase 1.3

## Overview

The Content Selection & AI Analysis System is an intelligent text selection framework that enables users to select any content within the RISCURA application and apply AI-powered analysis and improvements. This system provides real-time content analysis, batch processing capabilities, and seamless integration with existing risk management workflows.

## Features

### 🎯 Core Capabilities

- **Intelligent Text Selection**: Advanced text selection with cross-browser compatibility and touch support
- **AI-Powered Analysis**: Multiple AI actions (explain, improve, regenerate, analyze-risk, suggest-controls, compliance-check)
- **Real-time Processing**: Instant feedback and progressive analysis results
- **Batch Operations**: Queue multiple selections for efficient batch processing
- **Visual Feedback**: Smooth animations, highlighting, and progress indicators
- **Mobile Optimization**: Touch-friendly selection with haptic feedback

### 🧩 Component Architecture

```
ContentSelectionProvider
├── SelectableContent (Text selection wrapper)
├── AIActionToolbar (Context menu for AI actions)
├── ContentAnalysisPanel (Results display panel)
├── BatchSelectionManager (Batch processing interface)
└── ContentSelectionControls (Quick access buttons)
```

## Implementation Guide

### 1. Basic Integration

Wrap your page content with the `ContentSelectionProvider`:

```tsx
import {
  ContentSelectionProvider,
  EnhancedSelectableContent,
  ContentSelectionControls,
} from '@/components/ai/ContentSelectionProvider';

function RiskDetailPage() {
  return (
    <ContentSelectionProvider
      enableBatching={true}
      enableAnalysis={true}
      maxHistory={20}
      availableActions={['explain', 'improve', 'analyze-risk', 'suggest-controls']}
    >
      <div className="page-content">
        {/* Your existing content */}
        <EnhancedSelectableContent 
          contentType="risk" 
          contentId="risk-123"
          sectionType="description"
          showQualityScore={true}
        >
          <p>This content can be selected for AI analysis...</p>
        </EnhancedSelectableContent>

        {/* Quick access controls */}
        <ContentSelectionControls />
      </div>
    </ContentSelectionProvider>
  );
}
```

### 2. Advanced Configuration

#### Content Types and Actions

```tsx
// Available content types
type ContentType = 'risk' | 'control' | 'test-script' | 'document' | 'text';

// Available AI actions
type AIAction = 
  | 'explain'           // Explain the selected content
  | 'regenerate'        // Regenerate improved version
  | 'improve'           // Suggest improvements
  | 'alternatives'      // Provide alternative approaches
  | 'compliance-check'  // Check compliance requirements
  | 'analyze-risk'      // Perform risk analysis
  | 'suggest-controls'  // Suggest relevant controls
  | 'find-related';     // Find related content
```

#### Custom Selection Context

```tsx
<EnhancedSelectableContent 
  contentType="risk" 
  contentId="risk-123"
  sectionType="mitigation-strategy"
  metadata={{
    department: 'IT Security',
    criticality: 'high',
    lastReviewed: '2024-01-15'
  }}
  showQualityScore={true}
  highlightColor="#3B82F6"
>
  {/* Your content */}
</EnhancedSelectableContent>
```

### 3. Programmatic Control

Use the `useContentSelection` hook for programmatic control:

```tsx
import { useContentSelection } from '@/components/ai/ContentSelectionProvider';

function CustomComponent() {
  const {
    currentSelection,
    analysisResults,
    batchSelections,
    showAnalysisPanel,
    showBatchManager,
    addToBatch,
    stats
  } = useContentSelection();

  const handleCustomAction = () => {
    if (currentSelection) {
      addToBatch(currentSelection, ['improve', 'compliance-check'], 'high');
    }
  };

  return (
    <div>
      <button onClick={showAnalysisPanel}>
        View Results ({stats.totalResults})
      </button>
      <button onClick={showBatchManager}>
        Batch Queue ({stats.batchItems})
      </button>
    </div>
  );
}
```

## Component Reference

### ContentSelectionProvider

Main provider component that manages selection state and AI analysis.

**Props:**
- `enableBatching?: boolean` - Enable batch processing (default: true)
- `enableAnalysis?: boolean` - Enable AI analysis (default: true)  
- `maxHistory?: number` - Maximum analysis history (default: 50)
- `availableActions?: AIAction[]` - Available AI actions

### EnhancedSelectableContent

Wrapper component that makes content selectable for AI analysis.

**Props:**
- `contentType: ContentType` - Type of content being wrapped
- `contentId: string` - Unique identifier for the content
- `sectionType?: string` - Section type for context
- `metadata?: Record<string, unknown>` - Additional metadata
- `showQualityScore?: boolean` - Show content quality indicator
- `highlightColor?: string` - Custom highlight color
- `disabled?: boolean` - Disable selection

### AIActionToolbar

Context menu that appears when text is selected.

**Features:**
- Smart positioning to avoid viewport edges
- Keyboard navigation support
- Touch-friendly design
- Loading states during processing

### ContentAnalysisPanel

Sliding panel that displays AI analysis results.

**Features:**
- Resizable panel with drag handles
- Tabbed interface for different result types
- Approval/rejection workflow
- Export capabilities
- Confidence scoring

### BatchSelectionManager

Full-screen interface for managing batch processing.

**Features:**
- Multi-selection management
- Priority-based queuing
- Progress tracking
- Bulk operations
- Export/import capabilities

## AI Analysis Workflow

### 1. Text Selection
User selects text → System captures selection context → Toolbar appears

### 2. Action Selection  
User chooses AI action → System validates and queues request → Analysis begins

### 3. Processing
AI service processes request → Real-time progress updates → Results generated

### 4. Review & Apply
Results displayed in panel → User can approve/reject → Changes applied if approved

### 5. History & Learning
Results saved to history → User feedback collected → System learns preferences

## Performance Considerations

### Selection Optimization
- Debounced selection events (300ms)
- Efficient DOM manipulation
- Memory management for selection history
- Lazy loading of analysis components

### AI Processing
- Request queuing and throttling
- Parallel processing for batch operations
- Caching of analysis results
- Circuit breaker for failed requests

### Mobile Performance
- Touch event optimization
- Reduced animation complexity
- Efficient viewport calculations
- Background processing prioritization

## Accessibility Features

### Keyboard Navigation
- Tab navigation through all interactive elements
- Arrow key navigation in toolbars
- Enter/Space for activation
- Escape to cancel operations

### Screen Reader Support
- ARIA labels and descriptions
- Live regions for status updates
- Structured heading hierarchy
- Semantic markup throughout

### Visual Accessibility
- High contrast mode support
- Customizable highlight colors
- Clear focus indicators
- Reduced motion support

## Integration Examples

### Risk Management
```tsx
// Risk description with AI-powered improvements
<EnhancedSelectableContent 
  contentType="risk" 
  contentId={risk.id}
  sectionType="description"
  metadata={{ severity: risk.severity }}
>
  <p>{risk.description}</p>
</EnhancedSelectableContent>
```

### Control Procedures
```tsx
// Control procedure with compliance checking
<EnhancedSelectableContent 
  contentType="control" 
  contentId={control.id}
  sectionType="procedure"
  availableActions={['explain', 'compliance-check', 'improve']}
>
  <div>{control.procedure}</div>
</EnhancedSelectableContent>
```

### Document Analysis
```tsx
// Policy document with comprehensive analysis
<EnhancedSelectableContent 
  contentType="document" 
  contentId={document.id}
  sectionType="policy-text"
  showQualityScore={true}
  metadata={{ documentType: 'policy', version: '1.2' }}
>
  <article>{document.content}</article>
</EnhancedSelectableContent>
```

## API Reference

### useContentSelection Hook

```tsx
interface ContentSelectionContextValue {
  // Selection state
  currentSelection: TextSelection | null;
  toolbarPosition: { x: number; y: number } | null;
  isToolbarVisible: boolean;
  
  // Actions
  handleSelection: (selection: TextSelection) => void;
  handleAIAction: (action: AIAction, selection: TextSelection) => void;
  addToBatch: (selection: TextSelection, actions: AIAction[], priority?: Priority) => void;
  clearSelection: () => void;
  
  // Panel controls
  showAnalysisPanel: () => void;
  hideAnalysisPanel: () => void;
  showBatchManager: () => void;
  hideBatchManager: () => void;
  
  // Analysis state
  analysisResults: ContentAnalysisResult[];
  batchSelections: BatchSelectionItem[];
  isProcessing: boolean;
  stats: AnalysisStats;
}
```

### useContentAnalysis Hook

```tsx
interface UseContentAnalysisReturn {
  // State
  analysisResults: ContentAnalysisResult[];
  batchSelections: BatchSelectionItem[];
  isProcessing: boolean;

  // Actions
  analyzeSelection: (selection: TextSelection, action: AIAction) => Promise<ContentAnalysisResult>;
  addToBatch: (selection: TextSelection, actions: AIAction[], priority?: Priority) => void;
  processBatch: (items: BatchSelectionItem[], actions: AIAction[]) => Promise<void>;
  
  // Management
  approveResult: (resultId: string) => void;
  rejectResult: (resultId: string) => void;
  provideFeedback: (resultId: string, feedback: 'positive' | 'negative') => void;
  retryResult: (resultId: string) => Promise<void>;
  
  // Statistics
  stats: AnalysisStats;
}
```

## Error Handling

### Selection Errors
- Invalid selection boundaries
- Cross-element selections
- Touch selection conflicts
- Clipboard access failures

### AI Processing Errors
- Network connectivity issues
- API rate limiting
- Invalid content format
- Authentication failures

### Recovery Strategies
- Automatic retry with exponential backoff
- Fallback to cached results
- User notification with retry options
- Graceful degradation of features

## Testing Strategy

### Unit Tests
- Selection detection accuracy
- AI action processing
- Context preservation
- Error handling

### Integration Tests
- Cross-component communication
- State management consistency
- Performance under load
- Mobile touch interactions

### User Experience Tests
- Selection fluidity
- Response time benchmarks
- Accessibility compliance
- Cross-browser compatibility

## Future Enhancements

### Phase 1.4 - Advanced AI Features
- Context-aware suggestion engine
- Multi-language content analysis
- Industry-specific AI models
- Collaborative content improvement

### Phase 1.5 - Enterprise Integration
- Workflow automation
- Approval routing systems
- Audit trail integration
- Advanced permission controls

### Phase 1.6 - Performance Optimization
- WebWorker processing
- Edge computing integration
- Progressive enhancement
- Predictive loading

## Troubleshooting

### Common Issues

**Selection not working:**
- Check ContentSelectionProvider wrapper
- Verify browser selection API support
- Test without browser extensions

**AI actions not appearing:**
- Confirm availableActions configuration
- Check AI service connectivity
- Verify user permissions

**Performance issues:**
- Reduce maxHistory setting
- Disable animations on low-end devices
- Check for memory leaks in selection handling

**Mobile touch problems:**
- Ensure touch events are not prevented
- Check viewport meta tag configuration
- Test with different touch gestures

### Debug Mode

Enable debug logging:
```tsx
<ContentSelectionProvider
  enableDebug={true}
  // ... other props
>
```

This will log selection events, AI processing, and performance metrics to the browser console.

## Contributing

### Code Standards
- TypeScript strict mode compliance
- ESLint and Prettier formatting
- Comprehensive type definitions
- Performance-focused implementation

### Testing Requirements
- 90%+ test coverage
- Cross-browser compatibility testing
- Accessibility compliance verification
- Performance benchmarking

### Documentation
- JSDoc comments for all public APIs
- Usage examples for all components
- Performance considerations documented
- Accessibility features explained

---

*For questions or support, please refer to the main RISCURA documentation or contact the development team.* 