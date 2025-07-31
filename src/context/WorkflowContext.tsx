'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Workflow, WorkflowStep, WorkflowState, WorkflowCondition } from '@/types';

interface WorkflowContextType extends WorkflowState {
  // CRUD Operations
  createWorkflow: (data: Omit<Workflow, 'id' | 'createdAt'>) => Promise<Workflow>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  getWorkflow: (id: string) => Workflow | null;

  // Step Management
  addStep: (workflowId: string, step: Omit<WorkflowStep, 'id'>) => Promise<WorkflowStep>;
  updateStep: (
    workflowId: string,
    stepId: string,
    data: Partial<WorkflowStep>
  ) => Promise<WorkflowStep>;
  deleteStep: (workflowId: string, stepId: string) => Promise<void>;
  reorderSteps: (workflowId: string, stepIds: string[]) => Promise<void>;

  // Workflow Execution
  startWorkflow: (workflowId: string, context?: Record<string, unknown>) => Promise<void>;
  completeStep: (
    workflowId: string,
    stepId: string,
    result: 'completed' | 'rejected',
    comments?: string
  ) => Promise<void>;
  skipStep: (workflowId: string, stepId: string, reason: string) => Promise<void>;
  escalateStep: (workflowId: string, stepId: string) => Promise<void>;

  // Routing and Conditions
  evaluateConditions: (
    conditions: WorkflowCondition[],
    context: Record<string, unknown>
  ) => boolean;
  getNextStep: (
    workflowId: string,
    currentStepId: string,
    context: Record<string, unknown>
  ) => WorkflowStep | null;
  getActiveSteps: (workflowId: string) => WorkflowStep[];

  // Assignment and Notifications
  assignStep: (workflowId: string, stepId: string, assigneeId: string) => Promise<void>;
  sendNotification: (
    workflowId: string,
    stepId: string,
    type: 'assigned' | 'overdue' | 'escalated'
  ) => Promise<void>;

  // Analytics and Reporting
  getWorkflowStats: () => {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    averageCompletionTime: number;
  };
  getStepAnalytics: (workflowId: string) => {
    stepId: string;
    averageTime: number;
    completionRate: number;
    rejectionRate: number;
  }[];

  // Templates and Duplication
  createTemplate: (workflowId: string, templateName: string) => Promise<Workflow>;
  duplicateWorkflow: (workflowId: string, newName: string) => Promise<Workflow>;

  // Utility
  exportWorkflow: (workflowId: string, format: 'json' | 'pdf') => Promise<void>;

  // Error handling
  clearError: () => void;
}

// Workflow Actions
type WorkflowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_WORKFLOWS'; payload: Workflow[] }
  | { type: 'ADD_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'SET_SELECTED_WORKFLOW'; payload: Workflow | null }
  | { type: 'SET_ACTIVE_STEPS'; payload: WorkflowStep[] }
  | { type: 'UPDATE_STEP'; payload: { workflowId: string; step: WorkflowStep } };

// Initial state
const initialState: WorkflowState = {
  workflows: [],
  selectedWorkflow: null,
  activeSteps: [],
  loading: false,
  error: null,
};

// Workflow reducer
const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload, loading: false };

    case 'ADD_WORKFLOW':
      return {
        ...state,
        workflows: [action.payload, ...state.workflows],
        loading: false,
      };

    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map((w) => (w.id === action.payload.id ? action.payload : w)),
        selectedWorkflow:
          state.selectedWorkflow?.id === action.payload.id
            ? action.payload
            : state.selectedWorkflow,
        loading: false,
      };

    case 'DELETE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.filter((w) => w.id !== action.payload),
        selectedWorkflow:
          state.selectedWorkflow?.id === action.payload ? null : state.selectedWorkflow,
        loading: false,
      };

    case 'SET_SELECTED_WORKFLOW':
      return { ...state, selectedWorkflow: action.payload };

    case 'SET_ACTIVE_STEPS':
      return { ...state, activeSteps: action.payload };

    case 'UPDATE_STEP':
      return {
        ...state,
        workflows: state.workflows.map((w) =>
          w.id === action.payload.workflowId
            ? {
                ...w,
                steps: w.steps.map((s) =>
                  s.id === action.payload.step.id ? action.payload.step : s
                ),
              }
            : w
        ),
        activeSteps: state.activeSteps.map((s) =>
          s.id === action.payload.step.id ? action.payload.step : s
        ),
      };

    default:
      return state;
  }
};

