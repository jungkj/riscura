"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Risk, RiskState, RiskFilters, RiskCategory } from '@/types';
import { generateMockRisks } from '@/lib/mockData';
import { calculateRiskScore, getRiskLevel } from '@/lib/utils';

interface RiskContextType extends RiskState {
  // CRUD Operations
  createRisk: (riskData: Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>) => Promise<Risk>;
  updateRisk: (id: string, riskData: Partial<Risk>) => Promise<Risk>;
  deleteRisk: (id: string) => Promise<void>;
  deleteRisks: (ids: string[]) => Promise<void>;
  getRisk: (id: string) => Risk | null;
  
  // Filtering and Search
  setFilters: (filters: Partial<RiskFilters>) => void;
  clearFilters: () => void;
  setSearch: (search: string) => void;
  
  // Selection and Bulk Operations
  selectedRisks: string[];
  setSelectedRisks: (ids: string[]) => void;
  selectAllRisks: () => void;
  clearSelection: () => void;
  
  // Sorting and Pagination
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  setSorting: (field: string, direction: 'asc' | 'desc') => void;
  
  // Utility functions
  getFilteredRisks: () => Risk[];
  getRisksByCategory: () => Record<RiskCategory, Risk[]>;
  getRiskStats: () => {
    total: number;
    byStatus: Record<Risk['status'], number>;
    byLevel: Record<string, number>;
    averageScore: number;
  };
  
  // Error handling
  clearError: () => void;
}

// Risk Actions
type RiskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_RISKS'; payload: Risk[] }
  | { type: 'ADD_RISK'; payload: Risk }
  | { type: 'UPDATE_RISK'; payload: Risk }
  | { type: 'DELETE_RISK'; payload: string }
  | { type: 'DELETE_RISKS'; payload: string[] }
  | { type: 'SET_SELECTED_RISK'; payload: Risk | null }
  | { type: 'SET_FILTERS'; payload: Partial<RiskFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SELECTED_RISKS'; payload: string[] }
  | { type: 'SET_SORTING'; payload: { field: string; direction: 'asc' | 'desc' } };

// Initial state
const initialState: RiskState & {
  selectedRisks: string[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
} = {
  risks: [],
  selectedRisk: null,
  filters: {},
  loading: false,
  error: null,
  selectedRisks: [],
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

// Risk reducer
const riskReducer = (state: typeof initialState, action: RiskAction): typeof initialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_RISKS':
      return { ...state, risks: action.payload, loading: false };
    
    case 'ADD_RISK':
      return {
        ...state,
        risks: [action.payload, ...state.risks],
        loading: false,
      };
    
    case 'UPDATE_RISK':
      return {
        ...state,
        risks: state.risks.map(risk =>
          risk.id === action.payload.id ? action.payload : risk
        ),
        selectedRisk: state.selectedRisk?.id === action.payload.id ? action.payload : state.selectedRisk,
        loading: false,
      };
    
    case 'DELETE_RISK':
      return {
        ...state,
        risks: state.risks.filter(risk => risk.id !== action.payload),
        selectedRisk: state.selectedRisk?.id === action.payload ? null : state.selectedRisk,
        selectedRisks: state.selectedRisks.filter(id => id !== action.payload),
        loading: false,
      };
    
    case 'DELETE_RISKS':
      return {
        ...state,
        risks: state.risks.filter(risk => !action.payload.includes(risk.id)),
        selectedRisk: action.payload.includes(state.selectedRisk?.id || '') ? null : state.selectedRisk,
        selectedRisks: [],
        loading: false,
      };
    
    case 'SET_SELECTED_RISK':
      return { ...state, selectedRisk: action.payload };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };
    
    case 'SET_SELECTED_RISKS':
      return { ...state, selectedRisks: action.payload };
    
    case 'SET_SORTING':
      return {
        ...state,
        sortBy: action.payload.field,
        sortDirection: action.payload.direction,
      };
    
    default:
      return state;
  }
};

const RiskContext = createContext<RiskContextType>({} as RiskContextType);

export const useRisks = () => {
  const context = useContext(RiskContext);
  if (!context) {
    throw new Error('useRisks must be used within RiskProvider');
  }
  return context;
};

