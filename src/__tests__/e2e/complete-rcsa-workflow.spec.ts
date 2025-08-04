/**
 * Complete RCSA Workflow End-to-End Test
 * Tests the entire user journey from registration to report generation
 */

import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import path from 'path';

// Test data factory
const createTestData = () => ({
  user: {
    email: faker.internet.email(),
    password: 'SecurePassword123!',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    company: faker.company.name(),
  },
  risk: {
    title: `${faker.company.buzzPhrase()} Risk`,
    description: faker.lorem.paragraph(),
    category: 'operational',
    likelihood: Math.floor(Math.random() * 5) + 1,
    impact: {
      financial: Math.floor(Math.random() * 5) + 1,
      operational: Math.floor(Math.random() * 5) + 1,
      reputational: Math.floor(Math.random() * 5) + 1,
      regulatory: Math.floor(Math.random() * 5) + 1,
    },
  },
  control: {
    name: `${faker.company.buzzAdjective()} Control`,
    description: faker.lorem.sentence(),
    type: 'preventive',
    frequency: 'monthly',
  },
});

// Page Object Model for better maintainability
class RiscuraApp {
  constructor(public page: Page) {}

  // Authentication flows
  async registerUser(userData: any) {
    await this.page.goto('/auth/register');

    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password);
    await this.page.fill('[data-testid="first-name-input"]', userData.firstName);
    await this.page.fill('[data-testid="last-name-input"]', userData.lastName);
    await this.page.fill('[data-testid="company-input"]', userData.company);

    await this.page.click('[data-testid="register-button"]');

