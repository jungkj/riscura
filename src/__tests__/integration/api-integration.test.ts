// API Integration Tests - Frontend-Backend Communication
import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TEST_TIMEOUT = 30000;

// Test data
const TEST_USER = {
  email: 'integration@riscura.com',
  password: 'TestPassword123!',
  name: 'Integration Test User',
  role: 'admin',
};

const TEST_ORGANIZATION = {
  name: 'Test Organization',
  industry: 'Technology',
  size: 'Medium',
  country: 'United States',
};

class APITestHelper {
  public authToken: string = '';

  constructor(public page: Page) {}

  // Authentication helpers
  async authenticate(): Promise<void> {
    const response = await this.page.request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    this.authToken = data.tokens?.accessToken || data.token;
    expect(this.authToken).toBeTruthy();
  }

  async makeAuthenticatedRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const options: any = {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.data = data;
    }

    const response = await this.page.request.fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      ...options,
    });

    return response;
  }

  async verifyHealthCheck(): Promise<void> {
    const response = await this.page.request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  }

  // Database connectivity test
  async verifyDatabaseConnection(): Promise<void> {
    const response = await this.makeAuthenticatedRequest('GET', '/health/database');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.connected).toBe(true);
  }

  // Test data cleanup
  async cleanup(): Promise<void> {
    // Clean up test data created during tests
    try {
      await this.makeAuthenticatedRequest('DELETE', '/test/cleanup');
    } catch (error) {
      // console.warn('Cleanup failed:', error);
    }
  }
}

