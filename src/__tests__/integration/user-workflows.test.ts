// End-to-End User Workflow Integration Tests
import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

// Test user data
const TEST_USER = {
  email: 'workflow-test@riscura.com',
  password: 'WorkflowTest123!',
  name: 'Workflow Test User',
  role: 'RISK_MANAGER'
};

const TEST_ORGANIZATION = {
  name: 'Workflow Test Organization',
  industry: 'Technology',
  size: 'Medium'
};

class UserWorkflowHelper {
  constructor(public page: Page) {}

  // Authentication workflows
  async performLogin(email: string = TEST_USER.email, password: string = TEST_USER.password): Promise<void> {
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForLoadState('networkidle');

    // Check if login form is visible
    await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible();

    // Fill login credentials
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);

    // Submit login form
    await this.page.click('[data-testid="login-submit"]');

    // Wait for successful login and redirect
    await this.page.waitForURL(`${BASE_URL}/dashboard`, { timeout: TEST_TIMEOUT });
    
    // Verify dashboard is loaded
    await expect(this.page.locator('[data-testid="dashboard-container"]')).toBeVisible();
  }

  async performLogout(): Promise<void> {
    // Open user menu
    await this.page.click('[data-testid="user-menu-trigger"]');
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Click logout
    await this.page.click('[data-testid="logout-button"]');

    // Wait for redirect to login page
    await this.page.waitForURL(`${BASE_URL}/auth/login`, { timeout: TEST_TIMEOUT });
    await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible();
  }

  // Risk management workflows
  async createRisk(riskData: any): Promise<string> {
    // Navigate to risks page
    await this.page.goto(`${BASE_URL}/risks`);
    await this.page.waitForLoadState('networkidle');

    // Click create new risk button
    await this.page.click('[data-testid="create-risk-button"]');
    await expect(this.page.locator('[data-testid="risk-form"]')).toBeVisible();

    // Fill risk form
    await this.page.fill('[data-testid="risk-title-input"]', riskData.title);
    await this.page.fill('[data-testid="risk-description-input"]', riskData.description);
    await this.page.selectOption('[data-testid="risk-category-select"]', riskData.category);
    await this.page.selectOption('[data-testid="risk-likelihood-select"]', riskData.likelihood.toString());
    await this.page.selectOption('[data-testid="risk-impact-select"]', riskData.impact.toString());

    // Submit form
    await this.page.click('[data-testid="risk-submit-button"]');

    // Wait for success notification
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Extract risk ID from URL or response
    await this.page.waitForURL(/\/risks\/[a-zA-Z0-9]+/);
    const url = this.page.url();
    const riskId = url.split('/').pop()!;
    
    return riskId;
  }

  async createControl(controlData: any): Promise<string> {
    // Navigate to controls page
    await this.page.goto(`${BASE_URL}/controls`);
    await this.page.waitForLoadState('networkidle');

    // Click create new control button
    await this.page.click('[data-testid="create-control-button"]');
    await expect(this.page.locator('[data-testid="control-form"]')).toBeVisible();

    // Fill control form
    await this.page.fill('[data-testid="control-name-input"]', controlData.name);
    await this.page.fill('[data-testid="control-description-input"]', controlData.description);
    await this.page.selectOption('[data-testid="control-type-select"]', controlData.type);
    await this.page.selectOption('[data-testid="control-frequency-select"]', controlData.frequency);

    // Submit form
    await this.page.click('[data-testid="control-submit-button"]');

    // Wait for success notification
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Extract control ID
    await this.page.waitForURL(/\/controls\/[a-zA-Z0-9]+/);
    const url = this.page.url();
    const controlId = url.split('/').pop()!;
    
    return controlId;
  }

  async linkControlToRisk(controlId: string, riskId: string): Promise<void> {
    // Navigate to risk page
    await this.page.goto(`${BASE_URL}/risks/${riskId}`);
    await this.page.waitForLoadState('networkidle');

    // Open control linking dialog
    await this.page.click('[data-testid="link-controls-button"]');
    await expect(this.page.locator('[data-testid="control-selector-dialog"]')).toBeVisible();

    // Search and select control
    await this.page.fill('[data-testid="control-search-input"]', controlId);
    await this.page.click(`[data-testid="control-option-${controlId}"]`);
    await this.page.click('[data-testid="link-control-submit"]');

    // Wait for success notification
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Verify control is linked
    await expect(this.page.locator(`[data-testid="linked-control-${controlId}"]`)).toBeVisible();
  }

  // Document management workflows
  async uploadDocument(filePath: string, metadata: any): Promise<string> {
    // Navigate to documents page
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    // Click upload button
    await this.page.click('[data-testid="upload-document-button"]');
    await expect(this.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Fill metadata
    await this.page.fill('[data-testid="document-title-input"]', metadata.title);
    await this.page.fill('[data-testid="document-description-input"]', metadata.description);
    await this.page.selectOption('[data-testid="document-category-select"]', metadata.category);

    // Upload file
    await this.page.setInputFiles('[data-testid="file-input"]', filePath);

    // Submit form
    await this.page.click('[data-testid="upload-submit-button"]');

    // Wait for upload completion
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });

    // Extract document ID
    const documentId = await this.page.getAttribute('[data-testid="uploaded-document"]', 'data-document-id');
    return documentId!;
  }

  // Reporting workflows
  async generateReport(reportType: string, parameters: any): Promise<void> {
    // Navigate to reports page
    await this.page.goto(`${BASE_URL}/reports`);
    await this.page.waitForLoadState('networkidle');

    // Click create report button
    await this.page.click('[data-testid="create-report-button"]');
    await expect(this.page.locator('[data-testid="report-builder"]')).toBeVisible();

    // Select report type
    await this.page.selectOption('[data-testid="report-type-select"]', reportType);

    // Configure parameters
    if (parameters.dateRange) {
      await this.page.fill('[data-testid="date-from-input"]', parameters.dateRange.from);
      await this.page.fill('[data-testid="date-to-input"]', parameters.dateRange.to);
    }

    if (parameters.includeRisks) {
      await this.page.check('[data-testid="include-risks-checkbox"]');
    }

    if (parameters.includeControls) {
      await this.page.check('[data-testid="include-controls-checkbox"]');
    }

    // Generate report
    await this.page.click('[data-testid="generate-report-button"]');

    // Wait for report generation
    await expect(this.page.locator('[data-testid="report-generated"]')).toBeVisible({ timeout: 60000 });
  }

  async exportReportToPDF(): Promise<void> {
    // Click export button
    await this.page.click('[data-testid="export-pdf-button"]');

    // Wait for download
    const downloadPromise = this.page.waitForEvent('download');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  }

  // AI-powered analysis workflows
  async runAIRiskAnalysis(documentId: string): Promise<void> {
    // Navigate to document
    await this.page.goto(`${BASE_URL}/documents/${documentId}`);
    await this.page.waitForLoadState('networkidle');

    // Click AI analysis button
    await this.page.click('[data-testid="ai-analysis-button"]');
    await expect(this.page.locator('[data-testid="ai-analysis-dialog"]')).toBeVisible();

    // Start analysis
    await this.page.click('[data-testid="start-analysis-button"]');

    // Wait for analysis completion
    await expect(this.page.locator('[data-testid="analysis-complete"]')).toBeVisible({ timeout: 120000 });

    // Verify analysis results
    await expect(this.page.locator('[data-testid="identified-risks"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="recommended-controls"]')).toBeVisible();
  }

  // Error handling and recovery
  async handleNetworkError(): Promise<void> {
    // Simulate network disconnect
    await this.page.context().setOffline(true);

    // Try to perform an action that requires network
    await this.page.click('[data-testid="create-risk-button"]');

    // Verify error message is shown
    await expect(this.page.locator('[data-testid="network-error-banner"]')).toBeVisible();

    // Reconnect network
    await this.page.context().setOffline(false);

    // Verify auto-retry works
    await expect(this.page.locator('[data-testid="network-error-banner"]')).not.toBeVisible({ timeout: 10000 });
  }

  // Performance and loading state verification
  async verifyLoadingStates(): Promise<void> {
    // Navigate to a page that shows loading states
    await this.page.goto(`${BASE_URL}/dashboard`);

    // Verify skeleton loading states appear
    await expect(this.page.locator('[data-testid="dashboard-skeleton"]')).toBeVisible();

    // Wait for content to load
    await this.page.waitForLoadState('networkidle');

    // Verify skeleton is replaced with actual content
    await expect(this.page.locator('[data-testid="dashboard-skeleton"]')).not.toBeVisible();
    await expect(this.page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  }

  // Mobile responsiveness verification
  async verifyMobileExperience(): Promise<void> {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });

    // Navigate to dashboard
    await this.page.goto(`${BASE_URL}/dashboard`);
    await this.page.waitForLoadState('networkidle');

    // Verify mobile navigation
    await expect(this.page.locator('[data-testid="mobile-menu-trigger"]')).toBeVisible();
    
    // Open mobile menu
    await this.page.click('[data-testid="mobile-menu-trigger"]');
    await expect(this.page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Verify responsive layout
    await expect(this.page.locator('[data-testid="dashboard-grid"]')).toHaveClass(/mobile/);
  }

  // Data persistence verification
  async verifyDataPersistence(riskId: string): Promise<void> {
    // Refresh page
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    // Navigate back to risk
    await this.page.goto(`${BASE_URL}/risks/${riskId}`);
    await this.page.waitForLoadState('networkidle');

    // Verify risk data is still present
    await expect(this.page.locator('[data-testid="risk-title"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="risk-description"]')).toBeVisible();
  }
}