    // Wait for email verification step
    await expect(this.page.locator('[data-testid="verification-message"]')).toBeVisible();
  }

  async loginUser(email: string, password: string) {
    await this.page.goto('/auth/login');

    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await expect(this.page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(this.page.url()).toContain('/dashboard');
  }

  // Organization setup
  async completeOrganizationSetup(companyData: any) {
    // Check if organization setup is required
    if (await this.page.locator('[data-testid="organization-setup"]').isVisible()) {
      await this.page.fill('[data-testid="organization-name"]', companyData.company);
      await this.page.selectOption('[data-testid="industry-select"]', 'financial-services');
      await this.page.selectOption('[data-testid="size-select"]', 'medium');
      await this.page.click('[data-testid="complete-setup-button"]');

      await expect(this.page.locator('[data-testid="setup-success"]')).toBeVisible();
    }
  }

  // RCSA Assessment creation and management
  async createRCSAAssessment(assessmentName: string) {
    await this.page.click('[data-testid="risks-menu"]');
    await this.page.click('[data-testid="new-rcsa-button"]');

    await this.page.fill('[data-testid="assessment-name"]', assessmentName);
    await this.page.fill(
      '[data-testid="assessment-description"]',
      'Comprehensive risk assessment for testing'
    );
    await this.page.selectOption('[data-testid="assessment-scope"]', 'business-unit');

    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    await this.page.fill('[data-testid="start-date"]', currentDate.toISOString().split('T')[0]);
    await this.page.fill('[data-testid="end-date"]', futureDate.toISOString().split('T')[0]);

    await this.page.click('[data-testid="create-assessment-button"]');

    // Wait for assessment creation confirmation
    await expect(this.page.locator('[data-testid="assessment-created"]')).toBeVisible();

    // Get the assessment ID from URL or element
    const assessmentId = await this.page.locator('[data-testid="assessment-id"]').textContent();
    return assessmentId!;
  }

  // Document upload and AI analysis
  async uploadAndAnalyzeDocument(filePath: string) {
    await this.page.click('[data-testid="documents-tab"]');
    await this.page.click('[data-testid="upload-document-button"]');

    // Upload file
    const fileInput = this.page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(filePath);

    await this.page.fill('[data-testid="document-title"]', 'Test Policy Document');
    await this.page.selectOption('[data-testid="document-type"]', 'policy');
    await this.page.click('[data-testid="upload-submit-button"]');

    // Wait for upload completion
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible();

    // Trigger AI analysis
    await this.page.click('[data-testid="analyze-document-button"]');

    // Wait for AI analysis to complete (with timeout)
    await expect(this.page.locator('[data-testid="analysis-complete"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify AI-generated insights are displayed
    await expect(this.page.locator('[data-testid="ai-insights"]')).toBeVisible();
  }

  // Risk management
  async createRisk(riskData: any) {
    await this.page.click('[data-testid="risks-tab"]');
    await this.page.click('[data-testid="add-risk-button"]');

    await this.page.fill('[data-testid="risk-title"]', riskData.title);
    await this.page.fill('[data-testid="risk-description"]', riskData.description);
    await this.page.selectOption('[data-testid="risk-category"]', riskData.category);

    // Set likelihood
    await this.page.click(`[data-testid="likelihood-${riskData.likelihood}"]`);

    // Set impact scores
    await this.page.click(`[data-testid="financial-impact-${riskData.impact.financial}"]`);
    await this.page.click(`[data-testid="operational-impact-${riskData.impact.operational}"]`);
    await this.page.click(`[data-testid="reputational-impact-${riskData.impact.reputational}"]`);
    await this.page.click(`[data-testid="regulatory-impact-${riskData.impact.regulatory}"]`);

    await this.page.click('[data-testid="save-risk-button"]');

    // Verify risk is created and risk score is calculated
    await expect(this.page.locator('[data-testid="risk-saved"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="risk-score"]')).toBeVisible();

    const riskId = await this.page.locator('[data-testid="risk-id"]').textContent();
    return riskId!;
  }

  // Control management
  async createControl(controlData: any, riskId: string) {
    await this.page.click('[data-testid="controls-tab"]');
    await this.page.click('[data-testid="add-control-button"]');

    await this.page.fill('[data-testid="control-name"]', controlData.name);
    await this.page.fill('[data-testid="control-description"]', controlData.description);
    await this.page.selectOption('[data-testid="control-type"]', controlData.type);
    await this.page.selectOption('[data-testid="control-frequency"]', controlData.frequency);

    // Link control to risk
    await this.page.click('[data-testid="link-risks-button"]');
    await this.page.check(`[data-testid="risk-checkbox-${riskId}"]`);
    await this.page.click('[data-testid="confirm-risk-links"]');

    await this.page.click('[data-testid="save-control-button"]');

    await expect(this.page.locator('[data-testid="control-saved"]')).toBeVisible();

    const controlId = await this.page.locator('[data-testid="control-id"]').textContent();
    return controlId!;
  }

  // Control testing
  async performControlTesting(controlId: string) {
    await this.page.click(`[data-testid="test-control-${controlId}"]`);

    // Fill in test details
    await this.page.fill(
      '[data-testid="test-description"]',
      'Comprehensive control testing performed'
    );
    await this.page.selectOption('[data-testid="test-method"]', 'inspection');
    await this.page.selectOption('[data-testid="test-result"]', 'effective');
    await this.page.fill(
      '[data-testid="test-notes"]',
      'Control operating as designed with no exceptions noted'
    );

    // Set effectiveness rating
    await this.page.click('[data-testid="effectiveness-4"]'); // Highly effective

    await this.page.click('[data-testid="save-test-results"]');

    await expect(this.page.locator('[data-testid="test-saved"]')).toBeVisible();

    // Verify control effectiveness is updated
    await expect(this.page.locator('[data-testid="control-effectiveness"]')).toContainText(
      'Effective'
    );
  }

  // Compliance framework mapping
  async mapToComplianceFramework() {
    await this.page.click('[data-testid="compliance-tab"]');
    await this.page.click('[data-testid="map-frameworks-button"]');

    // Select compliance frameworks
    await this.page.check('[data-testid="framework-iso27001"]');
    await this.page.check('[data-testid="framework-soc2"]');

    await this.page.click('[data-testid="auto-map-controls"]');

    // Wait for auto-mapping to complete
    await expect(this.page.locator('[data-testid="mapping-complete"]')).toBeVisible();

    // Verify mappings are created
    await expect(this.page.locator('[data-testid="mapped-controls"]')).toBeVisible();
  }

  // Report generation and export
  async generateAssessmentReport(): Promise<string> {
    await this.page.click('[data-testid="reports-tab"]');
    await this.page.click('[data-testid="generate-report-button"]');

    // Configure report settings
    await this.page.check('[data-testid="include-executive-summary"]');
    await this.page.check('[data-testid="include-risk-register"]');
    await this.page.check('[data-testid="include-control-matrix"]');
    await this.page.check('[data-testid="include-compliance-mapping"]');

    await this.page.selectOption('[data-testid="report-format"]', 'pdf');

    await this.page.click('[data-testid="generate-report-confirm"]');

    // Wait for report generation (with timeout for large reports)
    await expect(this.page.locator('[data-testid="report-generating"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="report-ready"]')).toBeVisible({ timeout: 60000 });

    // Verify download link is available
    await expect(this.page.locator('[data-testid="download-report"]')).toBeVisible();

    const reportUrl = await this.page
      .locator('[data-testid="download-report"]')
      .getAttribute('href');
    if (!reportUrl) {
      throw new Error('Report URL not found');
    }
    return reportUrl;
  }

  // Stakeholder sharing
  async shareReportWithStakeholders(emails: string[]) {
    await this.page.click('[data-testid="share-report-button"]');

    // Add stakeholder emails
    for (const email of emails) {
      await this.page.fill('[data-testid="stakeholder-email"]', email);
      await this.page.click('[data-testid="add-stakeholder"]');
    }

    await this.page.fill(
      '[data-testid="share-message"]',
      'Please review the attached RCSA assessment report.'
    );
    await this.page.click('[data-testid="send-report"]');

    await expect(this.page.locator('[data-testid="report-shared"]')).toBeVisible();
  }
}

// Main test suite
test.describe('Complete RCSA Workflow - End to End', () => {
  let app: RiscuraApp;
  let testData: ReturnType<typeof createTestData>;

  test.beforeEach(async ({ page }) => {
    app = new RiscuraApp(page);
    testData = createTestData();
  });

  test('User can complete full RCSA assessment lifecycle', async () => {
    test.setTimeout(300000); // 5 minutes for complete workflow

    // Step 1: User Registration and Email Verification
    await test.step('Register new user', async () => {
      await app.registerUser(testData.user);

      // Note: In real test, you'd verify email and activate account
      // For testing, we'll assume email verification is handled
    });

    // Step 2: User Login
    await test.step('Login user', async () => {
      await app.loginUser(testData.user.email, testData.user.password);
    });

    // Step 3: Organization Setup
    await test.step('Complete organization setup', async () => {
      await app.completeOrganizationSetup(testData.user);
    });

    // Step 4: Create New RCSA Assessment
    let assessmentId: string;
    await test.step('Create RCSA assessment', async () => {
      assessmentId = await app.createRCSAAssessment('Q1 2024 RCSA Assessment');
      expect(assessmentId).toBeTruthy();
    });

    // Step 5: Upload and Analyze Documents
    await test.step('Upload and analyze documents', async () => {
      // Create a test document for upload
      const testDocPath = path.join(__dirname, '../fixtures/test-policy.pdf');
      await app.uploadAndAnalyzeDocument(testDocPath);
    });

    // Step 6: Define Risks
    let riskId: string;
    await test.step('Create risk assessment', async () => {
      riskId = await app.createRisk(testData.risk);
      expect(riskId).toBeTruthy();
    });

    // Step 7: Define and Link Controls
    let controlId: string;
    await test.step('Create and link controls', async () => {
      controlId = await app.createControl(testData.control, riskId);
      expect(controlId).toBeTruthy();
    });

    // Step 8: Perform Control Testing
    await test.step('Perform control testing', async () => {
      await app.performControlTesting(controlId);
    });

    // Step 9: Map Controls to Compliance Frameworks
    await test.step('Map to compliance frameworks', async () => {
      await app.mapToComplianceFramework();
    });

    // Step 10: Generate Assessment Report
    let reportUrl: string;
    await test.step('Generate assessment report', async () => {
      reportUrl = await app.generateAssessmentReport();
      expect(reportUrl).toBeTruthy();
    });

    // Step 11: Share Report with Stakeholders
    await test.step('Share report with stakeholders', async () => {
      const stakeholderEmails = ['ceo@example.com', 'cro@example.com', 'compliance@example.com'];
      await app.shareReportWithStakeholders(stakeholderEmails);
    });
  });

  test('Can handle multiple RCSA assessments concurrently', async () => {
    // Test concurrent assessment creation and management
    await app.loginUser(testData.user.email, testData.user.password);

    const assessmentPromises = [];
    for (let i = 0; i < 3; i++) {
      assessmentPromises.push(app.createRCSAAssessment(`Concurrent Assessment ${i + 1}`));
    }

    const assessmentIds = await Promise.all(assessmentPromises);
    expect(assessmentIds).toHaveLength(3);
    assessmentIds.forEach((id) => expect(id).toBeTruthy());
  });

  test('Can recover from workflow interruptions', async () => {
    // Test workflow recovery after browser refresh or connection loss
    await app.loginUser(testData.user.email, testData.user.password);

    const assessmentId = await app.createRCSAAssessment('Interrupted Assessment');

    // Simulate page refresh
    await app.page.reload();

    // Verify user can continue where they left off
    await expect(app.page.locator(`[data-testid="assessment-${assessmentId}"]`)).toBeVisible();
  });
});

// Test data validation and error handling
test.describe('Workflow Error Handling', () => {
  let app: RiscuraApp;

  test.beforeEach(async ({ page }) => {
    app = new RiscuraApp(page);
  });

  test('Handles invalid file uploads gracefully', async () => {
    const testData = createTestData();
    await app.loginUser(testData.user.email, testData.user.password);

    // Try to upload invalid file type
    const invalidFilePath = path.join(__dirname, '../fixtures/invalid-file.txt');

    await expect(async () => {
      await app.uploadAndAnalyzeDocument(invalidFilePath);
    }).toThrowError(); // Should handle invalid file type
  });

  test('Validates required fields in risk creation', async () => {
    const testData = createTestData();
    await app.loginUser(testData.user.email, testData.user.password);

    // Try to create risk with missing required fields
    const incompleteRiskData = { ...testData.risk, title: '' };

    await expect(async () => {
      await app.createRisk(incompleteRiskData);
    }).toThrowError(); // Should validate required fields
  });
});

export { RiscuraApp, createTestData };