test.describe('API Health and Connectivity', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
  });

  test('API health check returns OK', async () => {
    await helper.verifyHealthCheck();
  });

  test('Database connection is working', async () => {
    await helper.authenticate();
    await helper.verifyDatabaseConnection();
  });

  test('Authentication endpoints work correctly', async () => {
    // Test login
    const loginResponse = await helper.page.request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    expect(loginResponse.status()).toBe(200);

    const loginData = await loginResponse.json();
    expect(loginData.user).toBeTruthy();
    expect(loginData.tokens || loginData.token).toBeTruthy();

    // Test token validation
    const token = loginData.tokens?.accessToken || loginData.token;
    const validateResponse = await helper.page.request.get(`${API_BASE_URL}/auth/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(validateResponse.status()).toBe(200);
  });
});

test.describe('Risk Management API Integration', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test.afterEach(async () => {
    await helper.cleanup();
  });

  test('CRUD operations for risks', async () => {
    const riskData = {
      title: 'Test Risk',
      description: 'This is a test risk for API integration',
      category: 'operational',
      likelihood: 3,
      impact: 4,
      owner: TEST_USER.email,
    };

    // Create risk
    const createResponse = await helper.makeAuthenticatedRequest('POST', '/risks', riskData);
    expect(createResponse.status()).toBe(201);

    const createdRisk = await createResponse.json();
    expect(createdRisk.data?.id || createdRisk.id).toBeDefined();
    expect(createdRisk.data?.title || createdRisk.title).toBe(riskData.title);

    const riskId = createdRisk.data?.id || createdRisk.id;

    // Read risk
    const readResponse = await helper.makeAuthenticatedRequest('GET', `/risks/${riskId}`);
    expect(readResponse.status()).toBe(200);

    const retrievedRisk = await readResponse.json();
    expect(retrievedRisk.data?.title || retrievedRisk.title).toBe(riskData.title);

    // Update risk
    const updateData = { ...riskData, title: 'Updated Test Risk' };
    const updateResponse = await helper.makeAuthenticatedRequest(
      'PUT',
      `/risks/${riskId}`,
      updateData
    );
    expect(updateResponse.status()).toBe(200);

    const updatedRisk = await updateResponse.json();
    expect(updatedRisk.data?.title || updatedRisk.title).toBe('Updated Test Risk');

    // List risks
    const listResponse = await helper.makeAuthenticatedRequest('GET', '/risks');
    expect(listResponse.status()).toBe(200);

    const risks = await listResponse.json();
    expect(Array.isArray(risks.data || risks)).toBe(true);
    const risksList = risks.data || risks;
    expect(risksList.some((r: any) => r.id === riskId)).toBe(true);

    // Delete risk
    const deleteResponse = await helper.makeAuthenticatedRequest('DELETE', `/risks/${riskId}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const verifyDeleteResponse = await helper.makeAuthenticatedRequest('GET', `/risks/${riskId}`);
    expect(verifyDeleteResponse.status()).toBe(404);
  });

  test('CRUD operations for controls', async () => {
    const controlData = {
      name: 'Test Control',
      description: 'This is a test control for API integration',
      type: 'preventive',
      frequency: 'monthly',
      owner: TEST_USER.email,
    };

    // Create control
    const createResponse = await helper.makeAuthenticatedRequest('POST', '/controls', controlData);
    expect(createResponse.status()).toBe(201);

    const createdControl = await createResponse.json();
    expect(createdControl.data?.id || createdControl.id).toBeDefined();
    expect(createdControl.data?.name || createdControl.name).toBe(controlData.name);

    const controlId = createdControl.data?.id || createdControl.id;

    // Read control
    const readResponse = await helper.makeAuthenticatedRequest('GET', `/controls/${controlId}`);
    expect(readResponse.status()).toBe(200);

    const retrievedControl = await readResponse.json();
    expect(retrievedControl.data?.name || retrievedControl.name).toBe(controlData.name);

    // Update control
    const updateData = { ...controlData, name: 'Updated Test Control' };
    const updateResponse = await helper.makeAuthenticatedRequest(
      'PUT',
      `/controls/${controlId}`,
      updateData
    );
    expect(updateResponse.status()).toBe(200);

    const updatedControl = await updateResponse.json();
    expect(updatedControl.data?.name || updatedControl.name).toBe('Updated Test Control');

    // List controls
    const listResponse = await helper.makeAuthenticatedRequest('GET', '/controls');
    expect(listResponse.status()).toBe(200);

    const controls = await listResponse.json();
    expect(Array.isArray(controls.data || controls)).toBe(true);
    const controlsList = controls.data || controls;
    expect(controlsList.some((c: any) => c.id === controlId)).toBe(true);

    // Delete control
    const deleteResponse = await helper.makeAuthenticatedRequest(
      'DELETE',
      `/controls/${controlId}`
    );
    expect(deleteResponse.status()).toBe(200);

    // Verify deletion
    const verifyDeleteResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/controls/${controlId}`
    );
    expect(verifyDeleteResponse.status()).toBe(404);
  });

  test('Risk validation and error handling', async () => {
    // Test invalid risk data
    const invalidRisk = {
      title: '', // Required field empty
      description: 'Test description',
    };

    const response = await helper.makeAuthenticatedRequest('POST', '/risks', invalidRisk);
    expect(response.status()).toBe(400);

    const errorData = await response.json();
    expect(errorData.errors).toBeTruthy();
    expect(errorData.errors.title).toBeTruthy();
  });

  test('Risk search and filtering', async () => {
    // Create test risks
    const risks = [
      {
        title: 'Cybersecurity Risk',
        description: 'Security vulnerability',
        category: 'Technology',
        probability: 'High',
        impact: 'High',
      },
      {
        title: 'Operational Risk',
        description: 'Process failure',
        category: 'Operational',
        probability: 'Medium',
        impact: 'Medium',
      },
    ];

    const createdRisks: any[] = [];
    for (const risk of risks) {
      const response = await helper.makeAuthenticatedRequest('POST', '/risks', risk);
      expect(response.status()).toBe(201);
      createdRisks.push(await response.json());
    }

    // Test search
    const searchResponse = await helper.makeAuthenticatedRequest(
      'GET',
      '/risks?search=cybersecurity'
    );
    expect(searchResponse.status()).toBe(200);

    const searchResults = await searchResponse.json();
    const results = searchResults.data || searchResults;
    expect(results.some((r: any) => r.title.includes('Cybersecurity'))).toBe(true);

    // Test filter by category
    const filterResponse = await helper.makeAuthenticatedRequest(
      'GET',
      '/risks?category=Technology'
    );
    expect(filterResponse.status()).toBe(200);

    const filterResults = await filterResponse.json();
    const filtered = filterResults.data || filterResults;
    expect(filtered.every((r: any) => r.category === 'Technology')).toBe(true);

    // Cleanup
    for (const risk of createdRisks) {
      await helper.makeAuthenticatedRequest('DELETE', `/risks/${risk.id}`);
    }
  });
});

test.describe('Control Management API Integration', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test.afterEach(async () => {
    await helper.cleanup();
  });

  test('Control lifecycle management', async () => {
    const controlData = {
      title: 'Test Security Control',
      description: 'Test control for API integration',
      type: 'Preventive',
      category: 'Access Control',
      frequency: 'Monthly',
      owner: TEST_USER.email,
    };

    // Create control
    const createResponse = await helper.makeAuthenticatedRequest('POST', '/controls', controlData);
    expect(createResponse.status()).toBe(201);

    const control = await createResponse.json();
    const controlId = control.id;

    // Test control implementation
    const implementResponse = await helper.makeAuthenticatedRequest(
      'POST',
      `/controls/${controlId}/implement`,
      {
        implementationDate: new Date().toISOString(),
        implementationNotes: 'Control implemented successfully',
      }
    );
    expect(implementResponse.status()).toBe(200);

    // Test control testing
    const testResponse = await helper.makeAuthenticatedRequest(
      'POST',
      `/controls/${controlId}/test`,
      {
        testDate: new Date().toISOString(),
        testResult: 'Effective',
        testNotes: 'Control test passed',
        evidence: 'Test evidence',
      }
    );
    expect(testResponse.status()).toBe(200);

    // Get control effectiveness
    const effectivenessResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/controls/${controlId}/effectiveness`
    );
    expect(effectivenessResponse.status()).toBe(200);

    const effectiveness = await effectivenessResponse.json();
    expect(effectiveness.score).toBeDefined();
    expect(effectiveness.trend).toBeDefined();

    // Cleanup
    await helper.makeAuthenticatedRequest('DELETE', `/controls/${controlId}`);
  });

  test('Control-Risk mapping', async () => {
    // Create a risk first
    const riskData = {
      title: 'Test Risk for Mapping',
      description: 'Risk to be mapped to control',
      category: 'Operational',
      probability: 'High',
      impact: 'Medium',
    };

    const riskResponse = await helper.makeAuthenticatedRequest('POST', '/risks', riskData);
    const risk = await riskResponse.json();

    // Create a control
    const controlData = {
      title: 'Test Control for Mapping',
      description: 'Control to be mapped to risk',
      type: 'Detective',
      category: 'Monitoring',
    };

    const controlResponse = await helper.makeAuthenticatedRequest('POST', '/controls', controlData);
    const control = await controlResponse.json();

    // Map control to risk
    const mappingResponse = await helper.makeAuthenticatedRequest(
      'POST',
      `/risks/${risk.id}/controls`,
      {
        controlId: control.id,
        mappingType: 'MITIGATES',
        effectiveness: 'High',
      }
    );
    expect(mappingResponse.status()).toBe(201);

    // Verify mapping
    const riskWithControlsResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/risks/${risk.id}?include=controls`
    );
    expect(riskWithControlsResponse.status()).toBe(200);

    const riskWithControls = await riskWithControlsResponse.json();
    expect(riskWithControls.controls).toBeDefined();
    expect(riskWithControls.controls.some((c: any) => c.id === control.id)).toBe(true);

    // Cleanup
    await helper.makeAuthenticatedRequest('DELETE', `/risks/${risk.id}`);
    await helper.makeAuthenticatedRequest('DELETE', `/controls/${control.id}`);
  });
});

test.describe('Document Management API Integration', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test.afterEach(async () => {
    await helper.cleanup();
  });

  test('Document upload and download workflow', async () => {
    // Create test file content
    const testContent = 'This is a test document for API integration testing';
    const testFile = Buffer.from(testContent);

    // Upload document
    const uploadResponse = await helper.page.request.post(`${API_BASE_URL}/documents/upload`, {
      headers: {
        Authorization: `Bearer ${helper.authToken}`,
      },
      multipart: {
        file: {
          name: 'test-document.txt',
          mimeType: 'text/plain',
          buffer: testFile,
        },
        metadata: JSON.stringify({
          title: 'Test Document',
          description: 'API integration test document',
          category: 'policy',
          tags: ['test', 'api', 'integration'],
        }),
      },
    });

    expect(uploadResponse.status()).toBe(201);

    const uploadedDoc = await uploadResponse.json();
    expect(uploadedDoc.id).toBeDefined();
    expect(uploadedDoc.title).toBe('Test Document');

    const documentId = uploadedDoc.id;

    // Get document metadata
    const metadataResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/documents/${documentId}`
    );
    expect(metadataResponse.status()).toBe(200);

    const metadata = await metadataResponse.json();
    expect(metadata.title).toBe('Test Document');
    expect(metadata.category).toBe('policy');

    // Download document
    const downloadResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/documents/${documentId}/download`
    );
    expect(downloadResponse.status()).toBe(200);

    const downloadedContent = await downloadResponse.text();
    expect(downloadedContent).toBe(testContent);

    // Search documents
    const searchResponse = await helper.makeAuthenticatedRequest('GET', '/documents?search=test');
    expect(searchResponse.status()).toBe(200);

    const searchResults = await searchResponse.json();
    const documents = searchResults.data || searchResults;
    expect(documents.some((d: any) => d.id === documentId)).toBe(true);

    // Delete document
    const deleteResponse = await helper.makeAuthenticatedRequest(
      'DELETE',
      `/documents/${documentId}`
    );
    expect(deleteResponse.status()).toBe(200);
  });

  test('Document version management', async () => {
    const testContent1 = 'Version 1 of test document';
    const testContent2 = 'Version 2 of test document';

    // Upload initial version
    const uploadResponse = await helper.page.request.post(`${API_BASE_URL}/documents/upload`, {
      headers: {
        Authorization: `Bearer ${helper.authToken}`,
      },
      multipart: {
        file: {
          name: 'versioned-doc.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from(testContent1),
        },
        metadata: JSON.stringify({
          title: 'Versioned Document',
          description: 'Document with version control',
          category: 'procedure',
        }),
      },
    });

    const document = await uploadResponse.json();
    const documentId = document.id;

    // Upload new version
    const versionResponse = await helper.page.request.post(
      `${API_BASE_URL}/documents/${documentId}/versions`,
      {
        headers: {
          Authorization: `Bearer ${helper.authToken}`,
        },
        multipart: {
          file: {
            name: 'versioned-doc.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from(testContent2),
          },
          changelog: 'Updated content for version 2',
        },
      }
    );

    expect(versionResponse.status()).toBe(201);

    // Get version history
    const versionsResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/documents/${documentId}/versions`
    );
    expect(versionsResponse.status()).toBe(200);

    const versions = await versionsResponse.json();
    expect(versions.length).toBe(2);
    expect(versions[0].version).toBe(2);
    expect(versions[1].version).toBe(1);

    // Download specific version
    const version1Response = await helper.makeAuthenticatedRequest(
      'GET',
      `/documents/${documentId}/versions/1/download`
    );
    expect(version1Response.status()).toBe(200);

    const version1Content = await version1Response.text();
    expect(version1Content).toBe(testContent1);

    // Cleanup
    await helper.makeAuthenticatedRequest('DELETE', `/documents/${documentId}`);
  });
});

