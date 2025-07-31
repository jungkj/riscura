'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Control, ControlState, ControlFilters, ControlRiskMapping, Document } from '@/types';
import { generateMockControls } from '@/lib/mockData';

interface ControlContextType extends ControlState {
  // CRUD Operations
  createControl: (controlData: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Control>;
  updateControl: (id: string, controlData: Partial<Control>) => Promise<Control>;
  deleteControl: (id: string) => Promise<void>;
  deleteControls: (ids: string[]) => Promise<void>;
  getControl: (id: string) => Control | null;

  // Control-Risk Mapping
  mapControlToRisk: (
    controlId: string,
    riskId: string,
    mapping: Omit<ControlRiskMapping, 'controlId' | 'riskId'>
  ) => Promise<void>;
  unmapControlFromRisk: (controlId: string, riskId: string) => Promise<void>;
  getControlRiskMappings: (controlId?: string, riskId?: string) => ControlRiskMapping[];
  updateControlEffectiveness: (
    controlId: string,
    riskId: string,
    effectiveness: number
  ) => Promise<void>;

  // Testing and Evidence
  addControlEvidence: (controlId: string, evidence: Document) => Promise<void>;
  removeControlEvidence: (controlId: string, evidenceId: string) => Promise<void>;
  scheduleControlTest: (controlId: string, testDate: Date) => Promise<void>;
  completeControlTest: (
    controlId: string,
    results: { effectiveness: number; evidence?: Document[] }
  ) => Promise<void>;

  // Filtering and Search
  setFilters: (filters: Partial<ControlFilters>) => void;
  clearFilters: () => void;
  setSearch: (search: string) => void;

  // Selection and Bulk Operations
  selectedControls: string[];
  setSelectedControls: (ids: string[]) => void;
  selectAllControls: () => void;
  clearSelection: () => void;

  // Sorting and Pagination
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  setSorting: (field: string, direction: 'asc' | 'desc') => void;

  // Analytics and Reporting
  getControlStats: () => {
    total: number;
    byType: Record<Control['type'], number>;
    byEffectiveness: Record<Control['effectiveness'], number>;
    byStatus: Record<Control['status'], number>;
    averageEffectiveness: number;
    overdueTests: number;
    coverageGaps: number;
  };
  getControlCoverage: () => { riskId: string; controlCount: number; effectivenessScore: number }[];
  getEffectivenessTrends: () => { date: string; effectiveness: number }[];

  // Templates and Standards
  getControlTemplates: () => Control[];
  createFromTemplate: (templateId: string, customizations?: Partial<Control>) => Promise<Control>;

  // Utility functions
  getFilteredControls: () => Control[];

  // Error handling
  clearError: () => void;
}

// Control Actions
type ControlAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONTROLS'; payload: Control[] }
  | { type: 'ADD_CONTROL'; payload: Control }
  | { type: 'UPDATE_CONTROL'; payload: Control }
  | { type: 'DELETE_CONTROL'; payload: string }
  | { type: 'DELETE_CONTROLS'; payload: string[] }
  | { type: 'SET_SELECTED_CONTROL'; payload: Control | null }
  | { type: 'SET_FILTERS'; payload: Partial<ControlFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SELECTED_CONTROLS'; payload: string[] }
  | { type: 'SET_SORTING'; payload: { field: string; direction: 'asc' | 'desc' } }
  | { type: 'SET_CONTROL_RISK_MAPPINGS'; payload: ControlRiskMapping[] }
  | { type: 'ADD_CONTROL_RISK_MAPPING'; payload: ControlRiskMapping }
  | { type: 'REMOVE_CONTROL_RISK_MAPPING'; payload: { controlId: string; riskId: string } }
  | { type: 'UPDATE_CONTROL_RISK_MAPPING'; payload: ControlRiskMapping };

// Initial state
const initialState: ControlState & {
  selectedControls: string[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  controlRiskMappings: ControlRiskMapping[];
} = {
  controls: [],
  selectedControl: null,
  filters: {},
  loading: false,
  error: null,
  selectedControls: [],
  sortBy: 'createdAt',
  sortDirection: 'desc',
  controlRiskMappings: [],
};

// Control reducer
const controlReducer = (state: typeof initialState, action: ControlAction): typeof initialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_CONTROLS':
      return { ...state, controls: action.payload, loading: false };

    case 'ADD_CONTROL':
      return {
        ...state,
        controls: [action.payload, ...state.controls],
        loading: false,
      };

    case 'UPDATE_CONTROL':
      return {
        ...state,
        controls: state.controls.map((control) =>
          control.id === action.payload.id ? action.payload : control
        ),
        selectedControl:
          state.selectedControl?.id === action.payload.id ? action.payload : state.selectedControl,
        loading: false,
      };

    case 'DELETE_CONTROL':
      return {
        ...state,
        controls: state.controls.filter((control) => control.id !== action.payload),
        selectedControl:
          state.selectedControl?.id === action.payload ? null : state.selectedControl,
        selectedControls: state.selectedControls.filter((id) => id !== action.payload),
        loading: false,
      };

    case 'DELETE_CONTROLS':
      return {
        ...state,
        controls: state.controls.filter((control) => !action.payload.includes(control.id)),
        selectedControl: action.payload.includes(state.selectedControl?.id || '')
          ? null
          : state.selectedControl,
        selectedControls: [],
        loading: false,
      };

    case 'SET_SELECTED_CONTROL':
      return { ...state, selectedControl: action.payload };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };

    case 'SET_SELECTED_CONTROLS':
      return { ...state, selectedControls: action.payload };

    case 'SET_SORTING':
      return {
        ...state,
        sortBy: action.payload.field,
        sortDirection: action.payload.direction,
      };

    case 'SET_CONTROL_RISK_MAPPINGS':
      return { ...state, controlRiskMappings: action.payload };

    case 'ADD_CONTROL_RISK_MAPPING':
      return {
        ...state,
        controlRiskMappings: [...state.controlRiskMappings, action.payload],
      };

    case 'REMOVE_CONTROL_RISK_MAPPING':
      return {
        ...state,
        controlRiskMappings: state.controlRiskMappings.filter(
          (mapping) =>
            !(
              mapping.controlId === action.payload.controlId &&
              mapping.riskId === action.payload.riskId
            )
        ),
      };

    case 'UPDATE_CONTROL_RISK_MAPPING':
      return {
        ...state,
        controlRiskMappings: state.controlRiskMappings.map((mapping) =>
          mapping.controlId === action.payload.controlId && mapping.riskId === action.payload.riskId
            ? action.payload
            : mapping
        ),
      };

    default:
      return state;
  }
};

