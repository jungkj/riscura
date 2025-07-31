import { useState, useEffect, useCallback, useRef } from 'react'
import { RealTimeDataService, RealTimeCallbacks, RealTimeSubscription } from '@/services/RealTimeDataService'
import { Database } from '@/lib/supabase/types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Tables = Database['public']['Tables']
type Risk = Tables['risks']['Row']
type Control = Tables['controls']['Row']
type Document = Tables['documents']['Row']
type Activity = Tables['activities']['Row']
type User = Tables['users']['Row']

export interface UseRealTimeDataOptions {
  organizationId: string
  autoSubscribe?: boolean
  enableLogs?: boolean
}

export interface RealTimeDataState {
  risks: Risk[]
  controls: Control[]
  documents: Document[]
  activities: Activity[]
  users: User[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export interface RealTimeDataActions {
  // Data operations
  refreshData: () => Promise<void>
  createRisk: (risk: Tables['risks']['Insert']) => Promise<Risk>
  updateRisk: (id: string, updates: Tables['risks']['Update']) => Promise<Risk>
  deleteRisk: (id: string) => Promise<void>
  createControl: (control: Tables['controls']['Insert']) => Promise<Control>
  updateControl: (id: string, updates: Tables['controls']['Update']) => Promise<Control>
  
  // Subscription management
  subscribe: () => void
  unsubscribe: () => void
  
  // Metrics
  getRiskMetrics: () => Promise<any>
  getControlMetrics: () => Promise<any>
}

export function useRealTimeData(options: UseRealTimeDataOptions) {
  const { organizationId, autoSubscribe = true, enableLogs = false } = options
  
  // State
  const [state, setState] = useState<RealTimeDataState>({
    risks: [],
    controls: [],
    documents: [],
    activities: [],
    users: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  })
  
  // Refs
  const serviceRef = useRef<RealTimeDataService>()
  const subscriptionRef = useRef<RealTimeSubscription>()
  const isSubscribedRef = useRef(false)
  
  // Initialize service
  useEffect(() => {
    serviceRef.current = new RealTimeDataService(organizationId)
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [organizationId])
  
  // Update state helper
  const updateState = useCallback((updates: Partial<RealTimeDataState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date()
    }))
  }, [])
  