test.describe('Reporting API Integration', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test.afterEach(async () => {
    await helper.cleanup();
  });

  test('Report generation workflow', async () => {
    // Create test data for report
    const riskData = {
      title: 'Risk for Report',
      description: 'Risk data for report generation',
      category: 'Operational',
      probability: 'High',
      impact: 'Medium',
    };

    const riskResponse = await helper.makeAuthenticatedRequest('POST', '/risks', riskData);
    const risk = await riskResponse.json();

    // Generate risk assessment report
    const reportRequest = {
      type: 'RISK_ASSESSMENT',
      title: 'API Integration Risk Report',
      description: 'Report generated for API integration testing',
      parameters: {
        includeRisks: true,
        includeControls: true,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          end: new Date().toISOString(),
        },
      },
    };

    const generateResponse = await helper.makeAuthenticatedRequest(
      'POST',
      '/reports/generate',
      reportRequest
    );
    expect(generateResponse.status()).toBe(201);

    const report = await generateResponse.json();
    expect(report.id).toBeDefined();
    expect(report.status).toBe('GENERATING');

    const reportId = report.id;

    // Poll for report completion
    let attempts = 0;
    let reportStatus = 'GENERATING';
    while (reportStatus === 'GENERATING' && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await helper.makeAuthenticatedRequest(
        'GET',
        `/reports/${reportId}/status`
      );
      const statusData = await statusResponse.json();
      reportStatus = statusData.status;
      attempts++;
    }

    expect(reportStatus).toBe('COMPLETED');

    // Get completed report
    const completedReportResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/reports/${reportId}`
    );
    expect(completedReportResponse.status()).toBe(200);

    const completedReport = await completedReportResponse.json();
    expect(completedReport.data).toBeDefined();
    expect(completedReport.data.risks).toBeDefined();

    // Export report as PDF
    const exportResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/reports/${reportId}/export/pdf`
    );
    expect(exportResponse.status()).toBe(200);

    const pdfBuffer = await exportResponse.body();
    expect(pdfBuffer).toBeTruthy();
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Cleanup
    await helper.makeAuthenticatedRequest('DELETE', `/reports/${reportId}`);
    await helper.makeAuthenticatedRequest('DELETE', `/risks/${risk.id}`);
  });

  test('Report templates and customization', async () => {
    // Get available report templates
    const templatesResponse = await helper.makeAuthenticatedRequest('GET', '/reports/templates');
    expect(templatesResponse.status()).toBe(200);

    const templates = await templatesResponse.json();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);

    // Create custom template
    const customTemplate = {
      name: 'Custom API Test Template',
      type: 'RISK_ASSESSMENT',
      description: 'Custom template created for API testing',
      configuration: {
        sections: ['executive_summary', 'risk_matrix', 'recommendations'],
        styling: {
          theme: 'professional',
          includeCharts: true,
          includeLogos: true,
        },
      },
    };

    const createTemplateResponse = await helper.makeAuthenticatedRequest(
      'POST',
      '/reports/templates',
      customTemplate
    );
    expect(createTemplateResponse.status()).toBe(201);

    const createdTemplate = await createTemplateResponse.json();
    expect(createdTemplate.id).toBeDefined();

    // Use custom template for report generation
    const reportWithTemplate = {
      type: 'RISK_ASSESSMENT',
      title: 'Report with Custom Template',
      templateId: createdTemplate.id,
      parameters: {
        includeExecutiveSummary: true,
        includeRiskMatrix: true,
      },
    };

    const templateReportResponse = await helper.makeAuthenticatedRequest(
      'POST',
      '/reports/generate',
      reportWithTemplate
    );
    expect(templateReportResponse.status()).toBe(201);

    // Cleanup
    await helper.makeAuthenticatedRequest('DELETE', `/reports/templates/${createdTemplate.id}`);
  });
});

