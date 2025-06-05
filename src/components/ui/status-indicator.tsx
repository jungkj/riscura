import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Wifi,
  WifiOff,
  Shield,
  Database,
  Cloud,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export type StatusType = 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance' | 'offline';
export type TrendType = 'up' | 'down' | 'stable';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
  pulseColor?: string;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  operational: {
    label: 'Operational',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    pulseColor: 'animate-pulse bg-green-400'
  },
  degraded: {
    label: 'Degraded Performance',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600'
  },
  partial: {
    label: 'Partial Outage',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-600'
  },
  major: {
    label: 'Major Outage',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    iconColor: 'text-red-600'
  },
  maintenance: {
    label: 'Under Maintenance',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600'
  },
  offline: {
    label: 'Offline',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    iconColor: 'text-gray-600'
  }
};

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPulse?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  showPulse = false,
  className
}) => {
  const config = statusConfigs[status];
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative">
        <div className={cn(
          'rounded-full',
          config.color,
          sizeClasses[size]
        )} />
        {showPulse && status === 'operational' && (
          <div className={cn(
            'absolute inset-0 rounded-full opacity-75',
            config.pulseColor,
            sizeClasses[size]
          )} />
        )}
      </div>
      
      {showLabel && (
        <span className={cn(
          'font-medium font-inter',
          config.textColor,
          labelSizes[size]
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
};

interface ServiceStatusProps {
  name: string;
  status: StatusType;
  uptime: string;
  responseTime: string;
  lastChecked: string;
  description?: string;
  incidents?: number;
  trend?: TrendType;
  icon?: React.ComponentType<any>;
}

export const ServiceStatus: React.FC<ServiceStatusProps> = ({
  name,
  status,
  uptime,
  responseTime,
  lastChecked,
  description,
  incidents = 0,
  trend = 'stable',
  icon: Icon = Server
}) => {
  const config = statusConfigs[status];
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn(
      'border-l-4 transition-all duration-200 hover:shadow-md',
      config.color.replace('bg-', 'border-l-'),
      'bg-white border-r border-t border-b border-gray-200'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('w-4 h-4', config.iconColor)} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 font-inter text-sm">{name}</h4>
              {description && (
                <p className="text-xs text-gray-500 font-inter mt-0.5">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator status={status} size="sm" />
            <TrendIcon className={cn('w-3 h-3', getTrendColor())} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500 font-inter">Uptime</span>
            <p className="font-semibold text-gray-900 font-inter">{uptime}</p>
          </div>
          <div>
            <span className="text-gray-500 font-inter">Response</span>
            <p className="font-semibold text-gray-900 font-inter">{responseTime}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-inter">
            Last checked: {lastChecked}
          </span>
          
          {incidents > 0 && (
            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
              {incidents} incident{incidents > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ProgressMetricProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend?: TrendType;
  trendValue?: string;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  icon?: React.ComponentType<any>;
  description?: string;
}

export const ProgressMetric: React.FC<ProgressMetricProps> = ({
  label,
  value,
  target,
  unit,
  trend = 'stable',
  trendValue,
  color = 'blue',
  icon: Icon = Activity,
  description
}) => {
  const percentage = Math.min((value / target) * 100, 100);
  
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      progress: 'bg-green-500',
      text: 'text-green-700'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      progress: 'bg-blue-500',
      text: 'text-blue-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      progress: 'bg-yellow-500',
      text: 'text-yellow-700'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      progress: 'bg-red-500',
      text: 'text-red-700'
    },
    gray: {
      bg: 'bg-secondary/20',
      border: 'border-border',
      icon: 'text-muted-foreground',
      progress: 'bg-muted-foreground',
      text: 'text-muted-foreground'
    }
  };

  const colors = colorClasses[color];

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn('p-3 rounded-xl', colors.bg, colors.border, 'border')}>
              <Icon className={cn('w-5 h-5', colors.icon)} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 font-inter text-sm">{label}</h4>
              {description && (
                <p className="text-xs text-gray-500 font-inter mt-0.5">{description}</p>
              )}
            </div>
          </div>
          
          {trendValue && (
            <div className="flex items-center space-x-1">
              <TrendIcon className={cn('w-3 h-3', getTrendColor())} />
              <span className={cn('text-xs font-medium font-inter', getTrendColor())}>
                {trendValue}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 font-inter">
              {value}{unit}
            </span>
            <span className="text-sm text-gray-500 font-inter">
              Target: {target}{unit}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-inter">Progress</span>
              <span className="font-semibold text-gray-900 font-inter">
                {percentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={cn('h-2 rounded-full', colors.progress)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SystemHealthProps {
  overallStatus: StatusType;
  services: Array<{
    name: string;
    status: StatusType;
    icon: React.ComponentType<any>;
  }>;
  metrics: {
    uptime: string;
    responseTime: string;
    throughput: string;
    errorRate: string;
  };
  lastUpdated: string;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  overallStatus,
  services,
  metrics,
  lastUpdated
}) => {
  const config = statusConfigs[overallStatus];
  
  const operationalCount = services.filter(s => s.status === 'operational').length;
  const totalServices = services.length;

  return (
    <Card className="bg-white border border-gray-200 rounded-xl">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-3 rounded-xl', config.bgColor)}>
              <Shield className={cn('w-6 h-6', config.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 font-inter">
                System Health Overview
              </CardTitle>
              <p className="text-sm text-gray-500 font-inter mt-1">
                Real-time monitoring of all critical services and infrastructure
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <StatusIndicator 
              status={overallStatus} 
              size="lg" 
              showLabel 
              showPulse={overallStatus === 'operational'} 
            />
            <p className="text-xs text-gray-500 font-inter mt-1">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Status */}
          <div>
            <h4 className="font-semibold text-gray-900 font-inter mb-4">
              Services ({operationalCount}/{totalServices} operational)
            </h4>
            
            <div className="space-y-3">
              {services.map((service, index) => {
                const ServiceIcon = service.icon;
                const serviceConfig = statusConfigs[service.status];
                
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <ServiceIcon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900 font-inter text-sm">
                        {service.name}
                      </span>
                    </div>
                    
                    <StatusIndicator status={service.status} size="sm" showLabel />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* System Metrics */}
          <div>
            <h4 className="font-semibold text-gray-900 font-inter mb-4">
              Key Metrics
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-inter">Uptime</span>
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-lg font-bold text-gray-900 font-inter mt-1">
                  {metrics.uptime}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-inter">Response</span>
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-gray-900 font-inter mt-1">
                  {metrics.responseTime}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-inter">Throughput</span>
                  <TrendingUp className="w-4 h-4 text-[#191919]" />
                </div>
                <p className="text-lg font-bold text-gray-900 font-inter mt-1">
                  {metrics.throughput}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-inter">Error Rate</span>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-lg font-bold text-gray-900 font-inter mt-1">
                  {metrics.errorRate}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Overall Health Progress */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 font-inter">
              Overall System Health
            </span>
            <span className="text-sm font-bold text-gray-900 font-inter">
              {Math.round((operationalCount / totalServices) * 100)}%
            </span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(operationalCount / totalServices) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn('h-3 rounded-full', config.color)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 