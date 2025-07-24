'use client'

import React, { useState, useEffect } from 'react'
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton'
import { DaisyBadge } from '@/components/ui/DaisyBadge'
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs'
import { DaisyProgress } from '@/components/ui/DaisyProgress'
import { DaisyAlert } from '@/components/ui/DaisyAlert'
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Users, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface RealTimeDashboardProps {
  organizationId: string
  userId: string
  className?: string
}

export default function RealTimeDashboard({ 
  organizationId, 
  userId, 
  className 
}: RealTimeDashboardProps) {
  const [metrics, setMetrics] = useState<{
    risks: any
    controls: any
  }>({
    risks: null,
    controls: null
  })
  
  const [isOnline, setIsOnline] = useState(true)
  
  // Use real-time data hook
  const {
    risks,
    controls,
    documents,
    activities,
    users,
    isLoading,
    error,
    lastUpdated,
    actions
  } = useRealTimeData({
    organizationId,
    autoSubscribe: true,
    enableLogs: true
  })
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Load metrics
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [riskMetrics, controlMetrics] = await Promise.all([
          actions.getRiskMetrics(),
          actions.getControlMetrics()
        ])
        
        setMetrics({
          risks: riskMetrics,
          controls: controlMetrics
        })
      } catch (error) {
        console.error('Error loading metrics:', error)
      }
    }
    
    if (!isLoading && risks.length >= 0) {
      loadMetrics()
    }
  }, [actions, isLoading, risks.length])
  
  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
      {lastUpdated && (
        <span className="text-muted-foreground ml-2">
          Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      )}
    </div>
  )
  
  // Risk level badge
  const RiskLevelBadge = ({ level }: { level: string | null }) => {
    const colors = {
      CRITICAL: 'bg-red-500 text-white',
      HIGH: 'bg-orange-500 text-white',
      MEDIUM: 'bg-yellow-500 text-black',
      LOW: 'bg-green-500 text-white'
    }
    
    return (
      <DaisyBadge className={cn(colors[level as keyof typeof colors] || 'bg-gray-500 text-white')}>
        {level || 'Unassessed'}
      </DaisyBadge>
    )
  }
  
  // Control effectiveness badge
  const EffectivenessBadge = ({ effectiveness }: { effectiveness: string | null }) => {
    const colors = {
      FULLY_EFFECTIVE: 'bg-green-500 text-white',
      LARGELY_EFFECTIVE: 'bg-blue-500 text-white',
      PARTIALLY_EFFECTIVE: 'bg-yellow-500 text-black',
      NOT_EFFECTIVE: 'bg-red-500 text-white'
    }
    
    return (
      <DaisyBadge className={cn(colors[effectiveness as keyof typeof colors] || 'bg-gray-500 text-white')}>
        {effectiveness?.replace(/_/g, ' ') || 'Not Assessed'}
      </DaisyBadge>
    )
  }
  
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Real-Time Dashboard</h2>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <DaisyCard key={i} className="animate-pulse">
              <DaisyCardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              
            </DaisyCard>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <DaisyAlert variant="error">
          <XCircle className="h-4 w-4" />
          <DaisyAlertDescription>
            Error loading dashboard data: {error}
            <DaisyButton 
              variant="outline" 
              size="sm" 
              onClick={actions.refreshData}
              className="ml-2"
            >
              Retry
            </DaisyButton>
          
        </DaisyAlert>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Dashboard</h2>
          <p className="text-muted-foreground">Live data from your Supabase database</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus />
          <DaisyButton 
            variant="outline" 
            size="sm" 
            onClick={actions.refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </DaisyButton>
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Total Risks</DaisyCardTitle>
            <DaisyAlertTriangle className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">{risks.length}</div>
            {metrics.risks && (
              <div className="flex gap-1 mt-2">
                <DaisyBadge variant="error" className="text-xs">
                  {metrics.risks.byLevel.critical} Critical
                </DaisyBadge>
                <DaisyBadge variant="secondary" className="text-xs">
                  {metrics.risks.byLevel.high} High
                </DaisyBadge>
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Active Controls</DaisyCardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">{controls.length}</div>
            {metrics.controls && (
              <div className="text-xs text-muted-foreground mt-2">
                {metrics.controls.effectivenessRate.toFixed(1)}% Effective
                <DaisyProgress 
                  value={metrics.controls.effectivenessRate} 
                  className="mt-1 h-2" 
                />
              </div>
            )}
          </DaisyCardBody>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Documents</DaisyCardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Files and policies
            </p>
          </DaisyCardBody>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Team Members</DaisyCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active users
            </p>
          </DaisyCardBody>
        </DaisyCard>
      </div>
      
      {/* Detailed Tabs */}
      <DaisyTabs defaultValue="risks" className="space-y-4">
        <DaisyTabsList>
          <DaisyTabsTrigger value="risks">Recent Risks</DaisyTabsTrigger>
          <DaisyTabsTrigger value="controls">Recent Controls</DaisyTabsTrigger>
          <DaisyTabsTrigger value="activities">Live Activity</DaisyTabsTrigger>
        </DaisyTabsList>
        
        <DaisyTabsContent value="risks" className="space-y-4">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Recent Risks</DaisyCardTitle>
              <DaisyCardDescription>
                Latest risks added to your organization (updates in real-time)
              </p>
            
            <DaisyCardContent>
              {risks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No risks found. Create your first risk to see real-time updates.
                </div>
              ) : (
                <div className="space-y-4">
                  {risks.slice(0, 5).map((risk) => (
                    <div key={risk.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{risk.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {risk.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{risk.category}</span>
                          <span>•</span>
                          <span>Score: {risk.riskScore}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <RiskLevelBadge level={risk.riskLevel} />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(risk.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
        
        <DaisyTabsContent value="controls" className="space-y-4">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Recent Controls</DaisyCardTitle>
              <DaisyCardDescription>
                Latest controls added to your organization (updates in real-time)
              </p>
            
            <DaisyCardContent>
              {controls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No controls found. Create your first control to see real-time updates.
                </div>
              ) : (
                <div className="space-y-4">
                  {controls.slice(0, 5).map((control) => (
                    <div key={control.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{control.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {control.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{control.type}</span>
                          <span>•</span>
                          <span>{control.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <EffectivenessBadge effectiveness={control.effectiveness} />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(control.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
        
        <DaisyTabsContent value="activities" className="space-y-4">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Live Activity Feed</DaisyCardTitle>
              <DaisyCardDescription>
                Real-time updates from your organization (auto-refreshes)
              </p>
            
            <DaisyCardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity. Start using the platform to see live updates here.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{activity.type}</span>
                          {activity.entityType && (
                            <>
                              <span>•</span>
                              <span>{activity.entityType}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  )
} 