test.describe('AI Integration API', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test('AI chat functionality', async () => {
    const chatRequest = {
      message: 'What are the top cybersecurity risks for my organization?',
      context: 'risk-analysis',
    };

    const chatResponse = await helper.makeAuthenticatedRequest('POST', '/ai/chat', chatRequest);
    expect(chatResponse.status()).toBe(200);

    const response = await chatResponse.json();
    expect(response.message).toBeDefined();
    expect(response.sessionId).toBeDefined();
    expect(response.message.length).toBeGreaterThan(0);
  });

  test('AI risk analysis', async () => {
    const analysisRequest = {
      type: 'risk-assessment',
      data: {
        industry: 'Technology',
        size: 'Medium',
        geography: 'United States',
      },
    };

    const analysisResponse = await helper.makeAuthenticatedRequest(
      'POST',
      '/ai/analyze',
      analysisRequest
    );
    expect(analysisResponse.status()).toBe(200);

    const analysis = await analysisResponse.json();
    expect(analysis.risks).toBeDefined();
    expect(Array.isArray(analysis.risks)).toBe(true);
    expect(analysis.recommendations).toBeDefined();
  });

  test('AI document analysis', async () => {
    const testContent =
      'This is a security policy document that outlines access controls and data protection measures';

    const docAnalysisRequest = {
      content: testContent,
      type: 'policy_analysis',
      extractRisks: true,
      extractControls: true,
    };

    const docAnalysisResponse = await helper.makeAuthenticatedRequest(
      'POST',
      '/ai/document/analyze',
      docAnalysisRequest
    );
    expect(docAnalysisResponse.status()).toBe(200);

    const analysis = await docAnalysisResponse.json();
    expect(analysis.extractedRisks).toBeDefined();
    expect(analysis.extractedControls).toBeDefined();
    expect(analysis.summary).toBeDefined();
  });

  test('AI conversation history', async () => {
    // Start a conversation
    const message1 = await helper.makeAuthenticatedRequest('POST', '/ai/chat', {
      message: 'What is risk assessment?',
      context: 'general',
    });

    const response1 = await message1.json();
    const sessionId = response1.sessionId;

    // Continue conversation
    const message2 = await helper.makeAuthenticatedRequest('POST', '/ai/chat', {
      message: 'How often should I perform risk assessments?',
      sessionId: sessionId,
      context: 'general',
    });

    expect(message2.status()).toBe(200);

    // Get conversation history
    const historyResponse = await helper.makeAuthenticatedRequest(
      'GET',
      `/ai/conversations/${sessionId}`
    );
    expect(historyResponse.status()).toBe(200);

    const history = await historyResponse.json();
    expect(history.messages).toBeDefined();
    expect(history.messages.length).toBe(4); // 2 user messages + 2 AI responses
  });
});

