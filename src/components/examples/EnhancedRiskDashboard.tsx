'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Accessibility Imports
import {
  AccessibilityProvider,
  useAccessibility,
  useAnnouncements,
  useFocusManagement,
  useKeyboardNavigation,
  VisuallyHidden,
  FocusTrap,
  AriaLabel,
} from '@/lib/accessibility/AccessibilityProvider'

// Performance Imports
import {
  PerformanceProvider,
  usePerformance,
  useVirtualScrolling,
  useOfflineData,
  LazyImage,
} from '@/lib/performance/PerformanceProvider'
import Link from 'next/link';

// UX Enhancements
import {
  ErrorBoundary,
  LoadingSpinner,
  LoadingDots,
  LoadingPulse,
  SkeletonLoader,
  LoadingOverlay,
  ProgressBar,
  CircularProgress,
  FadeIn,
  SlideIn,
  StaggeredList,
  Toast,
  useLoadingState,
  useToast,
  useProgressiveEnhancement,
} from '@/components/ui/UXEnhancements'

// Types
interface Risk {
  id: string
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  category: string;
  owner: string;
  status: 'active' | 'mitigated' | 'monitoring' | 'closed';
  lastUpdated: string;
  progress: number;
  department: string;
  tags: string[];
  imageUrl?: string;
}

interface MetricData {
  label: string;
  value: number;
  change: number;
  target: number;
  format: 'number' | 'percentage' | 'currency';
  color: 'primary' | 'success' | 'warning' | 'error';
}

