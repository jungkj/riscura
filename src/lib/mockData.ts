// import { User, Risk, Control, Document, Questionnaire, Workflow, RiskCategory } from '@/types'
// import { calculateRiskScore } from './utils'
import { toast } from 'sonner';

// API base configuration
const API_BASE = '/api';

// Generic API request function with error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    // console.error(`API request failed for ${endpoint}:`, error)
    toast.error(
      `Failed to ${options.method || 'fetch'} data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

// ============================================================================
// RISK API INTEGRATION
// ============================================================================

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: 'OPERATIONAL' | 'FINANCIAL' | 'STRATEGIC' | 'COMPLIANCE' | 'TECHNOLOGY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'IDENTIFIED' | 'ASSESSED' | 'MITIGATED' | 'CLOSED';
  likelihood: number;
  impact: number;
  riskScore: number;
  owner?: string;
  dateIdentified?: string;
  lastAssessed?: string;
  nextReview?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  createdBy?: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  controls?: Control[];
  _count?: {
    controls: number;
    evidence: number;
    comments: number;
    tasks: number;
  };
}

export interface Control {
  id: string;
  title: string;
  description: string;
  category: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE' | 'COMPENSATING';
  type: 'MANUAL' | 'AUTOMATED' | 'HYBRID';
  status: 'PLANNED' | 'IMPLEMENTED' | 'OPERATIONAL' | 'NEEDS_IMPROVEMENT' | 'INEFFECTIVE';
  effectiveness?: number;
  implementationDate?: string;
  lastTestedDate?: string;
  nextTestDate?: string;
  frequency: 'CONTINUOUS' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'AD_HOC';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface RiskQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  riskLevel?: string;
  owner?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalPages: number;
  };
  summary?: Record<string, any>;
  message?: string;
}

// Risk API functions
export const riskAPI = {
  // Get all risks with filtering and pagination
  async getRisks(params: RiskQueryParams = {}): Promise<ApiResponse<Risk[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Risk[]>>(`/risks?${searchParams}`);
  },

  // Get single risk by ID
  async getRisk(id: string): Promise<Risk> {
    return apiRequest<Risk>(`/risks/${id}`);
  },

  // Create new risk
  async createRisk(_risk: Partial<Risk>): Promise<Risk> {
    return apiRequest<Risk>('/risks', {
      method: 'POST',
      body: JSON.stringify(risk),
    });
  },

  // Update risk
  async updateRisk(id: string, updates: Partial<Risk>): Promise<Risk> {
    return apiRequest<Risk>(`/risks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete risk
  async deleteRisk(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/risks/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk operations
  async bulkUpdateRisks(operations: {
    create?: Partial<Risk>[];
    update?: Array<{ id: string } & Partial<Risk>>;
    delete?: string[];
  }): Promise<{ created: number; updated: number; deleted: number; errors: string[] }> {
    return apiRequest('/risks/bulk', {
      method: 'PUT',
      body: JSON.stringify(operations),
    });
  },
};

// ============================================================================
// CONTROL API INTEGRATION
// ============================================================================

export const controlAPI = {
  // Get all controls with filtering and pagination
  async getControls(params: RiskQueryParams = {}): Promise<ApiResponse<Control[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Control[]>>(`/controls?${searchParams}`);
  },

  // Get single control by ID
  async getControl(id: string): Promise<Control> {
    return apiRequest<Control>(`/controls/${id}`);
  },

  // Create new control
  async createControl(control: Partial<Control>): Promise<Control> {
    return apiRequest<Control>('/controls', {
      method: 'POST',
      body: JSON.stringify(control),
    });
  },

  // Update control
  async updateControl(id: string, updates: Partial<Control>): Promise<Control> {
    return apiRequest<Control>(`/controls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete control
  async deleteControl(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/controls/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// DOCUMENT API INTEGRATION
// ============================================================================

export interface Document {
  id: string;
  title: string;
  description?: string;
  category:
    | 'POLICY'
    | 'PROCEDURE'
    | 'GUIDELINE'
    | 'FRAMEWORK'
    | 'STANDARD'
    | 'TEMPLATE'
    | 'REPORT'
    | 'EVIDENCE'
    | 'CONTRACT'
    | 'OTHER';
  type: string;
  size: number;
  mimeType: string;
  path: string;
  uploadedAt: string;
  uploadedBy: string;
  organizationId: string;
  tags: string[];
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  version: string;
  linkedRisks: string[];
  linkedControls: string[];
}

export const documentAPI = {
  // Get all documents
  async getDocuments(params: RiskQueryParams = {}): Promise<ApiResponse<Document[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Document[]>>(`/documents?${searchParams}`);
  },

  // Upload document
  async uploadDocument(_file: File, metadata: Partial<Document>): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return apiRequest<Document>('/upload/documents', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },

  // Delete document
  async deleteDocument(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// ASSESSMENT API INTEGRATION
// ============================================================================

export interface Assessment {
  id: string;
  name: string;
  description?: string;
  type: 'ASSESSMENT';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  organizationId: string;
  createdBy?: string;
  steps: any[];
  relatedEntities?: {
    assessmentType: string;
    framework?: string;
    scope?: string;
    objectives?: string[];
    methodology?: string;
  };
}

export const assessmentAPI = {
  // Get all assessments
  async getAssessments(params: RiskQueryParams = {}): Promise<ApiResponse<Assessment[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Assessment[]>>(`/assessments?${searchParams}`);
  },

  // Create new assessment
  async createAssessment(assessment: Partial<Assessment>): Promise<Assessment> {
    return apiRequest<Assessment>('/assessments', {
      method: 'POST',
      body: JSON.stringify(assessment),
    });
  },

  // Update assessment
  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    return apiRequest<Assessment>(`/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============================================================================
// QUESTIONNAIRE API INTEGRATION
// ============================================================================

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  type:
    | 'RISK_ASSESSMENT'
    | 'CONTROL_EVALUATION'
    | 'COMPLIANCE_CHECK'
    | 'VENDOR_ASSESSMENT'
    | 'SELF_ASSESSMENT'
    | 'CUSTOM';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isActive: boolean;
  questions: any[];
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  _count?: {
    responses: number;
  };
}

export const questionnaireAPI = {
  // Get all questionnaires
  async getQuestionnaires(params: RiskQueryParams = {}): Promise<ApiResponse<Questionnaire[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Questionnaire[]>>(`/questionnaires?${searchParams}`);
  },

  // Create new questionnaire
  async createQuestionnaire(_questionnaire: Partial<Questionnaire>): Promise<Questionnaire> {
    return apiRequest<Questionnaire>('/questionnaires', {
      method: 'POST',
      body: JSON.stringify(questionnaire),
    });
  },

  // Submit questionnaire response
  async submitResponse(_questionnaireId: string, responses: any[]): Promise<any> {
    return apiRequest('/questionnaires/responses', {
      method: 'POST',
      body: JSON.stringify({
        questionnaireId,
        responses,
      }),
    });
  },
};

// ============================================================================
// REPORT API INTEGRATION
// ============================================================================

export interface Report {
  id: string;
  title: string;
  description?: string;
  type:
    | 'RISK_ASSESSMENT'
    | 'CONTROL_EFFECTIVENESS'
    | 'COMPLIANCE'
    | 'AUDIT'
    | 'EXECUTIVE_DASHBOARD'
    | 'CUSTOM';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  parameters?: any;
  data?: any;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export const reportAPI = {
  // Get all reports
  async getReports(params: RiskQueryParams = {}): Promise<ApiResponse<Report[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Report[]>>(`/reports?${searchParams}`);
  },

  // Generate report
  async generateReport(_type: string, parameters: any, format = 'PDF'): Promise<any> {
    return apiRequest('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        type,
        parameters,
        format,
      }),
    });
  },

  // Create new report
  async createReport(report: Partial<Report>): Promise<Report> {
    return apiRequest<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },
};

// ============================================================================
// NOTIFICATION API INTEGRATION
// ============================================================================

export interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER';
  title: string;
  message: string;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  createdAt: string;
  userId: string;
  organizationId: string;
}