test.describe('API Error Handling and Edge Cases', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test('Authentication error handling', async () => {
    // Test invalid token
    const invalidResponse = await helper.page.request.get(`${API_BASE_URL}/risks`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });
    expect(invalidResponse.status()).toBe(401);

    // Test expired token simulation
    const expiredResponse = await helper.page.request.get(`${API_BASE_URL}/risks`, {
      headers: {
        Authorization: 'Bearer expired-token-simulation',
      },
    });
    expect(expiredResponse.status()).toBe(401);
  });

  test('Validation error handling', async () => {
    // Test missing required fields
    const invalidRisk = {
      description: 'Risk without title',
    };

    const response = await helper.makeAuthenticatedRequest('POST', '/risks', invalidRisk);
    expect(response.status()).toBe(400);

    const errorData = await response.json();
    expect(errorData.errors).toBeDefined();
    expect(errorData.errors.title).toBeDefined();
  });

  test('Resource not found handling', async () => {
    const nonExistentId = 'non-existent-id-12345';

    const response = await helper.makeAuthenticatedRequest('GET', `/risks/${nonExistentId}`);
    expect(response.status()).toBe(404);

    const errorData = await response.json();
    expect(errorData.error).toBeDefined();
    expect(errorData.error.toLowerCase()).toContain('not found');
  });

  test('Rate limiting handling', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(helper.makeAuthenticatedRequest('GET', '/risks'));
    }

    const responses = await Promise.all(promises);

    // Check if any responses are rate limited (429)
    const rateLimitedResponses = responses.filter((r) => r.status() === 429);

    if (rateLimitedResponses.length > 0) {
      // Verify rate limit response includes appropriate headers
      const rateLimitResponse = rateLimitedResponses[0];
      const headers = rateLimitResponse.headers();

      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['retry-after']).toBeDefined();
    }
  });

  test('File size limit handling', async () => {
    // Create a large file buffer (exceed typical limits)
    const largeFile = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB

    const uploadResponse = await helper.page.request.post(`${API_BASE_URL}/documents/upload`, {
      headers: {
        Authorization: `Bearer ${helper.authToken}`,
      },
      multipart: {
        file: {
          name: 'large-file.txt',
          mimeType: 'text/plain',
          buffer: largeFile,
        },
        metadata: JSON.stringify({
          title: 'Large File Test',
          category: 'test',
        }),
      },
    });

    // Should return 413 (Payload Too Large) or 400 (Bad Request)
    expect([400, 413]).toContain(uploadResponse.status());

    const errorData = await uploadResponse.json();
    expect(errorData.error.toLowerCase()).toContain('size');
  });

  test('Concurrent request handling', async () => {
    // Test concurrent creation of similar resources
    const riskData = {
      title: 'Concurrent Test Risk',
      description: 'Testing concurrent operations',
      category: 'Operational',
      probability: 'Medium',
      impact: 'Medium',
    };

    const promises = [];
    for (let i = 0; i < 5; i++) {
      const data = { ...riskData, title: `${riskData.title} ${i}` };
      promises.push(helper.makeAuthenticatedRequest('POST', '/risks', data));
    }

    const responses = await Promise.all(promises);

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.status()).toBe(201);
    });

    // Verify all risks were created with unique IDs
    const createdRisks = await Promise.all(responses.map((r) => r.json()));
    const uniqueIds = new Set(createdRisks.map((r) => r.id));
    expect(uniqueIds.size).toBe(5);

    // Cleanup
    for (const risk of createdRisks) {
      await helper.makeAuthenticatedRequest('DELETE', `/risks/${risk.id}`);
    }
  });
});