// Sample Data
const generateSampleRisks = (_count: number): Risk[] => {
  const _categories = ['Operational', 'Financial', 'Compliance', 'Strategic', 'Technology']
  const departments = ['IT', 'Finance', 'Operations', 'Legal', 'Marketing'];
  const owners = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'David Wilson'];
  const statuses: Risk['status'][] = ['active', 'mitigated', 'monitoring', 'closed'];
  const levels: Risk['level'][] = ['low', 'medium', 'high', 'critical'];

  return Array.from({ length: count }, (_, index) => ({
    id: `risk-${index + 1}`,
    title: `Risk Item ${index + 1}`,
    description: `This is a detailed description of risk item ${index + 1} explaining the potential impact and mitigation strategies.`,
    level: levels[Math.floor(Math.random() * levels.length)],
    score: Math.floor(Math.random() * 100) + 1,
    category: categories[Math.floor(Math.random() * categories.length)],
    owner: owners[Math.floor(Math.random() * owners.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    progress: Math.floor(Math.random() * 100),
    department: departments[Math.floor(Math.random() * departments.length)],
    tags: ['Tag1', 'Tag2'].slice(0, Math.floor(Math.random() * 3) + 1),
    imageUrl:
      Math.random() > 0.7 ? `https://via.placeholder.com/150x100?text=Risk${index + 1}` : undefined,
  }));
}

const metricsData: MetricData[] = [
  {
    label: 'Total Risks',
    value: 1247,
    change: 12,
    target: 1200,
    format: 'number',
    color: 'primary',
  },
  {
    label: 'High Priority',
    value: 45,
    change: -8,
    target: 50,
    format: 'number',
    color: 'warning',
  },
  {
    label: 'Mitigation Rate',
    value: 87,
    change: 5,
    target: 90,
    format: 'percentage',
    color: 'success',
  },
  {
    label: 'Risk Budget',
    value: 2450000,
    change: -150000,
    target: 2500000,
    format: 'currency',
    color: 'error',
  },
];

// Accessibility Settings Panel
const AccessibilityPanel: React.FC = () => {
  const { settings, updateSettings } = useAccessibility()
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md bg-surface-secondary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {Boolean(isOpen) && (
        <FocusTrap
          active={isOpen}
          className="absolute right-0 top-full mt-2 w-80 bg-surface-primary border border-surface-tertiary rounded-lg shadow-lg p-4 z-50"
        >
          <h3 className="text-lg font-semibold mb-4">Accessibility Settings</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span>High Contrast Mode</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span>Reduce Motion</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.screenReaderMode}
                onChange={(e) => updateSettings({ screenReaderMode: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span>Screen Reader Mode</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
                className="w-full p-2 border border-surface-tertiary rounded focus:ring-2 focus:ring-primary"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color Blind Support</label>
              <select
                value={settings.colorBlindMode}
                onChange={(e) => updateSettings({ colorBlindMode: e.target.value as any })}
                className="w-full p-2 border border-surface-tertiary rounded focus:ring-2 focus:ring-primary"
              >
                <option value="none">None</option>
                <option value="protanopia">Protanopia</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Close
          </button>
        </FocusTrap>
      )}
    </div>
  );
}

// Performance Metrics Panel
const PerformancePanel: React.FC = () => {
  const { metrics, settings, updateSettings } = usePerformance()
  const [isOpen, setIsOpen] = useState(false);

  const formatMetric = (_value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md bg-surface-secondary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Performance metrics"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {Boolean(isOpen) && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface-primary border border-surface-tertiary rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="text-sm text-text-secondary">Page Load Time</div>
              <div className="font-mono text-sm">{formatMetric(metrics.pageLoadTime, 'ms')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-text-secondary">Memory Usage</div>
              <div className="font-mono text-sm">{formatMetric(metrics.memoryUsage, 'MB')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-text-secondary">LCP</div>
              <div className="font-mono text-sm">
                {formatMetric(metrics.largestContentfulPaint, 'ms')}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-text-secondary">CLS</div>
              <div className="font-mono text-sm">
                {formatMetric(metrics.cumulativeLayoutShift, '')}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Settings</h4>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableVirtualScrolling}
                onChange={(e) => updateSettings({ enableVirtualScrolling: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm">Virtual Scrolling</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableImageOptimization}
                onChange={(e) => updateSettings({ enableImageOptimization: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm">Image Optimization</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.enableOfflineMode}
                onChange={(e) => updateSettings({ enableOfflineMode: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm">Offline Mode</span>
            </label>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
const MetricCard: React.FC<{ metric: MetricData; index: number }> = ({ metric, index }) => {
  const formatValue = (_value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${(value / 1000000).toFixed(1)}M`;
      default:
        return value.toLocaleString();
    }
  }

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-success' : change < 0 ? 'text-error' : 'text-text-secondary';
  }

  return (
    <FadeIn delay={index * 100}>
      <div className="bg-surface-primary border border-surface-tertiary rounded-lg p-6 hover:shadow-notion-sm transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium text-text-secondary">{metric.label}</h3>
          <div
            className={cn('text-xs px-2 py-1 rounded-full', {
              'bg-primary/10 text-primary': metric.color === 'primary',
              'bg-success/10 text-success': metric.color === 'success',
              'bg-warning/10 text-warning': metric.color === 'warning',
              'bg-error/10 text-error': metric.color === 'error',
            })}
          >
            Target: {formatValue(metric.target, metric.format)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-2xl font-semibold text-text-primary">
            {formatValue(metric.value, metric.format)}
          </div>

          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', getChangeColor(metric.change))}>
              {metric.change > 0 ? '+' : ''}
              {formatValue(Math.abs(metric.change), metric.format)}
            </span>
            <span className="text-xs text-text-secondary">vs last month</span>
          </div>

          <DaisyProgressBar
            progress={(metric.value / metric.target) * 100}
            color={metric.color}
            className="h-2" />
</div>
      </div>
    </FadeIn>
  );
}

// Risk Item Component for Virtual Scrolling
const RiskItem: React.FC<{ risk: Risk; index: number }> = ({ risk, index }) => {
  const { settings } = usePerformance();

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-error text-white';
      case 'high':
        return 'bg-warning text-black';
      case 'medium':
        return 'bg-primary text-white';
      case 'low':
        return 'bg-success text-white';
      default:
        return 'bg-surface-secondary text-text-primary';
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-error';
      case 'mitigated':
        return 'text-success';
      case 'monitoring':
        return 'text-warning';
      case 'closed':
        return 'text-text-secondary';
      default:
        return 'text-text-primary';
    }
  }

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-lg p-4 hover:shadow-notion-sm transition-shadow">
      <div className="flex items-start gap-4">
        {risk.imageUrl && settings.enableImageOptimization && (
          <LazyImage
            src={risk.imageUrl}
            alt={`Risk ${risk.id} visualization`}
            width={60}
            height={40}
            className="rounded flex-shrink-0"
            placeholder={<DaisySkeletonLoader variant="rectangular" width={60} height={40} />} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-text-primary truncate">{risk.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  getLevelColor(risk.level)
                )}
              >
                {risk.level}
              </span>
              <span className="text-sm font-mono">{risk.score}</span>
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-3 line-clamp-2">{risk.description}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">
                Owner: <span className="text-text-primary">{risk.owner}</span>
              </span>
              <span className={cn('font-medium', getStatusColor(risk.status))}>{risk.status}</span>
            </div>

            <div className="flex items-center gap-2">
              <DaisyProgressBar
                progress={risk.progress}
                className="w-16 h-1"
                color={risk.progress />75 ? 'success' : risk.progress > 50 ? 'warning' : 'error'} />
              <span className="text-xs text-text-secondary">{risk.progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const VirtualScrollContainer: React.FC<{
  items: Risk[];
  itemHeight: number;
  height: number;
  renderItem: (_risk: Risk, index: number) => JSX.Element;
  className?: string;
}> = ({ items, renderItem }) => (
  <div>
    {items.map((item, index) => (
      <div key={item.id}>{renderItem(item, index)}</div>
    ))}
  </div>
);

// Main Dashboard Component
const EnhancedRiskDashboard: React.FC = () => {
  const [risks] = useState(() => generateSampleRisks(1000))
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const { startLoading, stopLoading, isLoading: loadingState } = useLoadingState();
  const { addToast, ToastContainer } = useToast();
  const { announceDataUpdate } = useAnnouncements();
  const { handleKeyPress } = useKeyboardNavigation();
  const { fetchWithCache, isOnline } = useOfflineData();
  const { settings } = usePerformance();

  // Filter risks
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const matchesSearch =
        risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLevel = selectedLevel === 'all' || risk.level === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [risks, searchTerm, selectedLevel]);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      announceDataUpdate(filteredRisks.length, 'risks');
    }, 2000);

    return () => clearTimeout(timer);
  }, [filteredRisks.length, announceDataUpdate]);

  // Simulate data refresh
  const handleRefresh = useCallback(async () => {
    startLoading('Refreshing data...')

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addToast('Data refreshed successfully', 'success');
    } catch (error) {
      addToast('Failed to refresh data', 'error');
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading, addToast]);

  // Keyboard shortcuts
  const handleKeydown = useCallback(
    (event: React.KeyboardEvent) => {
      handleKeyPress(event, {
        onEscape: () => {
          setSearchTerm('')
          setSelectedLevel('all');
        },
      });
    },
    [handleKeyPress]
  );

  return (
    <div className="min-h-screen bg-surface-secondary" onKeyDown={handleKeydown}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Enhanced Risk Dashboard</h1>
            <p className="text-text-secondary">
              Comprehensive accessibility and performance optimization demo
            </p>
          </div>

          <div className="flex items-center gap-4">
            <AccessibilityPanel />
            <PerformancePanel />
            <button
              onClick={handleRefresh}
              disabled={loadingState}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Refresh dashboard data"
            >
              {loadingState ? <LoadingSpinner size="sm" /> : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Online Status */}
        {!isOnline && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-warning font-medium">Offline Mode - Using cached data</span>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsData.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>

        {/* Controls */}
        <div className="bg-surface-primary border border-surface-tertiary rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-text-primary mb-2">
                Search Risks
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full px-3 py-2 border border-surface-tertiary rounded focus:ring-2 focus:ring-primary focus:border-primary"
                aria-describedby="search-help" />
              <div id="search-help" className="text-xs text-text-secondary mt-1">
                Press Escape to clear search
              </div>
            </div>

            <div>
              <label
                htmlFor="level-filter"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Risk Level
              </label>
              <select
                id="level-filter"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-surface-tertiary rounded focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-text-secondary">
            Showing {filteredRisks.length.toLocaleString()} of {risks.length.toLocaleString()} risks
          </div>
        </div>

        {/* Risk List */}
        <div className="bg-surface-primary border border-surface-tertiary rounded-lg">
          <div className="p-6 border-b border-surface-tertiary">
            <h2 className="text-xl font-semibold text-text-primary">Risk Items</h2>
          </div>

          <LoadingOverlay isLoading={isLoading} blur={false}>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <DaisySkeletonLoader key={index} variant="card" height={120} >
                  ))}
              </div>
            ) : filteredRisks.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-text-secondary mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-text-primary mb-2">No risks found</h3>
                <p className="text-text-secondary">Try adjusting your search criteria</p>
              </div>
            ) : settings.enableVirtualScrolling ? (
              <VirtualScrollContainer
                items={filteredRisks}
                itemHeight={140}
                height={600}
                renderItem={(_risk: Risk, index: number) => (
                  <div className="px-6 py-2">
                    <RiskItem risk={risk} index={index} />
                  </div>
                )}
                className="p-0" />
            ) : (
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                <StaggeredList staggerDelay={50}>
                  {filteredRisks.slice(0, 50).map((risk, index) => (
                    <RiskItem key={risk.id} risk={risk} index={index} />
                  ))}
                </StaggeredList>
              </div>
            )}
          </LoadingOverlay>
        </div>

        {/* Performance Information */}
        <div className="mt-8 text-xs text-text-secondary text-center">
          <p>
            Virtual scrolling: {settings.enableVirtualScrolling ? 'Enabled' : 'Disabled'} • Image
            optimization: {settings.enableImageOptimization ? 'Enabled' : 'Disabled'} • Offline
            mode: {settings.enableOfflineMode ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

// Wrapped Component with Providers
const EnhancedRiskDashboardWithProviders: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // console.error('Dashboard Error:', error, errorInfo)
      }}
    >
      <AccessibilityProvider>
        <PerformanceProvider>
          <EnhancedRiskDashboard />
        </PerformanceProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default EnhancedRiskDashboardWithProviders;