  // Error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Real-time data error (${context}):`, error)
    updateState({ 
      error: error.message || 'An error occurred',
      isLoading: false 
    })
  }, [updateState])
  
  // Log helper
  const log = useCallback((message: string, data?: any) => {
    if (enableLogs) {
      console.log(`[useRealTimeData] ${message}`, data)
    }
  }, [enableLogs])
  
  // Real-time callbacks
  const callbacks: RealTimeCallbacks = {
    onRiskChange: useCallback((payload: RealtimePostgresChangesPayload<Risk>) => {
      log('Risk change detected', payload)
      
      setState(prev => {
        let newRisks = [...prev.risks]
        
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              newRisks = [payload.new as Risk, ...newRisks]
            }
            break
          case 'UPDATE':
            if (payload.new) {
              const index = newRisks.findIndex(r => r.id === payload.new!.id)
              if (index >= 0) {
                newRisks[index] = payload.new as Risk
              }
            }
            break
          case 'DELETE':
            if (payload.old) {
              newRisks = newRisks.filter(r => r.id !== payload.old!.id)
            }
            break
        }
        
        return {
          ...prev,
          risks: newRisks,
          lastUpdated: new Date()
        }
      })
    }, [log]),
    
    onControlChange: useCallback((payload: RealtimePostgresChangesPayload<Control>) => {
      log('Control change detected', payload)
      
      setState(prev => {
        let newControls = [...prev.controls]
        
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              newControls = [payload.new as Control, ...newControls]
            }
            break
          case 'UPDATE':
            if (payload.new) {
              const index = newControls.findIndex(c => c.id === payload.new!.id)
              if (index >= 0) {
                newControls[index] = payload.new as Control
              }
            }
            break
          case 'DELETE':
            if (payload.old) {
              newControls = newControls.filter(c => c.id !== payload.old!.id)
            }
            break
        }
        
        return {
          ...prev,
          controls: newControls,
          lastUpdated: new Date()
        }
      })
    }, [log]),
    
    onDocumentChange: useCallback((payload: RealtimePostgresChangesPayload<Document>) => {
      log('Document change detected', payload)
      
      setState(prev => {
        let newDocuments = [...prev.documents]
        
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              newDocuments = [payload.new as Document, ...newDocuments]
            }
            break
          case 'UPDATE':
            if (payload.new) {
              const index = newDocuments.findIndex(d => d.id === payload.new!.id)
              if (index >= 0) {
                newDocuments[index] = payload.new as Document
              }
            }
            break
          case 'DELETE':
            if (payload.old) {
              newDocuments = newDocuments.filter(d => d.id !== payload.old!.id)
            }
            break
        }
        
        return {
          ...prev,
          documents: newDocuments,
          lastUpdated: new Date()
        }
      })
    }, [log]),
    
    onActivityChange: useCallback((payload: RealtimePostgresChangesPayload<Activity>) => {
      log('Activity change detected', payload)
      
      setState(prev => {
        if (payload.eventType === 'INSERT' && payload.new) {
          return {
            ...prev,
            activities: [payload.new as Activity, ...prev.activities.slice(0, 49)], // Keep last 50
            lastUpdated: new Date()
          }
        }
        return prev
      })
    }, [log]),
    
    onUserChange: useCallback((payload: RealtimePostgresChangesPayload<User>) => {
      log('User change detected', payload)
      
      setState(prev => {
        let newUsers = [...prev.users]
        
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new) {
              newUsers = [...newUsers, payload.new as User]
            }
            break
          case 'UPDATE':
            if (payload.new) {
              const index = newUsers.findIndex(u => u.id === payload.new!.id)
              if (index >= 0) {
                newUsers[index] = payload.new as User
              }
            }
            break
          case 'DELETE':
            if (payload.old) {
              newUsers = newUsers.filter(u => u.id !== payload.old!.id)
            }
            break
        }
        
        return {
          ...prev,
          users: newUsers,
          lastUpdated: new Date()
        }
      })
    }, [log])
  }
  
  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!serviceRef.current) return
    
    try {
      updateState({ isLoading: true, error: null })
      log('Loading initial data...')
      
      const [risks, controls, documents, activities, users] = await Promise.all([
        serviceRef.current.getRisks(organizationId),
        serviceRef.current.getControls(organizationId),
        serviceRef.current.getDocuments(organizationId),
        serviceRef.current.getActivities(organizationId),
        serviceRef.current.getUsers(organizationId)
      ])
      
      updateState({
        risks,
        controls,
        documents,
        activities,
        users,
        isLoading: false,
        error: null
      })
      
      log('Initial data loaded successfully')
    } catch (error) {
      handleError(error, 'loadInitialData')
    }
  }, [organizationId, updateState, handleError, log])
  
  // Subscribe to real-time updates
  const subscribe = useCallback(() => {
    if (!serviceRef.current || isSubscribedRef.current) return
    
    log('Subscribing to real-time updates...')
    
    subscriptionRef.current = serviceRef.current.subscribeToOrganization(
      organizationId,
      callbacks
    )
    
    isSubscribedRef.current = true
    log('Subscribed to real-time updates')
  }, [organizationId, callbacks, log])
  
  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      log('Unsubscribing from real-time updates...')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = undefined
      isSubscribedRef.current = false
      log('Unsubscribed from real-time updates')
    }
  }, [log])
  
  // Actions
  const actions: RealTimeDataActions = {
    refreshData: loadInitialData,
    
    createRisk: useCallback(async (risk: Tables['risks']['Insert']) => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.createRisk(risk)
    }, []),
    
    updateRisk: useCallback(async (id: string, updates: Tables['risks']['Update']) => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.updateRisk(id, updates)
    }, []),
    
    deleteRisk: useCallback(async (id: string) => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.deleteRisk(id)
    }, []),
    
    createControl: useCallback(async (control: Tables['controls']['Insert']) => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.createControl(control)
    }, []),
    
    updateControl: useCallback(async (id: string, updates: Tables['controls']['Update']) => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.updateControl(id, updates)
    }, []),
    
    subscribe,
    unsubscribe,
    
    getRiskMetrics: useCallback(async () => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.getRiskMetrics(organizationId)
    }, [organizationId]),
    
    getControlMetrics: useCallback(async () => {
      if (!serviceRef.current) throw new Error('Service not initialized')
      return serviceRef.current.getControlMetrics(organizationId)
    }, [organizationId])
  }
  
  // Load data and subscribe on mount
  useEffect(() => {
    loadInitialData()
    
    if (autoSubscribe) {
      subscribe()
    };

  return () => {
      unsubscribe()
    }
  }, [loadInitialData, subscribe, unsubscribe, autoSubscribe])
  
  return {
    ...state,
    actions
  }
}

export default useRealTimeData 