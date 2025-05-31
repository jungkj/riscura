"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Questionnaire, Question, Response, QuestionnaireState, QuestionnaireAnalytics, RiskCategory } from '@/types';

interface QuestionnaireContextType extends QuestionnaireState {
  // CRUD Operations
  createQuestionnaire: (data: Omit<Questionnaire, 'id' | 'createdAt' | 'responses' | 'analytics'>) => Promise<Questionnaire>;
  updateQuestionnaire: (id: string, data: Partial<Questionnaire>) => Promise<Questionnaire>;
  deleteQuestionnaire: (id: string) => Promise<void>;
  getQuestionnaire: (id: string) => Questionnaire | null;
  
  // Question Management
  addQuestion: (questionnaireId: string, question: Omit<Question, 'id'>) => Promise<Question>;
  updateQuestion: (questionnaireId: string, questionId: string, data: Partial<Question>) => Promise<Question>;
  deleteQuestion: (questionnaireId: string, questionId: string) => Promise<void>;
  reorderQuestions: (questionnaireId: string, questionIds: string[]) => Promise<void>;
  
  // AI Question Generation
  generateQuestionsForRisk: (riskCategory: RiskCategory, count?: number) => Promise<Question[]>;
  generateQuestionsForControl: (controlType: string, count?: number) => Promise<Question[]>;
  
  // Response Management
  submitResponse: (questionnaireId: string, responses: Omit<Response, 'id' | 'createdAt'>[]) => Promise<void>;
  updateResponse: (responseId: string, data: Partial<Response>) => Promise<Response>;
  getResponses: (questionnaireId: string, userId?: string) => Response[];
  
  // Analytics
  getQuestionnaireAnalytics: (questionnaireId: string) => QuestionnaireAnalytics | null;
  getCompletionStats: () => { total: number; completed: number; pending: number; overdue: number };
  getResponseTrends: (questionnaireId: string) => { date: string; responses: number }[];
  
  // Distribution
  distributeQuestionnaire: (questionnaireId: string, userIds: string[]) => Promise<void>;
  sendReminders: (questionnaireId: string) => Promise<void>;
  
  // Conditional Logic
  evaluateConditions: (question: Question, responses: Response[]) => boolean;
  getNextQuestion: (questionnaireId: string, currentQuestionId: string, responses: Response[]) => Question | null;
  
  // Utility
  duplicateQuestionnaire: (questionnaireId: string, newTitle: string) => Promise<Questionnaire>;
  exportResponses: (questionnaireId: string, format: 'csv' | 'excel') => Promise<void>;
  
  // Error handling
  clearError: () => void;
}

// Questionnaire Actions
type QuestionnaireAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_QUESTIONNAIRES'; payload: Questionnaire[] }
  | { type: 'ADD_QUESTIONNAIRE'; payload: Questionnaire }
  | { type: 'UPDATE_QUESTIONNAIRE'; payload: Questionnaire }
  | { type: 'DELETE_QUESTIONNAIRE'; payload: string }
  | { type: 'SET_SELECTED_QUESTIONNAIRE'; payload: Questionnaire | null }
  | { type: 'SET_RESPONSES'; payload: Response[] }
  | { type: 'ADD_RESPONSE'; payload: Response }
  | { type: 'UPDATE_RESPONSE'; payload: Response }
  | { type: 'SET_ANALYTICS'; payload: { questionnaireId: string; analytics: QuestionnaireAnalytics } };

// Initial state
const initialState: QuestionnaireState = {
  questionnaires: [],
  selectedQuestionnaire: null,
  responses: [],
  analytics: {},
  loading: false,
  error: null,
};

// Questionnaire reducer
const questionnaireReducer = (state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_QUESTIONNAIRES':
      return { ...state, questionnaires: action.payload, loading: false };
    
    case 'ADD_QUESTIONNAIRE':
      return {
        ...state,
        questionnaires: [action.payload, ...state.questionnaires],
        loading: false,
      };
    
    case 'UPDATE_QUESTIONNAIRE':
      return {
        ...state,
        questionnaires: state.questionnaires.map(q =>
          q.id === action.payload.id ? action.payload : q
        ),
        selectedQuestionnaire: state.selectedQuestionnaire?.id === action.payload.id ? action.payload : state.selectedQuestionnaire,
        loading: false,
      };
    
    case 'DELETE_QUESTIONNAIRE':
      return {
        ...state,
        questionnaires: state.questionnaires.filter(q => q.id !== action.payload),
        selectedQuestionnaire: state.selectedQuestionnaire?.id === action.payload ? null : state.selectedQuestionnaire,
        loading: false,
      };
    
    case 'SET_SELECTED_QUESTIONNAIRE':
      return { ...state, selectedQuestionnaire: action.payload };
    
    case 'SET_RESPONSES':
      return { ...state, responses: action.payload };
    
    case 'ADD_RESPONSE':
      return {
        ...state,
        responses: [...state.responses, action.payload],
      };
    
    case 'UPDATE_RESPONSE':
      return {
        ...state,
        responses: state.responses.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    
    case 'SET_ANALYTICS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          [action.payload.questionnaireId]: action.payload.analytics,
        },
      };
    
    default:
      return state;
  }
};