test.describe('Complete User Workflow Integration Tests', () => {
  let helper: UserWorkflowHelper;
  let riskId: string;
  let controlId: string;
  let documentId: string;

  test.beforeEach(async ({ page }) => {
    helper = new UserWorkflowHelper(page);
  });

  test('Complete user journey: Login → Create Risk → Create Control → Link → Report → Logout', async () => {
    // Step 1: Login
    await helper.performLogin();

    // Step 2: Create a risk
    const riskData = {
      title: 'Integration Test Risk',
      description: 'This is a comprehensive integration test risk for workflow validation',
      category: 'operational',
      likelihood: 3,
      impact: 4
    };
    riskId = await helper.createRisk(riskData);
    expect(riskId).toBeTruthy();

    // Step 3: Create a control
    const controlData = {
      name: 'Integration Test Control',
      description: 'This is a test control for integration testing',
      type: 'preventive',
      frequency: 'monthly'
    };
    controlId = await helper.createControl(controlData);
    expect(controlId).toBeTruthy();

    // Step 4: Link control to risk
    await helper.linkControlToRisk(controlId, riskId);

    // Step 5: Generate and export report
    await helper.generateReport('risk_assessment', {
      dateRange: { from: '2024-01-01', to: '2024-12-31' },
      includeRisks: true,
      includeControls: true
    });
    await helper.exportReportToPDF();

    // Step 6: Logout
    await helper.performLogout();
  });

  test('Document management workflow with AI analysis', async () => {
    await helper.performLogin();

    // Upload a test document
    const testFilePath = './src/__tests__/fixtures/test-policy.pdf';
    const documentMetadata = {
      title: 'Test Policy Document',
      description: 'Integration test policy document',
      category: 'policy'
    };
    
    documentId = await helper.uploadDocument(testFilePath, documentMetadata);
    expect(documentId).toBeTruthy();

    // Run AI analysis on the document
    await helper.runAIRiskAnalysis(documentId);

    await helper.performLogout();
  });

  test('Error handling and recovery scenarios', async () => {
    await helper.performLogin();

    // Test network error handling
    await helper.handleNetworkError();

    // Test form validation errors
    await helper.page.goto(`${BASE_URL}/risks`);
    await helper.page.click('[data-testid="create-risk-button"]');
    
    // Submit empty form to trigger validation
    await helper.page.click('[data-testid="risk-submit-button"]');
    await expect(helper.page.locator('[data-testid="validation-error"]')).toBeVisible();

    // Test file upload limits
    await helper.page.goto(`${BASE_URL}/documents`);
    await helper.page.click('[data-testid="upload-document-button"]');
    
    // Try to upload oversized file (simulated)
    await helper.page.evaluate(() => {
      const input = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
      if (input) {
        // Simulate file size validation error
        const event = new Event('change');
        Object.defineProperty(event, 'target', {
          value: { files: [{ size: 200 * 1024 * 1024, name: 'large-file.pdf' }] }
        });
        input.dispatchEvent(event);
      }
    });
    
    await expect(helper.page.locator('[data-testid="file-size-error"]')).toBeVisible();

    await helper.performLogout();
  });

  test('Mobile responsiveness and touch interactions', async () => {
    await helper.performLogin();
    await helper.verifyMobileExperience();
    await helper.performLogout();
  });

  test('Performance and loading states verification', async () => {
    await helper.performLogin();
    await helper.verifyLoadingStates();
    await helper.performLogout();
  });

  test('Data persistence and state management', async () => {
    await helper.performLogin();

    // Create a risk and verify persistence
    const riskData = {
      title: 'Persistence Test Risk',
      description: 'Testing data persistence across page reloads',
      category: 'operational',
      likelihood: 2,
      impact: 3
    };
    const persistenceRiskId = await helper.createRisk(riskData);
    await helper.verifyDataPersistence(persistenceRiskId);

    await helper.performLogout();
  });

  test('Cross-browser compatibility validation', async () => {
    // This test would be run across different browser contexts
    await helper.performLogin();

    // Verify core functionality works across browsers
    const quickRiskData = {
      title: 'Cross-browser Test Risk',
      description: 'Testing cross-browser compatibility',
      category: 'technical',
      likelihood: 2,
      impact: 2
    };
    const crossBrowserRiskId = await helper.createRisk(quickRiskData);
    expect(crossBrowserRiskId).toBeTruthy();

    await helper.performLogout();
  });

  test('Concurrent user actions and race condition handling', async () => {
    await helper.performLogin();

         // Simulate rapid successive actions
     const promises: Promise<string>[] = [];
     for (let i = 0; i < 3; i++) {
       promises.push(
         helper.createRisk({
           title: `Concurrent Risk ${i + 1}`,
           description: `Testing concurrent creation ${i + 1}`,
           category: 'operational',
           likelihood: 2,
           impact: 2
         })
       );
     }

     // Wait for all to complete
     const riskIds = await Promise.all(promises);
     expect(riskIds).toHaveLength(3);
     riskIds.forEach(id => expect(id).toBeTruthy());

    await helper.performLogout();
  });

  test('Edge cases and boundary conditions', async () => {
    await helper.performLogin();

    // Test with maximum field lengths
    const maxLengthRiskData = {
      title: 'A'.repeat(200), // Assuming 200 is max title length
      description: 'B'.repeat(2000), // Assuming 2000 is max description length
      category: 'operational',
      likelihood: 5, // Maximum likelihood
      impact: 5 // Maximum impact
    };

    const edgeCaseRiskId = await helper.createRisk(maxLengthRiskData);
    expect(edgeCaseRiskId).toBeTruthy();

    // Test with special characters
    const specialCharRiskData = {
      title: 'Test Risk with Special Chars: !@#$%^&*()',
      description: 'Description with unicode: 测试 ñoël фыва',
      category: 'compliance',
      likelihood: 1,
      impact: 1
    };

    const specialCharRiskId = await helper.createRisk(specialCharRiskData);
    expect(specialCharRiskId).toBeTruthy();

    await helper.performLogout();
  });
});

