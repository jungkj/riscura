import { 
  Risk, 
  Control, 
  ControlRiskMapping, 
  AssessmentEvidence,
  AssessmentFinding,
  CreateRiskRequest,
  UpdateRiskRequest,
  CreateControlRequest,
  UpdateControlRequest,
  CreateControlRiskMappingRequest,
  CreateEvidenceRequest,
  RiskQueryParams,
  ControlQueryParams,
  PaginatedResponse,
  ApiResponse,
  RCSAAnalytics,
  TestScript,
  CreateTestScriptRequest,
  UpdateTestScriptRequest,
  TestScriptQueryParams,
  ExecuteTestRequest,
  TestExecution,
  GenerateTestScriptRequest,
  GenerateTestScriptResponse,
  TestScriptControl
} from '@/types/rcsa.types';
import { getSession } from 'next-auth/react';

export class RCSAApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authenticated headers with NextAuth session
   */
  private async getAuthenticatedHeaders(): Promise<HeadersInit> {
    try {
      const session = await getSession();
      const headers: HeadersInit = {
        ...this.headers,
      };

      // Add organization context if available
      if (session?.user?.organizationId) {
        headers['organization-id'] = session.user.organizationId;
      }

      // Add request tracking
      headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return headers;
    } catch (error) {
      console.warn('Failed to get session for API request:', error);
      return this.headers;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get authenticated headers with session
      const authenticatedHeaders = await this.getAuthenticatedHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          ...authenticatedHeaders,
          ...options.headers, // Allow override of specific headers
        },
        credentials: 'include', // Include cookies for NextAuth session
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.error('Authentication required for API request:', endpoint);
          throw new Error(errorData.message || 'Authentication required. Please sign in again.');
        }
        
        if (response.status === 403) {
          console.error('Insufficient permissions for API request:', endpoint);
          throw new Error(errorData.message || 'Insufficient permissions for this operation.');
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
      };
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    return searchParams.toString();
  }

  // ============================================================================
  // RISK MANAGEMENT
  // ============================================================================

  async getRisks(params: RiskQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Risk>>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/risks${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Risk>>(endpoint);
  }

  async getRisk(id: string): Promise<ApiResponse<Risk>> {
    return this.request<Risk>(`/risks/${id}`);
  }

  async createRisk(risk: CreateRiskRequest): Promise<ApiResponse<Risk>> {
    return this.request<Risk>('/risks', {
      method: 'POST',
      body: JSON.stringify(risk),
    });
  }

  async updateRisk(id: string, updates: UpdateRiskRequest): Promise<ApiResponse<Risk>> {
    return this.request<Risk>(`/risks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteRisk(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/risks/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteRisks(ids: string[]): Promise<ApiResponse<void>> {
    return this.request<void>('/risks/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // ============================================================================
  // CONTROL MANAGEMENT
  // ============================================================================

  async getControls(params: ControlQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Control>>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/controls${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Control>>(endpoint);
  }

  async getControl(id: string): Promise<ApiResponse<Control>> {
    return this.request<Control>(`/controls/${id}`);
  }

  async createControl(control: CreateControlRequest): Promise<ApiResponse<Control>> {
    return this.request<Control>('/controls', {
      method: 'POST',
      body: JSON.stringify(control),
    });
  }

  async updateControl(id: string, updates: UpdateControlRequest): Promise<ApiResponse<Control>> {
    return this.request<Control>(`/controls/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteControl(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/controls/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteControls(ids: string[]): Promise<ApiResponse<void>> {
    return this.request<void>('/controls/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // ============================================================================
  // RISK-CONTROL MAPPING
  // ============================================================================

  async getControlRiskMappings(
    riskId?: string, 
    controlId?: string
  ): Promise<ApiResponse<ControlRiskMapping[]>> {
    const params: Record<string, string> = {};
    if (riskId) params.riskId = riskId;
    if (controlId) params.controlId = controlId;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/control-risk-mappings${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ControlRiskMapping[]>(endpoint);
  }

  async mapControlToRisk(mapping: CreateControlRiskMappingRequest): Promise<ApiResponse<ControlRiskMapping>> {
    return this.request<ControlRiskMapping>('/control-risk-mappings', {
      method: 'POST',
      body: JSON.stringify(mapping),
    });
  }

  async unmapControlFromRisk(riskId: string, controlId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/control-risk-mappings/${riskId}/${controlId}`, {
      method: 'DELETE',
    });
  }

  async updateControlEffectiveness(
    riskId: string,
    controlId: string,
    effectiveness: number
  ): Promise<ApiResponse<ControlRiskMapping>> {
    return this.request<ControlRiskMapping>(`/control-risk-mappings/${riskId}/${controlId}`, {
      method: 'PATCH',
      body: JSON.stringify({ effectiveness }),
    });
  }

  async bulkMapControls(riskId: string, controlIds: string[]): Promise<ApiResponse<ControlRiskMapping[]>> {
    return this.request<ControlRiskMapping[]>('/control-risk-mappings/bulk', {
      method: 'POST',
      body: JSON.stringify({ riskId, controlIds }),
    });
  }

  async bulkUpdateEffectiveness(updates: { riskId: string; controlId: string; effectiveness: number }[]): Promise<ApiResponse<ControlRiskMapping[]>> {
    return this.request<ControlRiskMapping[]>('/control-risk-mappings/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  }

  // ============================================================================
  // EVIDENCE MANAGEMENT
  // ============================================================================

  async getEvidence(controlId?: string, assessmentId?: string): Promise<ApiResponse<AssessmentEvidence[]>> {
    const params: Record<string, string> = {};
    if (controlId) params.controlId = controlId;
    if (assessmentId) params.assessmentId = assessmentId;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/evidence${queryString ? `?${queryString}` : ''}`;
    
    return this.request<AssessmentEvidence[]>(endpoint);
  }

  async addEvidence(evidence: CreateEvidenceRequest): Promise<ApiResponse<AssessmentEvidence>> {
    return this.request<AssessmentEvidence>('/evidence', {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
  }

  async updateEvidence(id: string, updates: Partial<AssessmentEvidence>): Promise<ApiResponse<AssessmentEvidence>> {
    return this.request<AssessmentEvidence>(`/evidence/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteEvidence(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/evidence/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // ASSESSMENT FINDINGS
  // ============================================================================

  async getFindings(controlId?: string, assessmentId?: string): Promise<ApiResponse<AssessmentFinding[]>> {
    const params: Record<string, string> = {};
    if (controlId) params.controlId = controlId;
    if (assessmentId) params.assessmentId = assessmentId;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/findings${queryString ? `?${queryString}` : ''}`;
    
    return this.request<AssessmentFinding[]>(endpoint);
  }

  async createFinding(finding: Partial<AssessmentFinding>): Promise<ApiResponse<AssessmentFinding>> {
    return this.request<AssessmentFinding>('/findings', {
      method: 'POST',
      body: JSON.stringify(finding),
    });
  }

  async updateFinding(id: string, updates: Partial<AssessmentFinding>): Promise<ApiResponse<AssessmentFinding>> {
    return this.request<AssessmentFinding>(`/findings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteFinding(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/findings/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // CONTROL TESTING
  // ============================================================================

  async scheduleControlTest(
    controlId: string, 
    testDate: Date, 
    assignee?: string
  ): Promise<ApiResponse<Control>> {
    return this.request<Control>(`/controls/${controlId}/schedule-test`, {
      method: 'POST',
      body: JSON.stringify({ 
        nextTestDate: testDate.toISOString(),
        assignee 
      }),
    });
  }

  async completeControlTest(
    controlId: string, 
    results: {
      effectiveness: number;
      testResults: string;
      evidence?: string[];
    }
  ): Promise<ApiResponse<Control>> {
    return this.request<Control>(`/controls/${controlId}/complete-test`, {
      method: 'POST',
      body: JSON.stringify({
        ...results,
        lastTestDate: new Date().toISOString(),
      }),
    });
  }

  async getOverdueTests(): Promise<ApiResponse<Control[]>> {
    return this.request<Control[]>('/controls/overdue-tests');
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getRCSAAnalytics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<RCSAAnalytics>> {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    const queryString = this.buildQueryString(params);
    const endpoint = `/analytics/rcsa${queryString ? `?${queryString}` : ''}`;
    
    return this.request<RCSAAnalytics>(endpoint);
  }

  async getRiskCoverageReport(): Promise<ApiResponse<{ riskId: string; controlCount: number; effectivenessScore: number }[]>> {
    return this.request('/analytics/risk-coverage');
  }

  async getEffectivenessTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<ApiResponse<{ date: string; effectiveness: number }[]>> {
    return this.request(`/analytics/effectiveness-trends?period=${period}`);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkCreateRisks(risks: CreateRiskRequest[]): Promise<ApiResponse<Risk[]>> {
    return this.request<Risk[]>('/risks/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ risks }),
    });
  }

  async bulkCreateControls(controls: CreateControlRequest[]): Promise<ApiResponse<Control[]>> {
    return this.request<Control[]>('/controls/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ controls }),
    });
  }

  async bulkUpdateRisks(updates: { id: string; data: UpdateRiskRequest }[]): Promise<ApiResponse<Risk[]>> {
    return this.request<Risk[]>('/risks/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  }

  async bulkUpdateControls(updates: { id: string; data: UpdateControlRequest }[]): Promise<ApiResponse<Control[]>> {
    return this.request<Control[]>('/controls/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  async validateRiskControlMapping(
    riskId: string, 
    controlId: string
  ): Promise<ApiResponse<{ valid: boolean; reason?: string }>> {
    return this.request(`/validate/risk-control-mapping?riskId=${riskId}&controlId=${controlId}`);
  }

  async calculateRiskScore(likelihood: number, impact: number): Promise<ApiResponse<{ score: number; level: string }>> {
    return this.request(`/calculate/risk-score?likelihood=${likelihood}&impact=${impact}`);
  }

  async getControlTemplates(): Promise<ApiResponse<Control[]>> {
    return this.request<Control[]>('/controls/templates');
  }

  async getRiskTemplates(): Promise<ApiResponse<Risk[]>> {
    return this.request<Risk[]>('/risks/templates');
  }

  // ============================================================================
  // TEST SCRIPTS
  // ============================================================================

  async getTestScripts(
    params?: TestScriptQueryParams
  ): Promise<ApiResponse<PaginatedResponse<TestScript>>> {
    const queryParams = params ? new URLSearchParams(params as any).toString() : '';
    return this.request<PaginatedResponse<TestScript>>(
      `/test-scripts${queryParams ? `?${queryParams}` : ''}`
    );
  }

  async getTestScript(id: string): Promise<ApiResponse<TestScript>> {
    return this.request<TestScript>(`/test-scripts/${id}`);
  }

  async createTestScript(
    data: CreateTestScriptRequest
  ): Promise<ApiResponse<TestScript>> {
    return this.request<TestScript>('/test-scripts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTestScript(
    id: string,
    data: UpdateTestScriptRequest
  ): Promise<ApiResponse<TestScript>> {
    return this.request<TestScript>(`/test-scripts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTestScript(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.request<{ id: string }>(`/test-scripts/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Script Control associations
  async getTestScriptControls(testScriptId: string): Promise<ApiResponse<TestScriptControl[]>> {
    return this.request<TestScriptControl[]>(`/test-scripts/${testScriptId}/controls`);
  }

  async associateTestScriptControls(
    testScriptId: string,
    controlIds: string[],
    isMandatory: boolean = true
  ): Promise<ApiResponse<{ associated: number; alreadyAssociated: number }>> {
    return this.request(`/test-scripts/${testScriptId}/controls`, {
      method: 'POST',
      body: JSON.stringify({ controlIds, isMandatory }),
    });
  }

  async disassociateTestScriptControls(
    testScriptId: string,
    controlIds: string[]
  ): Promise<ApiResponse<{ removed: number }>> {
    return this.request(`/test-scripts/${testScriptId}/controls`, {
      method: 'DELETE',
      body: JSON.stringify({ controlIds }),
    });
  }

  // Test execution
  async executeTest(
    testScriptId: string,
    data: ExecuteTestRequest
  ): Promise<ApiResponse<TestExecution>> {
    return this.request<TestExecution>(`/test-scripts/${testScriptId}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI generation
  async generateTestScript(
    data: GenerateTestScriptRequest
  ): Promise<ApiResponse<GenerateTestScriptResponse>> {
    return this.request<GenerateTestScriptResponse>('/test-scripts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }
}

// Create singleton instance
export const rcsaApiClient = new RCSAApiClient();

// Helper functions for common operations
export const rcsaHelpers = {
  /**
   * Calculate risk score based on likelihood and impact
   */
  calculateRiskScore: (likelihood: number, impact: number): number => {
    return likelihood * impact;
  },

  /**
   * Determine risk level based on risk score
   */
  calculateRiskLevel: (riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    if (riskScore <= 4) return 'LOW';
    if (riskScore <= 8) return 'MEDIUM';
    if (riskScore <= 12) return 'HIGH';
    return 'CRITICAL';
  },

  /**
   * Get effectiveness percentage as string
   */
  formatEffectiveness: (effectiveness: number): string => {
    return `${Math.round(effectiveness * 100)}%`;
  },

  /**
   * Get effectiveness color class
   */
  getEffectivenessColor: (effectiveness: number): string => {
    if (effectiveness >= 0.8) return 'text-green-600';
    if (effectiveness >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Check if control test is overdue
   */
  isTestOverdue: (nextTestDate?: Date): boolean => {
    if (!nextTestDate) return false;
    return new Date(nextTestDate) < new Date();
  },

  /**
   * Get days until next test
   */
  getDaysUntilTest: (nextTestDate?: Date): number | null => {
    if (!nextTestDate) return null;
    const diff = new Date(nextTestDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * Format control frequency display
   */
  formatFrequency: (frequency: string): string => {
    return frequency.toLowerCase().replace(/^\w/, c => c.toUpperCase());
  },

  /**
   * Generate control ID
   */
  generateControlId: (type: string, sequence: number): string => {
    const typePrefix = type.substring(0, 3).toUpperCase();
    return `${typePrefix}-${sequence.toString().padStart(4, '0')}`;
  },

  /**
   * Generate risk ID
   */
  generateRiskId: (category: string, sequence: number): string => {
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    return `${categoryPrefix}-${sequence.toString().padStart(4, '0')}`;
  },
};

export default rcsaApiClient; 