const QuestionnaireContext = createContext<QuestionnaireContextType>({} as QuestionnaireContextType);

export const useQuestionnaires = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error('useQuestionnaires must be used within QuestionnaireProvider');
  }
  return context;
};

// Mock API service
const questionnaireService = {
  async getAllQuestionnaires(): Promise<Questionnaire[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockQuestionnaires();
  },

  async createQuestionnaire(data: Omit<Questionnaire, 'id' | 'createdAt' | 'responses' | 'analytics'>): Promise<Questionnaire> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newQuestionnaire: Questionnaire = {
      ...data,
      id: `questionnaire-${Date.now()}`,
      createdAt: new Date().toISOString(),
      responses: [],
      completionRate: 0,
    };
    
    return newQuestionnaire;
  },

  async updateQuestionnaire(id: string, data: Partial<Questionnaire>): Promise<Questionnaire> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      ...data as Questionnaire,
      id,
    };
  },

  async deleteQuestionnaire(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

// Mock data generator
const generateMockQuestionnaires = (): Questionnaire[] => {
  const questionnaires: Questionnaire[] = [
    {
      id: 'q1',
      title: 'Operational Risk Assessment',
      description: 'Comprehensive assessment of operational risks across departments',
      questions: [
        {
          id: 'q1-1',
          text: 'How would you rate the current operational risk level in your department?',
          type: 'rating',
          required: true,
          order: 1,
          category: 'operational',
        },
        {
          id: 'q1-2',
          text: 'Which operational risks concern you most?',
          type: 'multiple_choice',
          options: ['Process failures', 'System outages', 'Human error', 'Compliance issues'],
          required: true,
          order: 2,
          category: 'operational',
        },
        {
          id: 'q1-3',
          text: 'Please provide details about any recent operational incidents',
          type: 'text',
          required: false,
          order: 3,
          category: 'operational',
          conditional: {
            dependsOn: 'q1-1',
            showWhen: 4, // Show if rating is 4 or higher
          },
        },
      ],
      targetRoles: ['risk_manager', 'auditor'],
      status: 'active',
      responses: [],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user1',
      tags: ['operational', 'assessment'],
      estimatedTime: 15,
      completionRate: 0.65,
    },
    {
      id: 'q2',
      title: 'Control Effectiveness Survey',
      description: 'Evaluate the effectiveness of current control measures',
      questions: [
        {
          id: 'q2-1',
          text: 'Are current controls adequate for identified risks?',
          type: 'yes_no',
          required: true,
          order: 1,
          category: 'controls',
        },
        {
          id: 'q2-2',
          text: 'Upload evidence of control testing',
          type: 'file_upload',
          required: false,
          order: 2,
          category: 'controls',
        },
      ],
      targetRoles: ['auditor', 'user'],
      status: 'draft',
      responses: [],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user2',
      tags: ['controls', 'effectiveness'],
      estimatedTime: 10,
      completionRate: 0,
    },
  ];

  return questionnaires;
};

// AI Question Generation
const generateAIQuestions = (category: RiskCategory | string, count: number = 5): Question[] => {
  const questionTemplates = {
    operational: [
      'How would you rate the operational risk level in your area?',
      'What operational processes are most vulnerable?',
      'How often do operational incidents occur?',
      'What controls are in place for operational risks?',
      'How effective are current operational procedures?',
    ],
    financial: [
      'What financial risks pose the greatest threat?',
      'How is financial risk monitored and reported?',
      'What controls exist for financial transactions?',
      'How often are financial controls tested?',
      'What is the impact of financial risk materialization?',
    ],
    technology: [
      'What technology risks are most concerning?',
      'How secure are current IT systems?',
      'What cybersecurity measures are in place?',
      'How often are security assessments conducted?',
      'What is the disaster recovery capability?',
    ],
    compliance: [
      'What compliance requirements apply to your area?',
      'How are compliance obligations monitored?',
      'What controls ensure regulatory compliance?',
      'How often are compliance audits performed?',
      'What is the impact of compliance failures?',
    ],
    strategic: [
      'What strategic risks could impact objectives?',
      'How are strategic risks identified and assessed?',
      'What controls mitigate strategic risks?',
      'How often is strategic risk reviewed?',
      'What is the appetite for strategic risk?',
    ],
  };

  const templates = questionTemplates[category as keyof typeof questionTemplates] || questionTemplates.operational;
  
  return templates.slice(0, count).map((text, index) => ({
    id: `ai-${category}-${index + 1}`,
    text,
    type: index % 4 === 0 ? 'rating' : index % 4 === 1 ? 'multiple_choice' : index % 4 === 2 ? 'yes_no' : 'text',
    required: index < 2,
    order: index + 1,
    category: category as string,
    aiGenerated: true,
    options: index % 4 === 1 ? ['Very Low', 'Low', 'Medium', 'High', 'Very High'] : undefined,
  })) as Question[];
};

export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  // Load initial questionnaires
  useEffect(() => {
    const loadQuestionnaires = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const questionnaires = await questionnaireService.getAllQuestionnaires();
        dispatch({ type: 'SET_QUESTIONNAIRES', payload: questionnaires });
        
        // Generate mock analytics
        questionnaires.forEach(q => {
          const analytics: QuestionnaireAnalytics = {
            totalResponses: Math.floor(Math.random() * 50) + 10,
            completionRate: q.completionRate || Math.random() * 0.8 + 0.2,
            averageTime: Math.floor(Math.random() * 20) + 5,
            responsesByQuestion: {},
            trends: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              responses: Math.floor(Math.random() * 10),
            })),
          };
          dispatch({ type: 'SET_ANALYTICS', payload: { questionnaireId: q.id, analytics } });
        });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load questionnaires' });
      }
    };

    loadQuestionnaires();
  }, []);

  // CRUD Operations
  const createQuestionnaire = async (data: Omit<Questionnaire, 'id' | 'createdAt' | 'responses' | 'analytics'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newQuestionnaire = await questionnaireService.createQuestionnaire(data);
      dispatch({ type: 'ADD_QUESTIONNAIRE', payload: newQuestionnaire });
      return newQuestionnaire;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create questionnaire' });
      throw error;
    }
  };

  const updateQuestionnaire = async (id: string, data: Partial<Questionnaire>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedQuestionnaire = await questionnaireService.updateQuestionnaire(id, data);
      dispatch({ type: 'UPDATE_QUESTIONNAIRE', payload: updatedQuestionnaire });
      return updatedQuestionnaire;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update questionnaire' });
      throw error;
    }
  };

  const deleteQuestionnaire = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await questionnaireService.deleteQuestionnaire();
      dispatch({ type: 'DELETE_QUESTIONNAIRE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete questionnaire' });
      throw error;
    }
  };

  const getQuestionnaire = (id: string) => {
    return state.questionnaires.find(q => q.id === id) || null;
  };

  // Question Management
  const addQuestion = async (questionnaireId: string, question: Omit<Question, 'id'>) => {
    const questionnaire = getQuestionnaire(questionnaireId);
    if (!questionnaire) throw new Error('Questionnaire not found');

    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`,
    };

    const updatedQuestionnaire = {
      ...questionnaire,
      questions: [...questionnaire.questions, newQuestion],
    };

    await updateQuestionnaire(questionnaireId, updatedQuestionnaire);
    return newQuestion;
  };

  const updateQuestion = async (questionnaireId: string, questionId: string, data: Partial<Question>) => {
    const questionnaire = getQuestionnaire(questionnaireId);
    if (!questionnaire) throw new Error('Questionnaire not found');

    const updatedQuestions = questionnaire.questions.map(q =>
      q.id === questionId ? { ...q, ...data } : q
    );

    const updatedQuestionnaire = {
      ...questionnaire,
      questions: updatedQuestions,
    };

    await updateQuestionnaire(questionnaireId, updatedQuestionnaire);
    return updatedQuestions.find(q => q.id === questionId)!;
  };

  const deleteQuestion = async (questionnaireId: string, questionId: string) => {
    const questionnaire = getQuestionnaire(questionnaireId);
    if (!questionnaire) throw new Error('Questionnaire not found');

    const updatedQuestions = questionnaire.questions.filter(q => q.id !== questionId);
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: updatedQuestions,
    };

    await updateQuestionnaire(questionnaireId, updatedQuestionnaire);
  };

  const reorderQuestions = async (questionnaireId: string, questionIds: string[]) => {
    const questionnaire = getQuestionnaire(questionnaireId);
    if (!questionnaire) throw new Error('Questionnaire not found');

    const reorderedQuestions = questionIds.map((id, index) => {
      const question = questionnaire.questions.find(q => q.id === id);
      return question ? { ...question, order: index + 1 } : null;
    }).filter(Boolean) as Question[];

    const updatedQuestionnaire = {
      ...questionnaire,
      questions: reorderedQuestions,
    };

    await updateQuestionnaire(questionnaireId, updatedQuestionnaire);
  };

  // AI Question Generation
  const generateQuestionsForRisk = async (riskCategory: RiskCategory, count = 5) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing
    return generateAIQuestions(riskCategory, count);
  };

  const generateQuestionsForControl = async (controlType: string, count = 5) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing
    return generateAIQuestions(controlType, count);
  };

  // Response Management
  const submitResponse = async (_questionnaireId: string, responses: Omit<Response, 'id' | 'createdAt'>[]) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newResponses = responses.map(r => ({
      ...r,
      id: `response-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    }));

    newResponses.forEach(response => {
      dispatch({ type: 'ADD_RESPONSE', payload: response });
    });
  };

  const updateResponse = async (responseId: string, data: Partial<Response>) => {
    const updatedResponse = {
      ...state.responses.find(r => r.id === responseId)!,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'UPDATE_RESPONSE', payload: updatedResponse });
    return updatedResponse;
  };

  const getResponses = (questionnaireId: string, userId?: string) => {
    const questionnaire = getQuestionnaire(questionnaireId);
    if (!questionnaire) return [];

    let responses = state.responses.filter(r => 
      questionnaire.questions.some(q => q.id === r.questionId)
    );

    if (userId) {
      responses = responses.filter(r => r.userId === userId);
    }

    return responses;
  };

  // Analytics
  const getQuestionnaireAnalytics = (questionnaireId: string) => {
    return state.analytics[questionnaireId] || null;
  };

  const getCompletionStats = () => {
    const total = state.questionnaires.length;
    const completed = state.questionnaires.filter(q => q.status === 'completed').length;
    const pending = state.questionnaires.filter(q => q.status === 'active').length;
    const overdue = state.questionnaires.filter(q => 
      q.status === 'active' && new Date(q.dueDate) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const getResponseTrends = (questionnaireId: string) => {
    const analytics = getQuestionnaireAnalytics(questionnaireId);
    return analytics?.trends || [];
  };

  // Distribution
  const distributeQuestionnaire = async (questionnaireId: string, userIds: string[]) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Distributed questionnaire ${questionnaireId} to ${userIds.length} users`);
  };

  const sendReminders = async (questionnaireId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Sent reminders for questionnaire ${questionnaireId}`);
  };

  // Conditional Logic
  const evaluateConditions = (question: Question, responses: Response[]) => {
    if (!question.conditional) return true;

    const dependentResponse = responses.find(r => r.questionId === question.conditional!.dependsOn);
    if (!dependentResponse) return false;

    return dependentResponse.answer === question.conditional.showWhen;
  };

  const getNextQuestion = (questionnaireId: string, currentQuestionId: string, responses: Response[]) => {
    const questionnaire = getQuestionnaire(questionnaireId);
    if (!questionnaire) return null;

    const currentIndex = questionnaire.questions.findIndex(q => q.id === currentQuestionId);
    if (currentIndex === -1) return null;

    for (let i = currentIndex + 1; i < questionnaire.questions.length; i++) {
      const question = questionnaire.questions[i];
      if (evaluateConditions(question, responses)) {
        return question;
      }
    }

    return null;
  };

  // Utility
  const duplicateQuestionnaire = async (questionnaireId: string, newTitle: string) => {
    const original = getQuestionnaire(questionnaireId);
    if (!original) throw new Error('Questionnaire not found');

    const duplicated = {
      ...original,
      title: newTitle,
      status: 'draft' as const,
      responses: [],
      analytics: undefined,
    };

    return createQuestionnaire(duplicated);
  };

  const exportResponses = async (questionnaireId: string, format: 'csv' | 'excel') => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Exported responses for questionnaire ${questionnaireId} in ${format} format`);
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <QuestionnaireContext.Provider value={{
      ...state,
      createQuestionnaire,
      updateQuestionnaire,
      deleteQuestionnaire,
      getQuestionnaire,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      reorderQuestions,
      generateQuestionsForRisk,
      generateQuestionsForControl,
      submitResponse,
      updateResponse,
      getResponses,
      getQuestionnaireAnalytics,
      getCompletionStats,
      getResponseTrends,
      distributeQuestionnaire,
      sendReminders,
      evaluateConditions,
      getNextQuestion,
      duplicateQuestionnaire,
      exportResponses,
      clearError,
    }}>
      {children}
    </QuestionnaireContext.Provider>
  );
}; 