// Data service
const riskService = {
  async getAllRisks(): Promise<Risk[]> {
    try {
      const res = await fetch('/api/risks?limit=200');
      if (!res.ok) {
        // Fallback to mock data if API is not available
        return generateMockRisks();
      }
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) {
        return generateMockRisks();
      }
      // Normalize backend -> UI Risk type
      const normalized: Risk[] = json.data.map((r: any) => {
        const likelihood = Number(r.likelihood) || 0;
        const impact = Number(r.impact) || 0;
        const riskScore = Number(r.riskScore) || (likelihood * impact);
        const toLevel = (score: number) => score >= 20 ? 'critical' : score >= 12 ? 'high' : score >= 6 ? 'medium' : 'low';
        const mapped: Risk = {
          id: String(r.id),
          title: r.title || 'Untitled Risk',
          description: r.description || '',
          // UI filters expect lowercase categories; convert known enums safely
          category: ((r.category || 'OPERATIONAL').toString().toUpperCase()) as any,
          likelihood,
          impact,
          riskScore,
          riskLevel: (r.riskLevel ? r.riskLevel.toString().toLowerCase() : toLevel(riskScore)) as any,
          owner: r.owner || r.assignedUser?.email || 'Unassigned',
          status: (r.status || 'IDENTIFIED').toString().toLowerCase() as any,
          controls: (Array.isArray(r.controls) ? r.controls.map((m: any) => (m.controlId || m.control?.id)).filter(Boolean) : []) as string[],
          linkedControls: [] as string[] | undefined,
          existingControls: [] as any[] | undefined,
          evidence: [] as any[],
          createdAt: (r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()),
          updatedAt: (r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()),
          lastAssessed: r.lastAssessed ? new Date(r.lastAssessed) : undefined,
          dateIdentified: r.dateIdentified ? new Date(r.dateIdentified) : undefined,
          nextReview: r.nextReview ? new Date(r.nextReview) : undefined,
          aiConfidence: r.aiConfidence ?? undefined,
          comments: [] as any[],
          tasks: [] as string[],
        };
        // Convert Prisma enum names to our RiskCategory union strings
        const category = mapped.category as unknown as string;
        const categoryMap: Record<string, any> = {
          OPERATIONAL: 'OPERATIONAL',
          FINANCIAL: 'FINANCIAL',
          STRATEGIC: 'STRATEGIC',
          COMPLIANCE: 'COMPLIANCE',
          TECHNOLOGY: 'TECHNOLOGY',
        };
        mapped.category = (categoryMap[category] || 'OPERATIONAL') as any;
        return mapped;
      });
      return normalized;
    } catch {
      // Fallback to mock data on any unexpected failure
      return generateMockRisks();
    }
  },

  async createRisk(riskData: Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>): Promise<Risk> {
    try {
      const body = {
        title: riskData.title,
        description: riskData.description,
        category: (riskData.category || 'OPERATIONAL').toString().toUpperCase(),
        likelihood: riskData.likelihood,
        impact: riskData.impact,
      };
      const res = await fetch('/api/risks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const created = await res.json();
        // Re-fetch to keep things simple and accurate
        return {
          ...riskData,
          id: created.data?.id || `risk-${Date.now()}`,
          riskScore: calculateRiskScore(riskData.likelihood, riskData.impact),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {}
    // Fallback local create
    return {
      ...riskData,
      id: `risk-${Date.now()}`,
      riskScore: calculateRiskScore(riskData.likelihood, riskData.impact),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateRisk(id: string, riskData: Partial<Risk>): Promise<Risk> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const updatedRisk: Risk = {
      ...riskData as Risk,
      id,
      riskScore: riskData.likelihood && riskData.impact 
        ? calculateRiskScore(riskData.likelihood, riskData.impact)
        : (riskData as Risk).riskScore,
      updatedAt: new Date().toISOString(),
    };
    
    return updatedRisk;
  },

  async deleteRisk(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async deleteRisks(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
};

export const RiskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(riskReducer, initialState);

  // Load initial risks
  useEffect(() => {
    const loadRisks = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const risks = await riskService.getAllRisks();
        dispatch({ type: 'SET_RISKS', payload: risks });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load risks' });
      }
    };

    loadRisks();
  }, []);

  // CRUD Operations
  const createRisk = async (riskData: Omit<Risk, 'id' | 'createdAt' | 'updatedAt' | 'riskScore'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newRisk = await riskService.createRisk(riskData);
      dispatch({ type: 'ADD_RISK', payload: newRisk });
      return newRisk;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create risk' });
      throw error;
    }
  };

  const updateRisk = async (id: string, riskData: Partial<Risk>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedRisk = await riskService.updateRisk(id, riskData);
      dispatch({ type: 'UPDATE_RISK', payload: updatedRisk });
      return updatedRisk;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update risk' });
      throw error;
    }
  };

  const deleteRisk = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await riskService.deleteRisk();
      dispatch({ type: 'DELETE_RISK', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete risk' });
      throw error;
    }
  };

  const deleteRisks = async (ids: string[]) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await riskService.deleteRisks();
      dispatch({ type: 'DELETE_RISKS', payload: ids });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete risks' });
      throw error;
    }
  };

  const getRisk = (id: string) => {
    return state.risks.find(risk => risk.id === id) || null;
  };

  // Filtering and Search
  const setFilters = (filters: Partial<RiskFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const setSearch = (search: string) => {
    dispatch({ type: 'SET_FILTERS', payload: { search } });
  };

  // Selection
  const setSelectedRisks = (ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_RISKS', payload: ids });
  };

  const selectAllRisks = () => {
    const filteredRisks = getFilteredRisks();
    dispatch({ type: 'SET_SELECTED_RISKS', payload: filteredRisks.map(r => r.id) });
  };

  const clearSelection = () => {
    dispatch({ type: 'SET_SELECTED_RISKS', payload: [] });
  };

  // Sorting
  const setSorting = (field: string, direction: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORTING', payload: { field, direction } });
  };

  // Utility functions
  const getFilteredRisks = (): Risk[] => {
    let filtered = [...state.risks];

    // Apply filters
    if (state.filters.category) {
      filtered = filtered.filter(risk => risk.category === state.filters.category);
    }
    
    if (state.filters.status) {
      filtered = filtered.filter(risk => risk.status === state.filters.status);
    }
    
    if (state.filters.owner) {
      filtered = filtered.filter(risk => risk.owner.toLowerCase().includes(state.filters.owner!.toLowerCase()));
    }
    
    if (state.filters.riskLevel) {
      filtered = filtered.filter(risk => getRiskLevel(risk.riskScore) === state.filters.riskLevel);
    }
    
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filtered = filtered.filter(risk =>
        risk.title.toLowerCase().includes(searchTerm) ||
        risk.description.toLowerCase().includes(searchTerm) ||
        risk.owner.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[state.sortBy as keyof Risk];
      const bVal = b[state.sortBy as keyof Risk];
      
      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;
      
      if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getRisksByCategory = (): Record<RiskCategory, Risk[]> => {
    const categories: RiskCategory[] = ['OPERATIONAL', 'FINANCIAL', 'STRATEGIC', 'COMPLIANCE', 'TECHNOLOGY'];
    const result = {} as Record<RiskCategory, Risk[]>;
    
    categories.forEach(category => {
      result[category] = state.risks.filter(risk => risk.category === category);
    });
    
    return result;
  };

  const getRiskStats = () => {
    const risks = state.risks;
    const total = risks.length;
    
    const byStatus = risks.reduce((acc, risk) => {
      acc[risk.status] = (acc[risk.status] || 0) + 1;
      return acc;
    }, {} as Record<Risk['status'], number>);
    
    const byLevel = risks.reduce((acc, risk) => {
      const level = getRiskLevel(risk.riskScore);
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageScore = risks.length > 0 
      ? risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length 
      : 0;
    
    return { total, byStatus, byLevel, averageScore };
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <RiskContext.Provider value={{
      ...state,
      createRisk,
      updateRisk,
      deleteRisk,
      deleteRisks,
      getRisk,
      setFilters,
      clearFilters,
      setSearch,
      setSelectedRisks,
      selectAllRisks,
      clearSelection,
      setSorting,
      getFilteredRisks,
      getRisksByCategory,
      getRiskStats,
      clearError,
    }}>
      {children}
    </RiskContext.Provider>
  );
}; 