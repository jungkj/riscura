'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { rcsaApiClient, rcsaHelpers } from '@/lib/api/rcsa-client';
import {
  Risk,
  Control,
  ControlRiskMapping,
  AssessmentEvidence,
  AssessmentWorkflow,
  NavigationContext,
  CreateRiskRequest,
  UpdateRiskRequest,
  CreateControlRequest,
  UpdateControlRequest,
  EffectivenessUpdate,
  RCSAAnalytics,
  TestScript,
  CreateTestScriptRequest,
  UpdateTestScriptRequest,
} from '@/types/rcsa.types';

// ============================================================================
// CONTEXT STATE & ACTIONS
// ============================================================================

interface RCSAContextState {
  // Current selections
  currentRisk: Risk | null
  currentControl: Control | null;
  currentWorkflow: AssessmentWorkflow | null;
  currentTestScript: TestScript | null;

  // Data collections
  risks: Risk[]
  controls: Control[];
  controlRiskMappings: ControlRiskMapping[];
  evidence: AssessmentEvidence[];
  testScripts: TestScript[];

  // UI state
  loading: boolean
  error: string | null;

  // Navigation context
  navigationContext: NavigationContext

  // Analytics cache
  analytics: RCSAAnalytics | null
}

interface RCSAContextActions {
  // Navigation with context
  navigateToRisk: (riskId: string, fromContext?: NavigationContext) => Promise<void>
  navigateToControl: (controlId: string, fromContext?: NavigationContext) => Promise<void>;
  navigateToAssessment: (assessmentId: string, fromContext?: NavigationContext) => Promise<void>;

  // CRUD operations
  createRisk: (_risk: CreateRiskRequest) => Promise<Risk>
  updateRisk: (id: string, updates: UpdateRiskRequest) => Promise<Risk>;
  deleteRisk: (id: string) => Promise<void>;

  createControl: (control: CreateControlRequest) => Promise<Control>;
  updateControl: (id: string, updates: UpdateControlRequest) => Promise<Control>;
  deleteControl: (id: string) => Promise<void>;

  // Relationship management
  mapControlToRisk: (riskId: string, controlId: string, effectiveness?: number) => Promise<void>
  unmapControlFromRisk: (riskId: string, controlId: string) => Promise<void>;
  updateControlEffectiveness: (
    riskId: string,
    controlId: string,
    effectiveness: number
  ) => Promise<void>;

  // Bulk operations
  bulkMapControls: (riskId: string, controlIds: string[]) => Promise<void>
  bulkUpdateEffectiveness: (updates: EffectivenessUpdate[]) => Promise<void>;

  // Context utilities
  getRelatedControls: (riskId: string) => Control[]
  getRelatedRisks: (controlId: string) => Risk[];
  clearNavigationContext: () => void;

  // Test Script operations
  createTestScript: (testScript: CreateTestScriptRequest) => Promise<TestScript>
  updateTestScript: (id: string, updates: UpdateTestScriptRequest) => Promise<TestScript>;
  deleteTestScript: (id: string) => Promise<void>;
  navigateToTestScript: (testScriptId: string, fromContext?: NavigationContext) => Promise<void>;

  // Data refresh
  refreshRisks: () => Promise<void>
  refreshControls: () => Promise<void>;
  refreshMappings: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshTestScripts: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Error handling
  clearError: () => void
}

type RCSAContextType = RCSAContextState & RCSAContextActions;

// ============================================================================
// ACTION TYPES & REDUCER
// ============================================================================

type RCSAAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CURRENT_RISK'; payload: Risk | null }
  | { type: 'SET_CURRENT_CONTROL'; payload: Control | null }
  | { type: 'SET_CURRENT_WORKFLOW'; payload: AssessmentWorkflow | null }
  | { type: 'SET_CURRENT_TEST_SCRIPT'; payload: TestScript | null }
  | { type: 'SET_RISKS'; payload: Risk[] }
  | { type: 'SET_CONTROLS'; payload: Control[] }
  | { type: 'SET_TEST_SCRIPTS'; payload: TestScript[] }
  | { type: 'SET_CONTROL_RISK_MAPPINGS'; payload: ControlRiskMapping[] }
  | { type: 'SET_EVIDENCE'; payload: AssessmentEvidence[] }
  | { type: 'SET_ANALYTICS'; payload: RCSAAnalytics }
  | { type: 'ADD_RISK'; payload: Risk }
  | { type: 'UPDATE_RISK'; payload: Risk }
  | { type: 'REMOVE_RISK'; payload: string }
  | { type: 'ADD_CONTROL'; payload: Control }
  | { type: 'UPDATE_CONTROL'; payload: Control }
  | { type: 'REMOVE_CONTROL'; payload: string }
  | { type: 'ADD_CONTROL_RISK_MAPPING'; payload: ControlRiskMapping }
  | { type: 'UPDATE_CONTROL_RISK_MAPPING'; payload: ControlRiskMapping }
  | { type: 'REMOVE_CONTROL_RISK_MAPPING'; payload: { riskId: string; controlId: string } }
  | { type: 'SET_NAVIGATION_CONTEXT'; payload: NavigationContext }

const initialState: RCSAContextState = {
  currentRisk: null,
  currentControl: null,
  currentWorkflow: null,
  risks: [],
  controls: [],
  controlRiskMappings: [],
  evidence: [],
  loading: false,
  error: null,
  navigationContext: { maintainContext: false },
  analytics: null,
}

const rcsaReducer = (state: RCSAContextState, action: RCSAAction): RCSAContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'SET_CURRENT_RISK':
      return { ...state, currentRisk: action.payload }

    case 'SET_CURRENT_CONTROL':
      return { ...state, currentControl: action.payload }

    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload }

    case 'SET_RISKS':
      return { ...state, risks: action.payload }

    case 'SET_CONTROLS':
      return { ...state, controls: action.payload }

    case 'SET_CONTROL_RISK_MAPPINGS':
      return { ...state, controlRiskMappings: action.payload }

    case 'SET_EVIDENCE':
      return { ...state, evidence: action.payload }

    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload }

    case 'ADD_RISK':
      return { ...state, risks: [action.payload, ...state.risks] }

    case 'UPDATE_RISK':
      return {
        ...state,
        risks: state.risks.map((risk) => (risk.id === action.payload.id ? action.payload : risk)),
        currentRisk:
          state.currentRisk?.id === action.payload.id ? action.payload : state.currentRisk,
      }

    case 'REMOVE_RISK':
      return {
        ...state,
        risks: state.risks.filter((risk) => risk.id !== action.payload),
        currentRisk: state.currentRisk?.id === action.payload ? null : state.currentRisk,
      }

    case 'ADD_CONTROL':
      return { ...state, controls: [action.payload, ...state.controls] }

    case 'UPDATE_CONTROL':
      return {
        ...state,
        controls: state.controls.map((control) =>
          control.id === action.payload.id ? action.payload : control
        ),
        currentControl:
          state.currentControl?.id === action.payload.id ? action.payload : state.currentControl,
      }

    case 'REMOVE_CONTROL':
      return {
        ...state,
        controls: state.controls.filter((control) => control.id !== action.payload),
        currentControl: state.currentControl?.id === action.payload ? null : state.currentControl,
      }

    case 'ADD_CONTROL_RISK_MAPPING':
      return {
        ...state,
        controlRiskMappings: [...state.controlRiskMappings, action.payload],
      }

    case 'UPDATE_CONTROL_RISK_MAPPING':
      return {
        ...state,
        controlRiskMappings: state.controlRiskMappings.map((mapping) =>
          mapping.riskId === action.payload.riskId && mapping.controlId === action.payload.controlId
            ? action.payload
            : mapping
        ),
      }

    case 'REMOVE_CONTROL_RISK_MAPPING':
      return {
        ...state,
        controlRiskMappings: state.controlRiskMappings.filter(
          (mapping) =>
            !(
              mapping.riskId === action.payload.riskId &&
              mapping.controlId === action.payload.controlId
            )
        ),
      }

    case 'SET_NAVIGATION_CONTEXT':
      return { ...state, navigationContext: action.payload }

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const RCSAContext = createContext<RCSAContextType | undefined>(undefined)

