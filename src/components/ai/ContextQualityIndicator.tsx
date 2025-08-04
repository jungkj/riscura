import React from 'react';
import { motion } from 'framer-motion';
import {
import { DaisyCardTitle, DaisyCardDescription } from '@/components/ui/daisy-components';
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  Clock,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';

// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';

interface ContextQualityIndicatorProps {
  contextQuality: {
    relevance: number;
    completeness: number;
    freshness: number;
  }
  contextMode: 'minimal' | 'moderate' | 'comprehensive';
  onRefreshContext?: () => Promise<void>;
  onChangeMode?: (mode: 'minimal' | 'moderate' | 'comprehensive') => void;
  className?: string;
  compact?: boolean;
}

const QualityMetric: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  threshold?: { good: number; warning: number }
}> = ({ 
  label, 
  value, 
  icon, 
  description, 
  threshold = { good: 0.7, warning: 0.4 } 
}) => {
  const percentage = Math.round(value * 100);
  
  const getQualityColor = () => {
    if (value >= threshold.good) return 'text-green-600 bg-green-50 dark:bg-green-950/20';
    if (value >= threshold.warning) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
    return 'text-red-600 bg-red-50 dark:bg-red-950/20';
  }

  const getProgressColor = () => {
    if (value >= threshold.good) return 'bg-green-500';
    if (value >= threshold.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <DaisyTooltipProvider>
        <DaisyTooltip>
          <DaisyTooltipTrigger asChild>
            <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${getQualityColor()}`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm font-semibold">{percentage}%</span>
                </div>
                <DaisyProgress 
                  value={percentage} 
                  className="h-1.5 mt-1"
                  style={{
                    '--progress-background': getProgressColor()
                  } as React.CSSProperties} />
</div>
            </div>
          </div>
        </DaisyTooltipProvider>
        <DaisyTooltipContent>
            <p className="max-w-xs">{description}</p>
        </DaisyTooltipContent>
      </DaisyTooltip>
    
  );
}

const ContextModeSelector: React.FC<{
  currentMode: 'minimal' | 'moderate' | 'comprehensive';
  onModeChange: (mode: 'minimal' | 'moderate' | 'comprehensive') => void;
}> = ({ currentMode, onModeChange }) => {
  const modes = [
    {
      value: 'minimal' as const,
      label: 'Minimal',
      description: 'Basic context only',
      icon: <Zap className="h-3 w-3" />
    },
    {
      value: 'moderate' as const,
      label: 'Moderate',
      description: 'Balanced context with key details',
      icon: <Database className="h-3 w-3" />
    },
    {
      value: 'comprehensive' as const,
      label: 'Comprehensive',
      description: 'Full context with all available data',
      icon: <TrendingUp className="h-3 w-3" />
    }
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {modes.map((mode) => (
        <DaisyTooltipProvider key={mode.value}>
            <DaisyTooltip>
              <DaisyTooltipTrigger asChild>
                <DaisyButton
                variant={currentMode === mode.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onModeChange(mode.value)}
                className="flex-1 text-xs px-2 py-1" />
                {mode.icon}
                <span className="ml-1">{mode.label}</span>
              </DaisyTooltipProvider>
            </DaisyTooltipTrigger>
            <DaisyTooltipContent>
                <p>{mode.description}</p>
            </DaisyTooltipContent>
          </DaisyTooltip>
        
      ))}
    </div>
  );
}

export const ContextQualityIndicator: React.FC<ContextQualityIndicatorProps> = ({
  contextQuality,
  contextMode,
  onRefreshContext,
  onChangeMode,
  className = '',
  compact = false
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const overallQuality = (
    contextQuality.relevance + 
    contextQuality.completeness + 
    contextQuality.freshness
  ) / 3;

  const handleRefresh = async () => {
    if (!onRefreshContext) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshContext();
    } finally {
      setIsRefreshing(false);
    }
  }

  const getOverallStatus = () => {
    if (overallQuality >= 0.7) return { color: 'text-green-600', label: 'Excellent', icon: CheckCircle }
    if (overallQuality >= 0.5) return { color: 'text-yellow-600', label: 'Good', icon: Info }
    return { color: 'text-red-600', label: 'Needs Attention', icon: AlertTriangle }
  }

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${className}`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className="text-sm font-medium">Context: {status.label}</span>
        </div>
        
        <div className="flex-1">
          <DaisyProgress value={overallQuality * 100} className="h-1" />
</div>

        <DaisyBadge variant="outline" className="text-xs" >
  {contextMode}
</DaisyProgress>
        </DaisyBadge>

        {Boolean(onRefreshContext) && (
          <DaisyButton
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0" >
  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
</DaisyButton>
          </DaisyButton>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <DaisyCard >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${status.color}`} />
              <div>
                <DaisyCardTitle className="text-base">Context Quality</DaisyCardTitle>
                <DaisyCardDescription >
  {status.label} - {Math.round(overallQuality * 100)}% overall
</DaisyCardDescription>
                </p>
              </div>
            </div>

            {Boolean(onRefreshContext) && (
              <DaisyButton
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2" >
  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
</DaisyButton>
                Refresh
              </DaisyButton>
            )}
          </div>
        

        <DaisyCardBody className="space-y-4" >
  {/* Quality Metrics */}
</DaisyCardBody>
          <div className="space-y-3">
            <QualityMetric
              label="Relevance"
              value={contextQuality.relevance}
              icon={<TrendingUp className="h-3 w-3" />}
              description="How relevant the current context is to your work and queries"
              threshold={{ good: 0.6, warning: 0.3 }} />

            <QualityMetric
              label="Completeness"
              value={contextQuality.completeness}
              icon={<Database className="h-3 w-3" />}
              description="How complete the context information is for making informed decisions"
              threshold={{ good: 0.7, warning: 0.4 }} />

            <QualityMetric
              label="Freshness"
              value={contextQuality.freshness}
              icon={<Clock className="h-3 w-3" />}
              description="How recent and up-to-date the context information is"
              threshold={{ good: 0.8, warning: 0.5 }} />
          </div>

          {/* Context Mode Selector */}
          {Boolean(onChangeMode) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Context Mode</span>
              </div>
              <ContextModeSelector
                currentMode={contextMode}
                onModeChange={onChangeMode} />
              <p className="text-xs text-muted-foreground">
                Higher modes provide more context but may increase response time
              </p>
            </div>
          )}

          {/* Quality Insights */}
          <div className="pt-2 border-t">
            <div className="space-y-2">
              {contextQuality.relevance < 0.5 && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                  <DaisyAlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" >
  <div className="text-xs text-amber-800 dark:text-amber-200">
</DaisyAlertTriangle>
                    <strong>Low relevance:</strong> Consider selecting specific risks or controls 
                    to improve context quality.
                  </div>
                </div>
              )}

              {contextQuality.completeness < 0.6 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Incomplete context:</strong> Add more details about your current work 
                    or switch to comprehensive mode.
                  </div>
                </div>
              )}

              {contextQuality.freshness < 0.4 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                  <Clock className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-xs text-red-800 dark:text-red-200">
                    <strong>Stale context:</strong> Refresh context to get the latest information 
                    about your risks and controls.
                  </div>
                </div>
              )}

              {overallQuality >= 0.8 && (
                <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-xs text-green-800 dark:text-green-200">
                    <strong>Excellent context:</strong> ARIA has comprehensive context about your 
                    current work and can provide highly relevant assistance.
                  </div>
                </div>
              )}
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </motion.div>
  );
} 