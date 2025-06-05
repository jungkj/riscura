import React from 'react';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useBreakpoint, useDeviceType } from '../../lib/responsive/ResponsiveUtils';
import { useKeyboardContext } from '../../lib/keyboard/KeyboardShortcuts';
import { useReducedMotion } from '../../lib/accessibility/AccessibilityUtils';
import { EnhancedErrorState, NetworkError, ValidationError } from '../ui/EnhancedErrorStates';
import { EmptyState, NoData, NoSearchResults, FirstTimeSetup } from '../ui/EmptyStates';
import { ThemeService } from '../../lib/theme/ThemeProvider';
import { KeyboardShortcutsHelp } from '../../lib/keyboard/KeyboardShortcuts';

interface UIPolishDashboardProps {
  className?: string;
}

export const UIPolishDashboard: React.FC<UIPolishDashboardProps> = ({
  className = ''
}) => {
  const { theme, getColor, getSpacing, getBorderRadius, getShadow } = useTheme();
  const breakpoint = useBreakpoint();
  const deviceType = useDeviceType();
  const prefersReducedMotion = useReducedMotion();
  
  const [activeDemo, setActiveDemo] = React.useState<string>('theme');
  const [showErrorDemo, setShowErrorDemo] = React.useState(false);
  const [showEmptyDemo, setShowEmptyDemo] = React.useState(false);

  // Set keyboard context
  useKeyboardContext('ui-polish');

  const demoSections = [
    {
      id: 'theme',
      title: 'Theme System',
      description: 'Consistent theming across all components'
    },
    {
      id: 'responsive',
      title: 'Responsive Design',
      description: 'Mobile-first responsive breakpoints'
    },
    {
      id: 'accessibility',
      title: 'Accessibility Features',
      description: 'WCAG compliant accessibility utilities'
    },
    {
      id: 'animations',
      title: 'Animation System',
      description: 'Smooth transitions and micro-interactions'
    },
    {
      id: 'errors',
      title: 'Error States',
      description: 'Enhanced error handling and recovery'
    },
    {
      id: 'empty',
      title: 'Empty States',
      description: 'Pleasant empty state designs'
    },
    {
      id: 'keyboard',
      title: 'Keyboard Shortcuts',
      description: 'Productivity-focused keyboard navigation'
    }
  ];

  const styles = {
    container: {
      padding: getSpacing('lg'),
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: theme.typography.fontFamily.sans.join(', ')
    },
    header: {
      marginBottom: getSpacing('2xl'),
      textAlign: 'center' as const
    },
    title: {
      fontSize: theme.typography.fontSize['3xl'][0],
      fontWeight: theme.typography.fontWeight.bold,
      color: getColor('text.primary'),
      marginBottom: getSpacing('md')
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg[0],
      color: getColor('text.secondary'),
      maxWidth: '600px',
      margin: '0 auto'
    },
    nav: {
      display: 'grid',
      gridTemplateColumns: breakpoint === 'xs' || breakpoint === 'sm' 
        ? '1fr' 
        : 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: getSpacing('md'),
      marginBottom: getSpacing('2xl')
    },
    navItem: {
      padding: getSpacing('lg'),
      backgroundColor: getColor('background.card'),
      border: `2px solid ${getColor('border.primary')}`,
      borderRadius: getBorderRadius('lg'),
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: getShadow('sm')
    },
    activeNavItem: {
      borderColor: getColor('primary.500'),
      backgroundColor: getColor('primary.50')
    },
    navTitle: {
      fontSize: theme.typography.fontSize.lg[0],
      fontWeight: theme.typography.fontWeight.semibold,
      color: getColor('text.primary'),
      marginBottom: getSpacing('xs')
    },
    navDescription: {
      fontSize: theme.typography.fontSize.sm[0],
      color: getColor('text.secondary')
    },
    content: {
      backgroundColor: getColor('background.card'),
      borderRadius: getBorderRadius('lg'),
      padding: getSpacing('xl'),
      boxShadow: getShadow('md'),
      marginBottom: getSpacing('xl')
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: breakpoint === 'xs' 
        ? '1fr' 
        : breakpoint === 'sm' 
        ? 'repeat(2, 1fr)'
        : 'repeat(3, 1fr)',
      gap: getSpacing('lg')
    },
    card: {
      padding: getSpacing('md'),
      backgroundColor: getColor('background.secondary'),
      borderRadius: getBorderRadius('md'),
      border: `1px solid ${getColor('border.primary')}`
    },
    button: {
      padding: `${getSpacing('sm')} ${getSpacing('md')}`,
      backgroundColor: getColor('primary.500'),
      color: getColor('text.inverse'),
      border: 'none',
      borderRadius: getBorderRadius('md'),
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.sm[0],
      fontWeight: theme.typography.fontWeight.medium,
      transition: 'all 0.2s ease'
    },
    secondaryButton: {
      backgroundColor: getColor('background.secondary'),
      color: getColor('text.primary'),
      border: `1px solid ${getColor('border.primary')}`
    }
  };

  const renderThemeDemo = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Primary Colors</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(theme.colors.primary).slice(0, 5).map(([shade, color]) => (
            <div
              key={shade}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: color,
                borderRadius: getBorderRadius('sm'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: shade === '50' || shade === '100' ? '#000' : '#fff'
              }}
            >
              {shade}
            </div>
          ))}
        </div>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Typography</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: theme.typography.fontSize['2xl'][0], fontWeight: theme.typography.fontWeight.bold }}>
            Heading 2XL
          </div>
          <div style={{ fontSize: theme.typography.fontSize.lg[0], fontWeight: theme.typography.fontWeight.semibold }}>
            Large Text
          </div>
          <div style={{ fontSize: theme.typography.fontSize.base[0] }}>
            Base Text
          </div>
          <div style={{ fontSize: theme.typography.fontSize.sm[0], color: getColor('text.muted') }}>
            Small Text
          </div>
        </div>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Shadows & Borders</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', boxShadow: getShadow('sm'), borderRadius: getBorderRadius('md') }}>
            Small Shadow
          </div>
          <div style={{ padding: '12px', boxShadow: getShadow('md'), borderRadius: getBorderRadius('lg') }}>
            Medium Shadow
          </div>
          <div style={{ padding: '12px', border: `2px solid ${getColor('border.primary')}`, borderRadius: getBorderRadius('xl') }}>
            Border Example
          </div>
        </div>
      </div>
    </div>
  );

  const renderResponsiveDemo = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Current Breakpoint</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: getColor('primary.500') }}>
          {breakpoint.toUpperCase()}
        </div>
        <p style={{ fontSize: '14px', color: getColor('text.secondary'), margin: '8px 0 0 0' }}>
          Resize your browser to see responsive changes
        </p>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Device Type</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>Mobile: {deviceType.isMobile ? '✅' : '❌'}</div>
          <div>Tablet: {deviceType.isTablet ? '✅' : '❌'}</div>
          <div>Desktop: {deviceType.isDesktop ? '✅' : '❌'}</div>
          <div>Touch: {deviceType.isTouchDevice ? '✅' : '❌'}</div>
        </div>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Grid Layout</h4>
        <p style={{ fontSize: '14px', color: getColor('text.secondary'), margin: 0 }}>
          This grid automatically adjusts from 1 column on mobile to 3 columns on desktop
        </p>
      </div>
    </div>
  );

  const renderAccessibilityDemo = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Motion Preferences</h4>
        <div style={{ fontSize: '18px', color: getColor('primary.500') }}>
          Reduced Motion: {prefersReducedMotion ? 'ON' : 'OFF'}
        </div>
        <p style={{ fontSize: '14px', color: getColor('text.secondary'), margin: '8px 0 0 0' }}>
          Animations respect user's motion preferences
        </p>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Focus Management</h4>
        <button 
          style={styles.button}
          onFocus={(e) => {
            e.target.style.outline = `2px solid ${getColor('primary.500')}`;
            e.target.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.target.style.outline = 'none';
          }}
        >
          Focus me with Tab
        </button>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>ARIA Support</h4>
        <div 
          role="progressbar" 
          aria-valuenow={75} 
          aria-valuemin={0} 
          aria-valuemax={100}
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: getColor('background.secondary'),
            borderRadius: getBorderRadius('full'),
            overflow: 'hidden'
          }}
        >
          <div style={{
            width: '75%',
            height: '100%',
            backgroundColor: getColor('primary.500'),
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{ fontSize: '14px', color: getColor('text.secondary'), margin: '8px 0 0 0' }}>
          Progress: 75% (announced to screen readers)
        </p>
      </div>
    </div>
  );

  const renderErrorDemo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: getSpacing('lg') }}>
      <div style={{ display: 'flex', gap: getSpacing('sm'), flexWrap: 'wrap' }}>
        <button 
          style={styles.button}
          onClick={() => setShowErrorDemo(!showErrorDemo)}
        >
          {showErrorDemo ? 'Hide' : 'Show'} Error Examples
        </button>
      </div>
      
      {showErrorDemo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: getSpacing('lg') }}>
          <NetworkError onRetry={() => console.log('Retrying...')} />
          
          <ValidationError
            errors={[
              { field: 'email', message: 'Email is required' },
              { field: 'password', message: 'Password must be at least 8 characters' }
            ]}
            onEdit={() => console.log('Editing form...')}
          />
          
          <EnhancedErrorState
            error={{
              title: 'Custom Error',
              message: 'This is a custom error with recovery options',
              severity: 'high',
              timestamp: new Date(),
              recoveryOptions: [
                {
                  label: 'Reload Page',
                  action: () => window.location.reload(),
                  type: 'primary',
                  icon: '🔄'
                }
              ]
            }}
            showDetails
          />
        </div>
      )}
    </div>
  );

  const renderEmptyDemo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: getSpacing('lg') }}>
      <div style={{ display: 'flex', gap: getSpacing('sm'), flexWrap: 'wrap' }}>
        <button 
          style={styles.button}
          onClick={() => setShowEmptyDemo(!showEmptyDemo)}
        >
          {showEmptyDemo ? 'Hide' : 'Show'} Empty State Examples
        </button>
      </div>
      
      {showEmptyDemo && (
        <div style={{ display: 'grid', gap: getSpacing('xl') }}>
          <NoData 
            entity="Risks"
            onAdd={() => console.log('Adding risk...')}
            onImport={() => console.log('Importing risks...')}
          />
          
          <NoSearchResults
            query="complex search term"
            onClear={() => console.log('Clearing search...')}
            onRefine={() => console.log('Refining search...')}
          />
          
          <FirstTimeSetup
            feature="Risk Management"
            onGetStarted={() => console.log('Getting started...')}
            onLearnMore={() => console.log('Learning more...')}
          />
        </div>
      )}
    </div>
  );

  const renderKeyboardDemo = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Available Shortcuts</h4>
        <KeyboardShortcutsHelp context="ui-polish" />
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Common Shortcuts</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Search</span>
            <kbd style={{ padding: '2px 6px', background: getColor('background.secondary'), borderRadius: '4px' }}>
              /
            </kbd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Help</span>
            <kbd style={{ padding: '2px 6px', background: getColor('background.secondary'), borderRadius: '4px' }}>
              ?
            </kbd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Escape</span>
            <kbd style={{ padding: '2px 6px', background: getColor('background.secondary'), borderRadius: '4px' }}>
              Esc
            </kbd>
          </div>
        </div>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Try It</h4>
        <p style={{ fontSize: '14px', color: getColor('text.secondary'), margin: 0 }}>
          Press <kbd style={{ padding: '2px 6px', background: getColor('background.secondary'), borderRadius: '4px' }}>?</kbd> 
          {' '}to see all available keyboard shortcuts for this page.
        </p>
      </div>
    </div>
  );

  const renderAnimationDemo = () => (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Hover Effects</h4>
        <button 
          style={{
            ...styles.button,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!prefersReducedMotion) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = getShadow('lg');
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Hover me
        </button>
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Smooth Transitions</h4>
        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: getColor('primary.500'),
          borderRadius: getBorderRadius('md'),
          transition: prefersReducedMotion ? 'none' : 'all 0.3s ease'
        }} />
      </div>
      
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 12px 0', color: getColor('text.primary') }}>Loading States</h4>
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: getColor('background.secondary'),
          borderRadius: getBorderRadius('full'),
          overflow: 'hidden'
        }}>
          <div style={{
            width: '60%',
            height: '100%',
            backgroundColor: getColor('primary.500'),
            animation: prefersReducedMotion ? 'none' : 'pulse 2s infinite'
          }} />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeDemo) {
      case 'theme': return renderThemeDemo();
      case 'responsive': return renderResponsiveDemo();
      case 'accessibility': return renderAccessibilityDemo();
      case 'animations': return renderAnimationDemo();
      case 'errors': return renderErrorDemo();
      case 'empty': return renderEmptyDemo();
      case 'keyboard': return renderKeyboardDemo();
      default: return renderThemeDemo();
    }
  };

  return (
    <div className={className} style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>UI/UX Polish Dashboard</h1>
        <p style={styles.subtitle}>
          Explore the comprehensive UI/UX improvements including theming, responsiveness, 
          accessibility, animations, error states, empty states, and keyboard shortcuts.
        </p>
      </header>

      <nav style={styles.nav}>
        {demoSections.map((section) => (
          <div
            key={section.id}
            style={{
              ...styles.navItem,
              ...(activeDemo === section.id ? styles.activeNavItem : {})
            }}
            onClick={() => setActiveDemo(section.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveDemo(section.id);
              }
            }}
          >
            <h3 style={styles.navTitle}>{section.title}</h3>
            <p style={styles.navDescription}>{section.description}</p>
          </div>
        ))}
      </nav>

      <main style={styles.content}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600', color: getColor('text.primary') }}>
          {demoSections.find(s => s.id === activeDemo)?.title}
        </h2>
        {renderContent()}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}; 