export const notificationAPI = {
  // Get user notifications
  async getNotifications(
    params: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<ApiResponse<Notification[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    return apiRequest<ApiResponse<Notification[]>>(`/notifications?${searchParams}`);
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    return apiRequest<Notification>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ updated: number }> {
    return apiRequest('/notifications/read-all', {
      method: 'POST',
    });
  },

  // Delete notification
  async deleteNotification(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// USER API INTEGRATION
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  organizationId: string;
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const userAPI = {
  // Get current user
  async getCurrentUser(): Promise<{ user: User; organization: any }> {
    return apiRequest<{ user: User; organization: any }>('/users/me');
  },

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    return apiRequest<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Change password
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    return apiRequest('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },
};

// ============================================================================
// ANALYTICS API INTEGRATION
// ============================================================================

export const analyticsAPI = {
  // Get dashboard metrics
  async getDashboardMetrics(dateRange?: { start: string; end: string }): Promise<any> {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
    return apiRequest(`/analytics/dashboard${params}`);
  },

  // Get risk trends
  async getRiskTrends(_period: string = '30d'): Promise<any> {
    return apiRequest(`/analytics/risks/trends?period=${period}`);
  },

  // Get control effectiveness metrics
  async getControlEffectiveness(): Promise<any> {
    return apiRequest('/analytics/controls/effectiveness');
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Format date for API
export function formatDateForAPI(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString();
}

// Handle API errors consistently
export function handleAPIError(__error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Cache management for better performance
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCachedData<T>(key: string): T | null {
  const _cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

export function setCachedData<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Export all APIs as a single object for convenience
export const api = {
  risks: riskAPI,
  controls: controlAPI,
  documents: documentAPI,
  assessments: assessmentAPI,
  questionnaires: questionnaireAPI,
  reports: reportAPI,
  notifications: notificationAPI,
  users: userAPI,
  analytics: analyticsAPI,
};

// ============================================================================
// LEGACY MOCK DATA GENERATORS (for backward compatibility)
// ============================================================================

export function generateMockRisks(): any[] {
  return [
    {
      id: '1',
      title: 'Data Breach Risk',
      description: 'Risk of unauthorized access to sensitive customer data',
      category: 'TECHNOLOGY',
      riskLevel: 'HIGH',
      probability: 3,
      impact: 5,
      riskScore: 15,
      status: 'IDENTIFIED',
      owner: 'Security Team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
    },
    {
      id: '2',
      title: 'Regulatory Compliance Risk',
      description: 'Risk of non-compliance with GDPR regulations',
      category: 'COMPLIANCE',
      riskLevel: 'MEDIUM',
      probability: 2,
      impact: 4,
      riskScore: 8,
      status: 'ASSESSED',
      owner: 'Compliance Team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
    },
    {
      id: '3',
      title: 'Market Volatility Risk',
      description: 'Risk from fluctuating market conditions affecting revenue',
      category: 'FINANCIAL',
      riskLevel: 'MEDIUM',
      probability: 4,
      impact: 3,
      riskScore: 12,
      status: 'MITIGATED',
      owner: 'Finance Team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
    },
  ];
}

export function generateMockControls(): any[] {
  return [
    {
      id: '1',
      title: 'Multi-Factor Authentication',
      description: 'MFA system for all user accounts',
      category: 'PREVENTIVE',
      type: 'AUTOMATED',
      status: 'OPERATIONAL',
      effectiveness: 85,
      implementationDate: new Date().toISOString(),
      lastTestedDate: new Date().toISOString(),
      frequency: 'CONTINUOUS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
    },
    {
      id: '2',
      title: 'Data Encryption',
      description: 'End-to-end encryption for all data transmission',
      category: 'PREVENTIVE',
      type: 'AUTOMATED',
      status: 'OPERATIONAL',
      effectiveness: 95,
      implementationDate: new Date().toISOString(),
      lastTestedDate: new Date().toISOString(),
      frequency: 'CONTINUOUS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
    },
    {
      id: '3',
      title: 'Regular Security Audits',
      description: 'Quarterly security assessments and penetration testing',
      category: 'DETECTIVE',
      type: 'MANUAL',
      status: 'OPERATIONAL',
      effectiveness: 78,
      implementationDate: new Date().toISOString(),
      lastTestedDate: new Date().toISOString(),
      frequency: 'QUARTERLY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: 'demo-org',
    },
  ];
}

export default api;