const ControlContext = createContext<ControlContextType>({} as ControlContextType);

export const useControls = () => {
  const context = useContext(ControlContext);
  if (!context) {
    throw new Error('useControls must be used within ControlProvider');
  }
  return context;
};

// Mock API service
const controlService = {
  async getAllControls(): Promise<Control[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateMockControls();
  },

  async createControl(
    controlData: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Control> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newControl: Control = {
      ...controlData,
      id: `control-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newControl;
  },

  async updateControl(id: string, controlData: Partial<Control>): Promise<Control> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updatedControl: Control = {
      ...(controlData as Control),
      id,
      updatedAt: new Date().toISOString(),
    };

    return updatedControl;
  },

  async deleteControl(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  async deleteControls(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
};

export const ControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(controlReducer, initialState);

  // Load initial controls
  useEffect(() => {
    const loadControls = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const controls = await controlService.getAllControls();
        dispatch({ type: 'SET_CONTROLS', payload: controls });

        // Generate mock control-risk mappings
        const mockMappings: ControlRiskMapping[] = controls.slice(0, 5).map((control, index) => ({
          controlId: control.id,
          riskId: `risk-${index + 1}`,
          effectivenessRating: 3 + Math.floor(Math.random() * 3), // 3-5 rating
          lastTested: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          nextTestDue: new Date(
            Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000
          ).toISOString(),
          evidence: [],
          mitigationImpact: 0.2 + Math.random() * 0.6, // 20-80% impact
        }));

        dispatch({ type: 'SET_CONTROL_RISK_MAPPINGS', payload: mockMappings });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load controls' });
      }
    };

    loadControls();
  }, []);

  // CRUD Operations
  const createControl = async (controlData: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newControl = await controlService.createControl(controlData);
      dispatch({ type: 'ADD_CONTROL', payload: newControl });
      return newControl;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create control' });
      throw error;
    }
  };

  const updateControl = async (id: string, controlData: Partial<Control>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedControl = await controlService.updateControl(id, controlData);
      dispatch({ type: 'UPDATE_CONTROL', payload: updatedControl });
      return updatedControl;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update control' });
      throw error;
    }
  };

  const deleteControl = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await controlService.deleteControl();
      dispatch({ type: 'DELETE_CONTROL', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete control' });
      throw error;
    }
  };

  const deleteControls = async (ids: string[]) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await controlService.deleteControls();
      dispatch({ type: 'DELETE_CONTROLS', payload: ids });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete controls' });
      throw error;
    }
  };

  const getControl = (id: string) => {
    return state.controls.find((control) => control.id === id) || null;
  };

  // Control-Risk Mapping (simplified implementations)
  const mapControlToRisk = async (
    controlId: string,
    riskId: string,
    mapping: Omit<ControlRiskMapping, 'controlId' | 'riskId'>
  ) => {
    const newMapping: ControlRiskMapping = { controlId, riskId, ...mapping };
    dispatch({ type: 'ADD_CONTROL_RISK_MAPPING', payload: newMapping });
  };

  const unmapControlFromRisk = async (controlId: string, riskId: string) => {
    dispatch({ type: 'REMOVE_CONTROL_RISK_MAPPING', payload: { controlId, riskId } });
  };

  const getControlRiskMappings = (controlId?: string, riskId?: string) => {
    let mappings = state.controlRiskMappings;
    if (controlId) mappings = mappings.filter((m) => m.controlId === controlId);
    if (riskId) mappings = mappings.filter((m) => m.riskId === riskId);
    return mappings;
  };

  const updateControlEffectiveness = async (
    controlId: string,
    riskId: string,
    effectiveness: number
  ) => {
    const mapping = state.controlRiskMappings.find(
      (m) => m.controlId === controlId && m.riskId === riskId
    );
    if (mapping) {
      const updated = {
        ...mapping,
        effectivenessRating: effectiveness,
        lastTested: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_CONTROL_RISK_MAPPING', payload: updated });
    }
  };

  // Testing and Evidence (simplified implementations)
  const addControlEvidence = async (controlId: string, evidence: Document) => {
    const control = getControl(controlId);
    if (control) {
      const updated = { ...control, evidence: [...control.evidence, evidence] };
      dispatch({ type: 'UPDATE_CONTROL', payload: updated });
    }
  };

  const removeControlEvidence = async (controlId: string, evidenceId: string) => {
    const control = getControl(controlId);
    if (control) {
      const updated = { ...control, evidence: control.evidence.filter((e) => e.id !== evidenceId) };
      dispatch({ type: 'UPDATE_CONTROL', payload: updated });
    }
  };

  const scheduleControlTest = async (controlId: string, testDate: Date) => {
    const control = getControl(controlId);
    if (control) {
      const updated = { ...control, nextTestDate: testDate.toISOString() };
      dispatch({ type: 'UPDATE_CONTROL', payload: updated });
    }
  };

  const completeControlTest = async (
    controlId: string,
    results: { effectiveness: number; evidence?: Document[] }
  ) => {
    const control = getControl(controlId);
    if (control) {
      const updated = {
        ...control,
        effectiveness:
          results.effectiveness > 0.8
            ? ('high' as const)
            : results.effectiveness > 0.6
              ? ('medium' as const)
              : ('low' as const),
        lastTestDate: new Date().toISOString(),
        evidence: results.evidence ? [...control.evidence, ...results.evidence] : control.evidence,
      };
      dispatch({ type: 'UPDATE_CONTROL', payload: updated });
    }
  };

  // Filtering and Search
  const setFilters = (filters: Partial<ControlFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const setSearch = (search: string) => {
    dispatch({ type: 'SET_FILTERS', payload: { search } });
  };

  // Selection
  const setSelectedControls = (ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_CONTROLS', payload: ids });
  };

  const selectAllControls = () => {
    const filteredControls = getFilteredControls();
    dispatch({ type: 'SET_SELECTED_CONTROLS', payload: filteredControls.map((c) => c.id) });
  };

  const clearSelection = () => {
    dispatch({ type: 'SET_SELECTED_CONTROLS', payload: [] });
  };

  // Sorting
  const setSorting = (field: string, direction: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORTING', payload: { field, direction } });
  };

  // Utility functions
  const getFilteredControls = (): Control[] => {
    let filtered = [...state.controls];

    if (state.filters.type) {
      filtered = filtered.filter((control) => control.type === state.filters.type);
    }

    if (state.filters.effectiveness) {
      filtered = filtered.filter(
        (control) => control.effectiveness === state.filters.effectiveness
      );
    }

    if (state.filters.status) {
      filtered = filtered.filter((control) => control.status === state.filters.status);
    }

    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (control) =>
          control.title.toLowerCase().includes(searchTerm) ||
          control.description.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  const getControlStats = () => {
    const controls = state.controls;
    const total = controls.length;

    const byType = controls.reduce(
      (acc, control) => {
        acc[control.type] = (acc[control.type] || 0) + 1;
        return acc;
      },
      {} as Record<Control['type'], number>
    );

    const byEffectiveness = controls.reduce(
      (acc, control) => {
        acc[control.effectiveness] = (acc[control.effectiveness] || 0) + 1;
        return acc;
      },
      {} as Record<Control['effectiveness'], number>
    );

    const byStatus = controls.reduce(
      (acc, control) => {
        acc[control.status] = (acc[control.status] || 0) + 1;
        return acc;
      },
      {} as Record<Control['status'], number>
    );

    const averageEffectiveness = 3.5; // Mock value
    const overdueTests = 2; // Mock value
    const coverageGaps = 1; // Mock value

    return {
      total,
      byType,
      byEffectiveness,
      byStatus,
      averageEffectiveness,
      overdueTests,
      coverageGaps,
    };
  };

  const getControlCoverage = () => {
    return state.controlRiskMappings.map((mapping) => ({
      riskId: mapping.riskId,
      controlCount: 1,
      effectivenessScore: mapping.effectivenessRating,
    }));
  };

  const getEffectivenessTrends = () => {
    const trends: Array<{ date: string; effectiveness: number }> = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        effectiveness: 3 + Math.random() * 2,
      });
    }
    return trends;
  };

  const getControlTemplates = (): Control[] => {
    // Mock implementation - return empty array for now
    // In a real implementation, this would fetch from API
    return [];
  };

  const createFromTemplate = async (
    templateId: string,
    customizations?: Partial<Control>
  ): Promise<Control> => {
    const templates = getControlTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Create control from template with customizations
    const controlData = {
      ...template,
      ...customizations,
      // Remove id, createdAt, updatedAt as they'll be generated
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Remove undefined properties
    const cleanedData = Object.fromEntries(
      Object.entries(controlData).filter(([, value]) => value !== undefined)
    ) as Omit<Control, 'id' | 'createdAt' | 'updatedAt'>;

    return createControl(cleanedData);
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <ControlContext.Provider
      value={{
        ...state,
        createControl,
        updateControl,
        deleteControl,
        deleteControls,
        getControl,
        mapControlToRisk,
        unmapControlFromRisk,
        getControlRiskMappings,
        updateControlEffectiveness,
        addControlEvidence,
        removeControlEvidence,
        scheduleControlTest,
        completeControlTest,
        setFilters,
        clearFilters,
        setSearch,
        setSelectedControls,
        selectAllControls,
        clearSelection,
        setSorting,
        getFilteredControls,
        getControlStats,
        getControlCoverage,
        getEffectivenessTrends,
        getControlTemplates,
        createFromTemplate,
        clearError,
      }}
    >
      {children}
    </ControlContext.Provider>
  );
};