const WorkflowContext = createContext<WorkflowContextType>({} as WorkflowContextType);

export const useWorkflows = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflows must be used within WorkflowProvider');
  }
  return context;
};

// Mock API service
const workflowService = {
  async getAllWorkflows(): Promise<Workflow[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateMockWorkflows();
  },

  async createWorkflow(data: Omit<Workflow, 'id' | 'createdAt'>): Promise<Workflow> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newWorkflow: Workflow = {
      ...data,
      id: `workflow-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    return newWorkflow;
  },

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      ...(data as Workflow),
      id,
    };
  },

  async deleteWorkflow(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  },
};

// Mock data generator
const generateMockWorkflows = (): Workflow[] => {
  const workflows: Workflow[] = [
    {
      id: 'wf1',
      name: 'Risk Assessment Approval',
      description: 'Standard approval workflow for new risk assessments',
      type: 'approval',
      steps: [
        {
          id: 'step1',
          name: 'Initial Review',
          type: 'review',
          assignee: 'user1',
          status: 'completed',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          completedBy: 'user1',
          order: 1,
        },
        {
          id: 'step2',
          name: 'Risk Manager Approval',
          type: 'approval',
          assignee: 'user2',
          status: 'in_progress',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          order: 2,
          escalation: {
            enabled: true,
            timeoutHours: 48,
            escalateTo: 'user3',
            notificationMessage: 'Risk assessment approval is overdue',
          },
        },
        {
          id: 'step3',
          name: 'Final Documentation',
          type: 'action',
          assignee: 'user1',
          status: 'pending',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          order: 3,
        },
      ],
      status: 'active',
      assignedTo: ['user1', 'user2'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user1',
      priority: 'high',
      tags: ['risk', 'approval'],
      relatedEntities: {
        risks: ['risk1', 'risk2'],
      },
    },
    {
      id: 'wf2',
      name: 'Control Testing Workflow',
      description: 'Systematic workflow for control effectiveness testing',
      type: 'assessment',
      steps: [
        {
          id: 'step4',
          name: 'Test Planning',
          type: 'action',
          assignee: 'user3',
          status: 'completed',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          order: 1,
        },
        {
          id: 'step5',
          name: 'Execute Tests',
          type: 'action',
          assignee: 'user4',
          status: 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          order: 2,
        },
      ],
      status: 'active',
      assignedTo: ['user3', 'user4'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user3',
      priority: 'medium',
      tags: ['control', 'testing'],
      relatedEntities: {
        controls: ['control1', 'control2'],
      },
    },
    {
      id: 'wf3',
      name: 'Document Review Process',
      description: 'Review and approval process for policy documents',
      type: 'review',
      steps: [
        {
          id: 'step6',
          name: 'Content Review',
          type: 'review',
          assignee: 'user2',
          status: 'completed',
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          order: 1,
        },
        {
          id: 'step7',
          name: 'Legal Review',
          type: 'review',
          assignee: 'user5',
          status: 'completed',
          dueDate: new Date(Date.now()).toISOString(),
          completedAt: new Date(Date.now()).toISOString(),
          order: 2,
        },
      ],
      status: 'completed',
      assignedTo: ['user2', 'user5'],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user2',
      completedAt: new Date(Date.now()).toISOString(),
      priority: 'low',
      tags: ['document', 'review'],
      relatedEntities: {
        documents: ['doc1', 'doc2'],
      },
    },
  ];

  return workflows;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Load initial workflows
  useEffect(() => {
    const loadWorkflows = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const workflows = await workflowService.getAllWorkflows();
        dispatch({ type: 'SET_WORKFLOWS', payload: workflows });

        // Set active steps
        const activeSteps = workflows
          .filter((w) => w.status === 'active')
          .flatMap((w) =>
            w.steps.filter((s) => s.status === 'pending' || s.status === 'in_progress')
          );
        dispatch({ type: 'SET_ACTIVE_STEPS', payload: activeSteps });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load workflows' });
      }
    };

    loadWorkflows();
  }, []);

  // CRUD Operations
  const createWorkflow = async (data: Omit<Workflow, 'id' | 'createdAt'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newWorkflow = await workflowService.createWorkflow(data);
      dispatch({ type: 'ADD_WORKFLOW', payload: newWorkflow });
      return newWorkflow;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create workflow' });
      throw error;
    }
  };

  const updateWorkflow = async (id: string, data: Partial<Workflow>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedWorkflow = await workflowService.updateWorkflow(id, data);
      dispatch({ type: 'UPDATE_WORKFLOW', payload: updatedWorkflow });
      return updatedWorkflow;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update workflow' });
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await workflowService.deleteWorkflow();
      dispatch({ type: 'DELETE_WORKFLOW', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete workflow' });
      throw error;
    }
  };

  const getWorkflow = (id: string) => {
    return state.workflows.find((w) => w.id === id) || null;
  };

  // Step Management
  const addStep = async (workflowId: string, step: Omit<WorkflowStep, 'id'>) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const newStep: WorkflowStep = {
      ...step,
      id: `step-${Date.now()}`,
    };

    const updatedWorkflow = {
      ...workflow,
      steps: [...workflow.steps, newStep],
    };

    await updateWorkflow(workflowId, updatedWorkflow);
    return newStep;
  };

  const updateStep = async (workflowId: string, stepId: string, data: Partial<WorkflowStep>) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const updatedSteps = workflow.steps.map((s) => (s.id === stepId ? { ...s, ...data } : s));

    const updatedWorkflow = {
      ...workflow,
      steps: updatedSteps,
    };

    await updateWorkflow(workflowId, updatedWorkflow);
    const updatedStep = updatedSteps.find((s) => s.id === stepId)!;

    dispatch({ type: 'UPDATE_STEP', payload: { workflowId, step: updatedStep } });
    return updatedStep;
  };

  const deleteStep = async (workflowId: string, stepId: string) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const updatedSteps = workflow.steps.filter((s) => s.id !== stepId);
    const updatedWorkflow = {
      ...workflow,
      steps: updatedSteps,
    };

    await updateWorkflow(workflowId, updatedWorkflow);
  };

  const reorderSteps = async (workflowId: string, stepIds: string[]) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const reorderedSteps = stepIds
      .map((id, index) => {
        const step = workflow.steps.find((s) => s.id === id);
        return step ? { ...step, order: index + 1 } : null;
      })
      .filter(Boolean) as WorkflowStep[];

    const updatedWorkflow = {
      ...workflow,
      steps: reorderedSteps,
    };

    await updateWorkflow(workflowId, updatedWorkflow);
  };

  // Workflow Execution
  const startWorkflow = async (workflowId: string, context?: Record<string, unknown>) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const updatedWorkflow = {
      ...workflow,
      status: 'active' as const,
    };

    await updateWorkflow(workflowId, updatedWorkflow);
    console.log(`Started workflow ${workflowId}`, context);
  };

  const completeStep = async (
    workflowId: string,
    stepId: string,
    result: 'completed' | 'rejected',
    comments?: string
  ) => {
    await updateStep(workflowId, stepId, {
      status: result,
      completedAt: new Date().toISOString(),
      comments,
    });

    // Check if workflow is complete
    const workflow = getWorkflow(workflowId);
    if (workflow) {
      const allCompleted = workflow.steps.every(
        (s) => s.status === 'completed' || s.status === 'skipped'
      );
      if (allCompleted) {
        await updateWorkflow(workflowId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      }
    }
  };

  const skipStep = async (workflowId: string, stepId: string, reason: string) => {
    await updateStep(workflowId, stepId, {
      status: 'skipped',
      comments: reason,
    });
  };

  const escalateStep = async (workflowId: string, stepId: string) => {
    const workflow = getWorkflow(workflowId);
    const step = workflow?.steps.find((s) => s.id === stepId);

    if (step?.escalation?.escalateTo) {
      await updateStep(workflowId, stepId, {
        assignee: step.escalation.escalateTo,
      });

      await sendNotification(workflowId, stepId, 'escalated');
    }
  };

  // Routing and Conditions
  const evaluateConditions = (
    conditions: WorkflowCondition[],
    context: Record<string, unknown>
  ) => {
    return conditions.every((condition) => {
      const value = context[condition.field];
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'contains':
          return String(value).includes(String(condition.value));
        default:
          return false;
      }
    });
  };

  const getNextStep = (
    workflowId: string,
    currentStepId: string,
    context: Record<string, unknown>
  ) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) return null;

    const currentIndex = workflow.steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex === -1) return null;

    for (let i = currentIndex + 1; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      if (!step.conditions || evaluateConditions(step.conditions, context)) {
        return step;
      }
    }

    return null;
  };

  const getActiveSteps = (workflowId: string) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) return [];

    return workflow.steps.filter((s) => s.status === 'pending' || s.status === 'in_progress');
  };

  // Assignment and Notifications
  const assignStep = async (workflowId: string, stepId: string, assigneeId: string) => {
    await updateStep(workflowId, stepId, { assignee: assigneeId });
    await sendNotification(workflowId, stepId, 'assigned');
  };

  const sendNotification = async (
    workflowId: string,
    stepId: string,
    type: 'assigned' | 'overdue' | 'escalated'
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`Sent ${type} notification for workflow ${workflowId}, step ${stepId}`);
  };

  // Analytics and Reporting
  const getWorkflowStats = () => {
    const total = state.workflows.length;
    const active = state.workflows.filter((w) => w.status === 'active').length;
    const completed = state.workflows.filter((w) => w.status === 'completed').length;
    const overdue = state.workflows.filter(
      (w) =>
        w.status === 'active' &&
        w.steps.some(
          (s) =>
            (s.status === 'pending' || s.status === 'in_progress') &&
            new Date(s.dueDate) < new Date()
        )
    ).length;

    const averageCompletionTime = 5.2; // Mock value in days

    return { total, active, completed, overdue, averageCompletionTime };
  };

  const getStepAnalytics = (workflowId: string) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) return [];

    return workflow.steps.map((step) => ({
      stepId: step.id,
      averageTime: Math.random() * 48 + 12, // Mock hours
      completionRate: Math.random() * 0.3 + 0.7, // 70-100%
      rejectionRate: Math.random() * 0.1, // 0-10%
    }));
  };

  // Templates and Duplication
  const createTemplate = async (workflowId: string, templateName: string) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const template = {
      ...workflow,
      name: templateName,
      status: 'draft' as const,
      steps: workflow.steps.map((s) => ({
        ...s,
        status: 'pending' as const,
        completedAt: undefined,
      })),
    };

    return createWorkflow(template);
  };

  const duplicateWorkflow = async (workflowId: string, newName: string) => {
    const workflow = getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const duplicated = {
      ...workflow,
      name: newName,
      status: 'draft' as const,
    };

    return createWorkflow(duplicated);
  };

  // Utility
  const exportWorkflow = async (workflowId: string, format: 'json' | 'pdf') => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`Exported workflow ${workflowId} in ${format} format`);
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <WorkflowContext.Provider
      value={{
        ...state,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        getWorkflow,
        addStep,
        updateStep,
        deleteStep,
        reorderSteps,
        startWorkflow,
        completeStep,
        skipStep,
        escalateStep,
        evaluateConditions,
        getNextStep,
        getActiveSteps,
        assignStep,
        sendNotification,
        getWorkflowStats,
        getStepAnalytics,
        createTemplate,
        duplicateWorkflow,
        exportWorkflow,
        clearError,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