test.describe('User Session Management', () => {
  let helper: UserWorkflowHelper;

  test.beforeEach(async ({ page }) => {
    helper = new UserWorkflowHelper(page);
  });

  test('Session timeout and auto-renewal', async () => {
    await helper.performLogin();

    // Simulate session near expiry
    await helper.page.evaluate(() => {
      // Mock session expiry warning
      localStorage.setItem('sessionWarning', 'true');
    });

    // Verify session warning appears
    await helper.page.reload();
    await expect(helper.page.locator('[data-testid="session-warning"]')).toBeVisible();

    // Verify session renewal works
    await helper.page.click('[data-testid="extend-session-button"]');
    await expect(helper.page.locator('[data-testid="session-warning"]')).not.toBeVisible();
  });

  test('Multi-tab session synchronization', async ({ context }) => {
    // Open second tab
    const secondPage = await context.newPage();
    const secondHelper = new UserWorkflowHelper(secondPage);

    // Login in first tab
    await helper.performLogin();

    // Verify second tab recognizes the session
    await secondPage.goto(`${BASE_URL}/dashboard`);
    await expect(secondPage.locator('[data-testid="dashboard-container"]')).toBeVisible();

    // Logout from first tab
    await helper.performLogout();

    // Verify second tab is also logged out
    await secondPage.reload();
    await secondPage.waitForURL(`${BASE_URL}/auth/login`);

    await secondPage.close();
  });
}); 