export function useRCSA(): RCSAContextType {
  const context = useContext(RCSAContext);
  if (!context) {
    throw new Error('useRCSA must be used within an RCSAProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const RCSAProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(rcsaReducer, initialState)

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const handleApiError = useCallback((__error: any, context: string) => {
    // console.error(`RCSA API Error [${context}]:`, error)
    const message = error?.message || error?.error?.message || `Failed to ${context}`;
    dispatch({ type: 'SET_ERROR', payload: message });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // ============================================================================
  // NAVIGATION ACTIONS
  // ============================================================================

  const navigateToRisk = useCallback(
    async (riskId: string, fromContext?: NavigationContext) => {
      setLoading(true)
      try {
        const response = await rcsaApiClient.getRisk(riskId);
        if (response.success && response.data) {
          dispatch({ type: 'SET_CURRENT_RISK', payload: response.data });

          if (fromContext) {
            dispatch({ type: 'SET_NAVIGATION_CONTEXT', payload: fromContext });
          }

          // Load related controls
          const mappingsResponse = await rcsaApiClient.getControlRiskMappings(riskId)
          if (mappingsResponse.success && mappingsResponse.data) {
            dispatch({ type: 'SET_CONTROL_RISK_MAPPINGS', payload: mappingsResponse.data });
          }
        } else {
          handleApiError(response.error, 'load risk');
        }
      } catch (error) {
        handleApiError(error, 'navigate to risk');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const navigateToControl = useCallback(
    async (controlId: string, fromContext?: NavigationContext) => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.getControl(controlId);
        if (response.success && response.data) {
          dispatch({ type: 'SET_CURRENT_CONTROL', payload: response.data });

          if (fromContext) {
            dispatch({ type: 'SET_NAVIGATION_CONTEXT', payload: fromContext });
          }

          // Load related risks
          const mappingsResponse = await rcsaApiClient.getControlRiskMappings(undefined, controlId)
          if (mappingsResponse.success && mappingsResponse.data) {
            dispatch({ type: 'SET_CONTROL_RISK_MAPPINGS', payload: mappingsResponse.data });
          }
        } else {
          handleApiError(response.error, 'load control');
        }
      } catch (error) {
        handleApiError(error, 'navigate to control');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const navigateToAssessment = useCallback(
    async (assessmentId: string, fromContext?: NavigationContext) => {
      // Implementation for assessment navigation
      if (fromContext) {
        dispatch({ type: 'SET_NAVIGATION_CONTEXT', payload: fromContext })
      }
      // TODO: Implement assessment loading when assessment API is available
    },
    []
  )

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const createRisk = useCallback(
    async (riskData: CreateRiskRequest): Promise<Risk> => {
      setLoading(true)
      try {
        const response = await rcsaApiClient.createRisk(riskData);
        if (response.success && response.data) {
          dispatch({ type: 'ADD_RISK', payload: response.data });
          return response.data;
        } else {
          handleApiError(response.error, 'create risk');
          throw new Error(response.error?.message || 'Failed to create risk');
        }
      } catch (error) {
        handleApiError(error, 'create risk');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const updateRisk = useCallback(
    async (id: string, updates: UpdateRiskRequest): Promise<Risk> => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.updateRisk(id, updates);
        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_RISK', payload: response.data });
          return response.data;
        } else {
          handleApiError(response.error, 'update risk');
          throw new Error(response.error?.message || 'Failed to update risk');
        }
      } catch (error) {
        handleApiError(error, 'update risk');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const deleteRisk = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.deleteRisk(id);
        if (response.success) {
          dispatch({ type: 'REMOVE_RISK', payload: id });
        } else {
          handleApiError(response.error, 'delete risk');
        }
      } catch (error) {
        handleApiError(error, 'delete risk');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const createControl = useCallback(
    async (controlData: CreateControlRequest): Promise<Control> => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.createControl(controlData);
        if (response.success && response.data) {
          dispatch({ type: 'ADD_CONTROL', payload: response.data });
          return response.data;
        } else {
          handleApiError(response.error, 'create control');
          throw new Error(response.error?.message || 'Failed to create control');
        }
      } catch (error) {
        handleApiError(error, 'create control');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const updateControl = useCallback(
    async (id: string, updates: UpdateControlRequest): Promise<Control> => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.updateControl(id, updates);
        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_CONTROL', payload: response.data });
          return response.data;
        } else {
          handleApiError(response.error, 'update control');
          throw new Error(response.error?.message || 'Failed to update control');
        }
      } catch (error) {
        handleApiError(error, 'update control');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const deleteControl = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.deleteControl(id);
        if (response.success) {
          dispatch({ type: 'REMOVE_CONTROL', payload: id });
        } else {
          handleApiError(response.error, 'delete control');
        }
      } catch (error) {
        handleApiError(error, 'delete control');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  // ============================================================================
  // RELATIONSHIP MANAGEMENT
  // ============================================================================

  const mapControlToRisk = useCallback(
    async (riskId: string, controlId: string, effectiveness = 0.5) => {
      setLoading(true)
      try {
        const response = await rcsaApiClient.mapControlToRisk({ riskId, controlId, effectiveness });
        if (response.success && response.data) {
          dispatch({ type: 'ADD_CONTROL_RISK_MAPPING', payload: response.data });
        } else {
          handleApiError(response.error, 'map control to risk');
        }
      } catch (error) {
        handleApiError(error, 'map control to risk');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const unmapControlFromRisk = useCallback(
    async (riskId: string, controlId: string) => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.unmapControlFromRisk(riskId, controlId);
        if (response.success) {
          dispatch({ type: 'REMOVE_CONTROL_RISK_MAPPING', payload: { riskId, controlId } });
        } else {
          handleApiError(response.error, 'unmap control from risk');
        }
      } catch (error) {
        handleApiError(error, 'unmap control from risk');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const updateControlEffectiveness = useCallback(
    async (riskId: string, controlId: string, effectiveness: number) => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.updateControlEffectiveness(
          riskId,
          controlId,
          effectiveness
        );
        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_CONTROL_RISK_MAPPING', payload: response.data });
        } else {
          handleApiError(response.error, 'update control effectiveness');
        }
      } catch (error) {
        handleApiError(error, 'update control effectiveness');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const bulkMapControls = useCallback(
    async (riskId: string, controlIds: string[]) => {
      setLoading(true)
      try {
        const response = await rcsaApiClient.bulkMapControls(riskId, controlIds);
        if (response.success && response.data) {
          response.data.forEach((mapping) => {
            dispatch({ type: 'ADD_CONTROL_RISK_MAPPING', payload: mapping });
          });
        } else {
          handleApiError(response.error, 'bulk map controls');
        }
      } catch (error) {
        handleApiError(error, 'bulk map controls');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  const bulkUpdateEffectiveness = useCallback(
    async (updates: EffectivenessUpdate[]) => {
      setLoading(true);
      try {
        const response = await rcsaApiClient.bulkUpdateEffectiveness(updates);
        if (response.success && response.data) {
          response.data.forEach((mapping) => {
            dispatch({ type: 'UPDATE_CONTROL_RISK_MAPPING', payload: mapping });
          });
        } else {
          handleApiError(response.error, 'bulk update effectiveness');
        }
      } catch (error) {
        handleApiError(error, 'bulk update effectiveness');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, setLoading]
  );

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getRelatedControls = useCallback(
    (riskId: string): Control[] => {
      const mappings = state.controlRiskMappings.filter((m) => m.riskId === riskId)
      return state.controls.filter((control) => mappings.some((m) => m.controlId === control.id));
    },
    [state.controlRiskMappings, state.controls]
  );

  const getRelatedRisks = useCallback(
    (controlId: string): Risk[] => {
      const mappings = state.controlRiskMappings.filter((m) => m.controlId === controlId);
      return state.risks.filter((risk) => mappings.some((m) => m.riskId === risk.id));
    },
    [state.controlRiskMappings, state.risks]
  );

  const clearNavigationContext = useCallback(() => {
    dispatch({ type: 'SET_NAVIGATION_CONTEXT', payload: { maintainContext: false } });
  }, []);

  // ============================================================================
  // DATA REFRESH FUNCTIONS
  // ============================================================================

  const refreshRisks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await rcsaApiClient.getRisks();
      if (response.success && response.data) {
        dispatch({ type: 'SET_RISKS', payload: response.data.data });
      } else {
        handleApiError(response.error, 'refresh risks');
      }
    } catch (error) {
      handleApiError(error, 'refresh risks');
    } finally {
      setLoading(false);
    }
  }, [handleApiError, setLoading]);

  const refreshControls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await rcsaApiClient.getControls();
      if (response.success && response.data) {
        dispatch({ type: 'SET_CONTROLS', payload: response.data.data });
      } else {
        handleApiError(response.error, 'refresh controls');
      }
    } catch (error) {
      handleApiError(error, 'refresh controls');
    } finally {
      setLoading(false);
    }
  }, [handleApiError, setLoading]);

  const refreshMappings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await rcsaApiClient.getControlRiskMappings();
      if (response.success && response.data) {
        dispatch({ type: 'SET_CONTROL_RISK_MAPPINGS', payload: response.data });
      } else {
        handleApiError(response.error, 'refresh mappings');
      }
    } catch (error) {
      handleApiError(error, 'refresh mappings');
    } finally {
      setLoading(false);
    }
  }, [handleApiError, setLoading]);

  const refreshAnalytics = useCallback(async () => {
    try {
      const response = await rcsaApiClient.getRCSAAnalytics();
      if (response.success && response.data) {
        dispatch({ type: 'SET_ANALYTICS', payload: response.data });
      } else {
        handleApiError(response.error, 'refresh analytics');
      }
    } catch (error) {
      handleApiError(error, 'refresh analytics');
    }
  }, [handleApiError]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ============================================================================
  // INITIAL DATA LOAD
  // ============================================================================

  useEffect(() => {
    const loadInitialData = async () => {
      // Check if user is authenticated before loading data
      const _token = localStorage.getItem('auth-token')
      const sessionToken = sessionStorage.getItem('auth-token');

      if (!token && !sessionToken) {
        // console.log('Skipping RCSA data load - user not authenticated')
        return;
      }

      try {
        // Load data individually with error isolation to prevent infinite loops
        const results = await Promise.allSettled([
          refreshRisks(),
          refreshControls(),
          refreshMappings(),
          refreshAnalytics(),
        ])

        // Log any failures but don't crash the app
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const operation = ['risks', 'controls', 'mappings', 'analytics'][index]
            // console.warn(`Failed to load ${operation}:`, result.reason)
          }
        });
      } catch (error) {
        // console.warn('Initial data load failed:', error)
      }
    }

    loadInitialData();
  }, []); // Empty dependency array for initial load only

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: RCSAContextType = {
    // State
    ...state,

    // Navigation
    navigateToRisk,
    navigateToControl,
    navigateToAssessment,

    // CRUD operations
    createRisk,
    updateRisk,
    deleteRisk,
    createControl,
    updateControl,
    deleteControl,

    // Relationship management
    mapControlToRisk,
    unmapControlFromRisk,
    updateControlEffectiveness,

    // Bulk operations
    bulkMapControls,
    bulkUpdateEffectiveness,

    // Utilities
    getRelatedControls,
    getRelatedRisks,
    clearNavigationContext,

    // Data refresh
    refreshRisks,
    refreshControls,
    refreshMappings,
    refreshAnalytics,

    // Error handling
    clearError,
  }

  return <RCSAContext.Provider value={contextValue}>{children}</RCSAContext.Provider>;
}

export default RCSAProvider;