test.describe('API Performance and Load Testing', () => {
  let helper: APITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new APITestHelper(page);
    await helper.authenticate();
  });

  test.setTimeout(60000); // Extended timeout for performance tests

  test('API response times are within acceptable limits', async () => {
    const endpoints = ['/risks', '/controls', '/documents', '/reports', '/dashboard/metrics'];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await helper.makeAuthenticatedRequest('GET', endpoint);
      const endTime = Date.now();

      expect(response.status()).toBe(200);

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds

      // console.log(`${endpoint} response time: ${responseTime}ms`);
    }
  });

  test('Pagination performance with large datasets', async () => {
    // Test pagination with different page sizes
    const pageSizes = [10, 50, 100];

    for (const pageSize of pageSizes) {
      const startTime = Date.now();
      const response = await helper.makeAuthenticatedRequest(
        'GET',
        `/risks?page=1&limit=${pageSize}`
      );
      const endTime = Date.now();

      expect(response.status()).toBe(200);

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(3000);

      const data = await response.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(pageSize);

      // console.log(`Page size ${pageSize} response time: ${responseTime}ms`);
    }
  });

  test('Search performance with complex queries', async () => {
    const searchQueries = [
      'cybersecurity',
      'operational risk',
      'compliance framework',
      'data protection',
    ];

    for (const query of searchQueries) {
      const startTime = Date.now();
      const response = await helper.makeAuthenticatedRequest(
        'GET',
        `/risks?search=${encodeURIComponent(query)}`
      );
      const endTime = Date.now();

      expect(response.status()).toBe(200);

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000);

      // console.log(`Search "${query}" response time: ${responseTime}ms`);
    }
  });

  test('Bulk operations performance', async () => {
    // Test bulk creation
    const bulkRisks = [];
    for (let i = 0; i < 10; i++) {
      bulkRisks.push({
        title: `Bulk Risk ${i}`,
        description: `Description for bulk risk ${i}`,
        category: 'Operational',
        probability: 'Medium',
        impact: 'Medium',
      });
    }

    const startTime = Date.now();
    const bulkResponse = await helper.makeAuthenticatedRequest('POST', '/risks/bulk', {
      risks: bulkRisks,
    });
    const endTime = Date.now();

    expect(bulkResponse.status()).toBe(201);

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(5000); // Bulk operations can take longer

    const createdRisks = await bulkResponse.json();
    expect(createdRisks.length).toBe(10);

    // console.log(`Bulk creation of 10 risks: ${responseTime}ms`);

    // Cleanup
    for (const risk of createdRisks) {
      await helper.makeAuthenticatedRequest('DELETE', `/risks/${risk.id}`);
    }
  });
});
