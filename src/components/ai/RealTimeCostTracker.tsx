import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Zap, 
  AlertTriangle, 
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';
import { useAI } from '@/context/AIContext';

interface RealTimeCostTrackerProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'inline';
  compact?: boolean;
  showProjections?: boolean;
  onViewDetails?: () => void;
}

export const RealTimeCostTracker: React.FC<RealTimeCostTrackerProps> = ({
  position = 'bottom-right',
  compact = false,
  showProjections = true,
  onViewDetails
}) => {
  const { 
    tokenUsageMetrics, 
    realTimeUsageStats, 
    usageAlerts, 
    canMakeRequest 
  } = useAI();

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isVisible, setIsVisible] = useState(true);
  const [pulseAlert, setPulseAlert] = useState(false);

  const quotaCheck = canMakeRequest();
  const hasActiveAlerts = usageAlerts.length > 0;
  const dailyPercentage = tokenUsageMetrics.dailyPercentage;
  const isNearLimit = dailyPercentage >= 80;
  const isAtLimit = dailyPercentage >= 95;

  // Pulse animation when approaching limits
  useEffect(() => {
    if (isNearLimit || hasActiveAlerts) {
      setPulseAlert(true);
      const timer = setTimeout(() => setPulseAlert(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isNearLimit, hasActiveAlerts]);

  const getStatusColor = () => {
    if (!quotaCheck.allowed || isAtLimit) return 'text-red-500 bg-red-50';
    if (isNearLimit) return 'text-orange-500 bg-orange-50';
    return 'text-green-500 bg-green-50';
  };

  const getPositionClasses = () => {
    if (position === 'inline') return '';
    
    const positions = {
      'bottom-right': 'fixed bottom-4 right-4',
      'bottom-left': 'fixed bottom-4 left-4',
      'top-right': 'fixed top-4 right-4',
      'top-left': 'fixed top-4 left-4'
    };
    return `${positions[position]} z-50`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!isVisible) {
    return (
      <DaisyButton
        variant="outline"
        size="sm"
        className={getPositionClasses()}
        onClick={() => setIsVisible(true)} />
        <Eye className="h-4 w-4" />
      </DaisyButton>
    );
  };

  return (
    <DaisyTooltipProvider>
        <motion.div
        className={getPositionClasses()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          ...(pulseAlert && { scale: [1, 1.05, 1] })
        }}
        transition={{ duration: 0.2 }}
      >
        <DaisyCard className={`shadow-lg border-2 ${isNearLimit ? 'border-orange-200' : 'border-gray-200'} min-w-[280px]`}>
          <DaisyCardBody className="p-3" >
  {/* Header */}
</DaisyTooltipProvider>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded-full ${getStatusColor()}`}>
                  <DollarSign className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">Usage Tracker</span>
                {hasActiveAlerts && (
                  <DaisyBadge variant="error" className="text-xs" >
  {usageAlerts.length}
</DaisyBadge>
                  </DaisyBadge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <DaisyTooltip>
                    <DaisyTooltipTrigger asChild>
                      <DaisyButton
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsExpanded(!isExpanded)} />
                      {isExpanded ? 
                        <Minimize2 className="h-3 w-3" /> : 
                        <Maximize2 className="h-3 w-3" />
                      }
                    </DaisyTooltip>
                  </DaisyTooltipTrigger>
                  <DaisyTooltipContent>
                      {isExpanded ? 'Minimize' : 'Expand'}
                  </DaisyTooltipContent>
                </DaisyTooltip>
                <DaisyTooltip>
                    <DaisyTooltipTrigger asChild>
                      <DaisyButton
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsVisible(false)} />
                      <EyeOff className="h-3 w-3" />
                    </DaisyTooltip>
                  </DaisyTooltipTrigger>
                  <DaisyTooltipContent>
                      Hide tracker
                  </DaisyTooltipContent>
                </DaisyTooltip>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {/* Current Session */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Session</span>
                      <span className="font-medium">
                        {formatDuration(realTimeUsageStats.sessionDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>{realTimeUsageStats.sessionTokens.toLocaleString()} tokens</span>
                      <span>${realTimeUsageStats.sessionCost.toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Daily Quota */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Daily Quota</span>
                      <span className={isNearLimit ? 'text-orange-600 font-medium' : ''}>
                        {dailyPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <DaisyProgress 
                      value={Math.min(dailyPercentage, 100)} 
                      className="h-1" />
<div className="flex justify-between text-xs text-muted-foreground">
                      <span>{tokenUsageMetrics.dailyTokens.toLocaleString()}</span>
                      <span>{tokenUsageMetrics.dailyLimit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Today's Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Today</div>
                      <div className="font-medium">
                        {realTimeUsageStats.todayTokens.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        ${realTimeUsageStats.todayCost.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversations</div>
                      <div className="font-medium">
                        {realTimeUsageStats.todayConversations}
                      </div>
                      <div className="text-muted-foreground">
                        {tokenUsageMetrics.currentTier}
                      </div>
                    </div>
                  </div>

                  {/* Cost Projections */}
                  {showProjections && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Projected Cost</div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-blue-600">
                            ${realTimeUsageStats.costProjections.daily.toFixed(2)}
                          </div>
                          <div className="text-muted-foreground">Day</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">
                            ${realTimeUsageStats.costProjections.weekly.toFixed(2)}
                          </div>
                          <div className="text-muted-foreground">Week</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">
                            ${realTimeUsageStats.costProjections.monthly.toFixed(2)}
                          </div>
                          <div className="text-muted-foreground">Month</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {hasActiveAlerts && (
                    <div className="space-y-1">
                      {usageAlerts.slice(0, 2).map((alert) => (
                        <div 
                          key={alert.id}
                          className="flex items-center space-x-2 p-2 bg-orange-50 rounded text-xs"
                        >
                          <DaisyAlertTriangle className="h-3 w-3 text-orange-500" >
  <span className="flex-1 text-orange-700">
</DaisyProgress>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quota Status */}
                  {!quotaCheck.allowed && (
                    <div className="p-2 bg-red-50 rounded text-xs">
                      <div className="flex items-center space-x-2 text-red-700">
                        <DaisyAlertTriangle className="h-3 w-3" >
  <span>
</DaisyAlertTriangle>{quotaCheck.reason}</span>
                      </div>
                    </div>
                  )}

                  {/* View Details Button */}
                  {onViewDetails && (
                    <DaisyButton
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={onViewDetails}>
          View Detailed Analytics

        </DaisyButton>
                    </DaisyButton>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compact View */}
            {!isExpanded && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Zap className="h-3 w-3 text-blue-500" />
                  <span>{realTimeUsageStats.sessionTokens.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>${realTimeUsageStats.sessionCost.toFixed(4)}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    isAtLimit ? 'bg-red-500' : 
                    isNearLimit ? 'bg-orange-500' : 
                    'bg-green-500'
                  }`} />
                </div>
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>
      </motion.div>
    
  );
};

export default RealTimeCostTracker; 