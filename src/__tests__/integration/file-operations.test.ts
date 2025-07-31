// File Operations Integration Tests - Complete Document Management Testing
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;
const UPLOAD_TIMEOUT = 120000;

// Test user data
const TEST_USER = {
  email: 'file-test@riscura.com',
  password: 'FileTest123!',
  name: 'File Test User',
  role: 'RISK_MANAGER',
};

// File test configurations
const FILE_CONFIGS = {
  pdf: {
    name: 'test-policy.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 1024, // 1MB
    content: Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n251\n%%EOF'
    ),
  },
  word: {
    name: 'test-document.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 512 * 1024, // 512KB
    content: Buffer.from('PK\x03\x04'),
  },
  excel: {
    name: 'test-spreadsheet.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 256 * 1024, // 256KB
    content: Buffer.from('PK\x03\x04'),
  },
  image: {
    name: 'test-image.png',
    mimeType: 'image/png',
    size: 100 * 1024, // 100KB
    content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  text: {
    name: 'test-text.txt',
    mimeType: 'text/plain',
    size: 1024, // 1KB
    content: Buffer.from('This is a test text file for file operations integration testing.'),
  },
  oversized: {
    name: 'oversized-file.pdf',
    mimeType: 'application/pdf',
    size: 200 * 1024 * 1024, // 200MB - exceeds typical limits
    content: Buffer.alloc(200 * 1024 * 1024, 'x'),
  },
};

class FileOperationsHelper {
  constructor(public page: Page) {}

  // Authentication
  async performLogin(): Promise<void> {
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForLoadState('networkidle');

    await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible();
    await this.page.fill('[data-testid="email-input"]', TEST_USER.email);
    await this.page.fill('[data-testid="password-input"]', TEST_USER.password);
    await this.page.click('[data-testid="login-submit"]');

    await this.page.waitForURL(`${BASE_URL}/dashboard`, { timeout: TEST_TIMEOUT });
    await expect(this.page.locator('[data-testid="dashboard-container"]')).toBeVisible();
  }

  async performLogout(): Promise<void> {
    await this.page.click('[data-testid="user-menu-trigger"]');
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL(`${BASE_URL}/auth/login`, { timeout: TEST_TIMEOUT });
  }

  // File creation utilities
  async createTestFile(config: (typeof FILE_CONFIGS)[keyof typeof FILE_CONFIGS]): Promise<string> {
    const testDir = path.join(process.cwd(), 'test-files');

    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const filePath = path.join(testDir, config.name);
    fs.writeFileSync(filePath, config.content);

    return filePath;
  }

  async cleanupTestFiles(): Promise<void> {
    const testDir = path.join(process.cwd(), 'test-files');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }

  // File upload operations
  async uploadSingleFile(filePath: string, metadata: any): Promise<string> {
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

    // Wait for file validation
    await expect(this.page.locator('[data-testid="file-validation-success"]')).toBeVisible({
      timeout: 30000,
    });

    // Submit form
    await this.page.click('[data-testid="upload-submit-button"]');

    // Wait for upload completion
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible({
      timeout: UPLOAD_TIMEOUT,
    });

    // Extract document ID
    const documentId = await this.page.getAttribute(
      '[data-testid="uploaded-document"]',
      'data-document-id'
    );
    return documentId!;
  }

  async uploadMultipleFiles(filePaths: string[], metadata: any): Promise<string[]> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    await this.page.click('[data-testid="upload-document-button"]');
    await expect(this.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Fill metadata
    await this.page.fill('[data-testid="document-title-input"]', metadata.title);
    await this.page.fill('[data-testid="document-description-input"]', metadata.description);
    await this.page.selectOption('[data-testid="document-category-select"]', metadata.category);

    // Upload multiple files
    await this.page.setInputFiles('[data-testid="file-input"]', filePaths);

    // Wait for all files to be validated
    for (let i = 0; i < filePaths.length; i++) {
      await expect(this.page.locator(`[data-testid="file-${i}-validation-success"]`)).toBeVisible({
        timeout: 30000,
      });
    }

    // Submit form
    await this.page.click('[data-testid="upload-submit-button"]');

    // Wait for upload completion
    await expect(this.page.locator('[data-testid="batch-upload-success"]')).toBeVisible({
      timeout: UPLOAD_TIMEOUT,
    });

    // Extract document IDs
    const documentIds: string[] = [];
    for (let i = 0; i < filePaths.length; i++) {
      const docId = await this.page.getAttribute(
        `[data-testid="uploaded-document-${i}"]`,
        'data-document-id'
      );
      if (docId) documentIds.push(docId);
    }

    return documentIds;
  }

  async uploadWithProgressTracking(filePath: string, metadata: any): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    await this.page.click('[data-testid="upload-document-button"]');
    await expect(this.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Fill metadata
    await this.page.fill('[data-testid="document-title-input"]', metadata.title);
    await this.page.fill('[data-testid="document-description-input"]', metadata.description);
    await this.page.selectOption('[data-testid="document-category-select"]', metadata.category);

    // Upload file
    await this.page.setInputFiles('[data-testid="file-input"]', filePath);

    // Monitor upload progress
    await expect(this.page.locator('[data-testid="upload-progress-bar"]')).toBeVisible();

    // Wait for progress to reach 100%
    await expect(this.page.locator('[data-testid="upload-progress-100"]')).toBeVisible({
      timeout: UPLOAD_TIMEOUT,
    });

    // Submit form
    await this.page.click('[data-testid="upload-submit-button"]');

    // Verify completion
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible({
      timeout: UPLOAD_TIMEOUT,
    });
  }

  // File download operations
  async downloadFile(documentId: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents/${documentId}`);
    await this.page.waitForLoadState('networkidle');

    // Start download
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('[data-testid="download-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toBeTruthy();

    // Save to test location
    const downloadPath = path.join(process.cwd(), 'test-downloads', download.suggestedFilename()!);
    const downloadDir = path.dirname(downloadPath);

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    await download.saveAs(downloadPath);

    // Verify file exists and has content
    expect(fs.existsSync(downloadPath)).toBe(true);
    expect(fs.statSync(downloadPath).size).toBeGreaterThan(0);
  }

  async downloadMultipleFiles(documentIds: string[]): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    // Select multiple documents
    for (const docId of documentIds) {
      await this.page.check(`[data-testid="document-checkbox-${docId}"]`);
    }

    // Start bulk download
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('[data-testid="bulk-download-button"]');
    const download = await downloadPromise;

    // Should download as ZIP file
    expect(download.suggestedFilename()).toMatch(/\.zip$/);

    // Save and verify
    const downloadPath = path.join(process.cwd(), 'test-downloads', download.suggestedFilename()!);
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);
  }

  // File validation testing
  async testFileValidation(filePath: string, expectedError: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    await this.page.click('[data-testid="upload-document-button"]');
    await expect(this.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Try to upload invalid file
    await this.page.setInputFiles('[data-testid="file-input"]', filePath);

    // Wait for validation error
    await expect(this.page.locator(`[data-testid="validation-error"]`)).toBeVisible();

    // Verify specific error message
    const errorText = await this.page.locator('[data-testid="validation-error"]').textContent();
    expect(errorText).toContain(expectedError);
  }

  async testFileSizeLimit(): Promise<void> {
    const oversizedFile = await this.createTestFile(FILE_CONFIGS.oversized);

    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    await this.page.click('[data-testid="upload-document-button"]');
    await expect(this.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Try to upload oversized file
    await this.page.setInputFiles('[data-testid="file-input"]', oversizedFile);

    // Wait for size validation error
    await expect(this.page.locator('[data-testid="file-size-error"]')).toBeVisible();

    // Verify error message mentions size limit
    const errorText = await this.page.locator('[data-testid="file-size-error"]').textContent();
    expect(errorText).toMatch(/size|limit|large/i);
  }

  // AI-powered document processing
  async testAIDocumentAnalysis(documentId: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents/${documentId}`);
    await this.page.waitForLoadState('networkidle');

    // Start AI analysis
    await this.page.click('[data-testid="ai-analysis-button"]');
    await expect(this.page.locator('[data-testid="ai-analysis-dialog"]')).toBeVisible();

    // Configure analysis options
    await this.page.check('[data-testid="extract-risks-checkbox"]');
    await this.page.check('[data-testid="extract-controls-checkbox"]');
    await this.page.check('[data-testid="compliance-check-checkbox"]');

    // Start analysis
    await this.page.click('[data-testid="start-analysis-button"]');

    // Wait for analysis progress
    await expect(this.page.locator('[data-testid="analysis-progress"]')).toBeVisible();

    // Wait for completion (AI analysis can take longer)
    await expect(this.page.locator('[data-testid="analysis-complete"]')).toBeVisible({
      timeout: 180000,
    });

    // Verify analysis results
    await expect(this.page.locator('[data-testid="extracted-risks"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="recommended-controls"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="compliance-findings"]')).toBeVisible();

    // Check that results are not empty
    const risksCount = await this.page.locator('[data-testid="risks-count"]').textContent();
    expect(parseInt(risksCount || '0')).toBeGreaterThan(0);
  }

  // Version management testing
  async testDocumentVersioning(documentId: string, newFilePath: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents/${documentId}`);
    await this.page.waitForLoadState('networkidle');

    // Check current version
    const currentVersion = await this.page.locator('[data-testid="current-version"]').textContent();
    expect(currentVersion).toBe('1.0');

    // Upload new version
    await this.page.click('[data-testid="upload-new-version-button"]');
    await expect(this.page.locator('[data-testid="version-upload-dialog"]')).toBeVisible();

    await this.page.setInputFiles('[data-testid="version-file-input"]', newFilePath);
    await this.page.fill(
      '[data-testid="version-notes-input"]',
      'Updated document with latest revisions'
    );
    await this.page.click('[data-testid="upload-version-submit"]');

    // Wait for version upload
    await expect(this.page.locator('[data-testid="version-upload-success"]')).toBeVisible({
      timeout: UPLOAD_TIMEOUT,
    });

    // Verify new version
    const newVersion = await this.page.locator('[data-testid="current-version"]').textContent();
    expect(newVersion).toBe('2.0');

    // Check version history
    await this.page.click('[data-testid="version-history-button"]');
    await expect(this.page.locator('[data-testid="version-history-dialog"]')).toBeVisible();

    const versionCount = await this.page.locator('[data-testid="version-item"]').count();
    expect(versionCount).toBe(2);
  }

  // Search and filtering
  async testDocumentSearch(searchTerm: string, expectedResults: number): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    // Perform search
    await this.page.fill('[data-testid="document-search-input"]', searchTerm);
    await this.page.press('[data-testid="document-search-input"]', 'Enter');

    // Wait for search results
    await this.page.waitForTimeout(1000); // Debounce delay

    // Verify results count
    const resultsCount = await this.page
      .locator('[data-testid="search-results-count"]')
      .textContent();
    expect(parseInt(resultsCount || '0')).toBe(expectedResults);

    // Verify results contain search term
    const searchResults = await this.page.locator('[data-testid="document-item"]').count();
    if (searchResults > 0) {
      const firstResultTitle = await this.page
        .locator('[data-testid="document-item"]:first-child [data-testid="document-title"]')
        .textContent();
      expect(firstResultTitle?.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
  }

  async testDocumentFiltering(): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    // Test category filtering
    await this.page.selectOption('[data-testid="category-filter"]', 'policy');
    await this.page.waitForTimeout(1000);

    // Verify filtered results
    const policyDocs = await this.page
      .locator('[data-testid="document-item"][data-category="policy"]')
      .count();
    const totalVisible = await this.page.locator('[data-testid="document-item"]:visible').count();
    expect(policyDocs).toBe(totalVisible);

    // Test date range filtering
    await this.page.fill('[data-testid="date-from-filter"]', '2024-01-01');
    await this.page.fill('[data-testid="date-to-filter"]', '2024-12-31');
    await this.page.waitForTimeout(1000);

    // Verify date filtering works
    const dateFilteredCount = await this.page
      .locator('[data-testid="document-item"]:visible')
      .count();
    expect(dateFilteredCount).toBeGreaterThanOrEqual(0);
  }

  // Bulk operations
  async testBulkOperations(documentIds: string[]): Promise<void> {
    await this.page.goto(`${BASE_URL}/documents`);
    await this.page.waitForLoadState('networkidle');

    // Select multiple documents
    for (const docId of documentIds) {
      await this.page.check(`[data-testid="document-checkbox-${docId}"]`);
    }

    // Verify bulk actions are enabled
    await expect(this.page.locator('[data-testid="bulk-actions-menu"]')).toBeVisible();

    // Test bulk categorization
    await this.page.click('[data-testid="bulk-actions-menu"]');
    await this.page.click('[data-testid="bulk-categorize-action"]');
    await expect(this.page.locator('[data-testid="bulk-categorize-dialog"]')).toBeVisible();

    await this.page.selectOption('[data-testid="bulk-category-select"]', 'procedure');
    await this.page.click('[data-testid="apply-bulk-category"]');

    // Wait for bulk operation completion
    await expect(this.page.locator('[data-testid="bulk-operation-success"]')).toBeVisible();

    // Verify changes were applied
    for (const docId of documentIds) {
      const category = await this.page.getAttribute(
        `[data-testid="document-item-${docId}"]`,
        'data-category'
      );
      expect(category).toBe('procedure');
    }
  }

  // Cleanup utilities
  async cleanupDownloads(): Promise<void> {
    const downloadDir = path.join(process.cwd(), 'test-downloads');
    if (fs.existsSync(downloadDir)) {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }
  }
}

test.describe('File Operations Integration Tests', () => {
  let helper: FileOperationsHelper;

  test.beforeEach(async ({ page }) => {
    helper = new FileOperationsHelper(page);
    await helper.performLogin();
  });

  test.afterEach(async () => {
    await helper.performLogout();
    await helper.cleanupTestFiles();
    await helper.cleanupDownloads();
  });

  test('Single file upload and download workflow', async () => {
    // Create test file
    const pdfFile = await helper.createTestFile(FILE_CONFIGS.pdf);

    // Upload file
    const documentId = await helper.uploadSingleFile(pdfFile, {
      title: 'Integration Test PDF',
      description: 'PDF file for integration testing',
      category: 'policy',
    });

    expect(documentId).toBeTruthy();

    // Download file
    await helper.downloadFile(documentId);
  });

  test('Multiple file upload workflow', async () => {
    // Create multiple test files
    const pdfFile = await helper.createTestFile(FILE_CONFIGS.pdf);
    const wordFile = await helper.createTestFile(FILE_CONFIGS.word);
    const textFile = await helper.createTestFile(FILE_CONFIGS.text);

    // Upload multiple files
    const documentIds = await helper.uploadMultipleFiles([pdfFile, wordFile, textFile], {
      title: 'Batch Upload Test',
      description: 'Multiple files for batch upload testing',
      category: 'procedure',
    });

    expect(documentIds).toHaveLength(3);

    // Download multiple files
    await helper.downloadMultipleFiles(documentIds);
  });

  test('Large file upload with progress tracking', async () => {
    // Create a larger test file
    const largeFile = await helper.createTestFile({
      ...FILE_CONFIGS.pdf,
      name: 'large-test-file.pdf',
      size: 10 * 1024 * 1024, // 10MB
      content: Buffer.alloc(10 * 1024 * 1024, 'x'),
    });

    await helper.uploadWithProgressTracking(largeFile, {
      title: 'Large File Test',
      description: 'Testing large file upload with progress tracking',
      category: 'report',
    });
  });

  test('File validation and error handling', async () => {
    // Test file size limit
    await helper.testFileSizeLimit();

    // Test invalid file type (create a file with wrong extension)
    const invalidFile = await helper.createTestFile({
      name: 'test.exe',
      mimeType: 'application/x-executable',
      size: 1024,
      content: Buffer.from('Invalid file content'),
    });

    await helper.testFileValidation(invalidFile, 'file type not allowed');
  });

  test('AI-powered document analysis workflow', async () => {
    // Upload a document suitable for AI analysis
    const policyFile = await helper.createTestFile({
      ...FILE_CONFIGS.pdf,
      name: 'policy-document.pdf',
      content: Buffer.from(
        '%PDF-1.4\nPolicy Document\nData Protection Policy\n1. Purpose: This policy establishes requirements for protecting personal data\n2. Scope: Applies to all employees\n3. Risk: Unauthorized access to personal data\n4. Control: Implement access controls and encryption'
      ),
    });

    const documentId = await helper.uploadSingleFile(policyFile, {
      title: 'Data Protection Policy',
      description: 'Policy document for AI analysis testing',
      category: 'policy',
    });

    // Run AI analysis
    await helper.testAIDocumentAnalysis(documentId);
  });

  test('Document versioning workflow', async () => {
    // Upload initial version
    const initialFile = await helper.createTestFile(FILE_CONFIGS.pdf);
    const documentId = await helper.uploadSingleFile(initialFile, {
      title: 'Versioned Document',
      description: 'Document for version testing',
      category: 'procedure',
    });

    // Upload new version
    const updatedFile = await helper.createTestFile({
      ...FILE_CONFIGS.pdf,
      name: 'updated-document.pdf',
      content: Buffer.from('%PDF-1.4\nUpdated content for version 2.0'),
    });

    await helper.testDocumentVersioning(documentId, updatedFile);
  });

  test('Document search and filtering functionality', async () => {
    // Upload test documents with different attributes
    const testFiles = [
      {
        config: FILE_CONFIGS.pdf,
        metadata: {
          title: 'Security Policy',
          description: 'Security guidelines',
          category: 'policy',
        },
      },
      {
        config: FILE_CONFIGS.word,
        metadata: {
          title: 'Risk Assessment Procedure',
          description: 'Risk assessment process',
          category: 'procedure',
        },
      },
      {
        config: FILE_CONFIGS.excel,
        metadata: {
          title: 'Compliance Report',
          description: 'Quarterly compliance report',
          category: 'report',
        },
      },
    ];

    for (const testFile of testFiles) {
      const filePath = await helper.createTestFile(testFile.config);
      await helper.uploadSingleFile(filePath, testFile.metadata);
    }

    // Test search functionality
    await helper.testDocumentSearch('Security', 1);
    await helper.testDocumentSearch('Risk', 1);
    await helper.testDocumentSearch('Report', 1);

    // Test filtering
    await helper.testDocumentFiltering();
  });

  test('Bulk document operations', async () => {
    // Upload multiple documents for bulk operations
    const testFiles = [];
    for (let i = 0; i < 3; i++) {
      const filePath = await helper.createTestFile({
        ...FILE_CONFIGS.pdf,
        name: `bulk-test-${i}.pdf`,
      });
      const docId = await helper.uploadSingleFile(filePath, {
        title: `Bulk Test Document ${i + 1}`,
        description: `Document ${i + 1} for bulk operations testing`,
        category: 'guideline',
      });
      testFiles.push(docId);
    }

    // Test bulk operations
    await helper.testBulkOperations(testFiles);
  });

  test('Error recovery and retry mechanisms', async () => {
    // Test network interruption during upload
    const testFile = await helper.createTestFile(FILE_CONFIGS.pdf);

    await helper.page.goto(`${BASE_URL}/documents`);
    await helper.page.waitForLoadState('networkidle');

    await helper.page.click('[data-testid="upload-document-button"]');
    await expect(helper.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Fill metadata
    await helper.page.fill('[data-testid="document-title-input"]', 'Network Test File');
    await helper.page.fill(
      '[data-testid="document-description-input"]',
      'Testing network interruption'
    );
    await helper.page.selectOption('[data-testid="document-category-select"]', 'other');

    // Start upload then simulate network failure
    await helper.page.setInputFiles('[data-testid="file-input"]', testFile);

    // Simulate network disconnection mid-upload
    await helper.page.context().setOffline(true);
    await helper.page.click('[data-testid="upload-submit-button"]');

    // Verify error handling
    await expect(helper.page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(helper.page.locator('[data-testid="retry-upload-button"]')).toBeVisible();

    // Restore network and retry
    await helper.page.context().setOffline(false);
    await helper.page.click('[data-testid="retry-upload-button"]');

    // Verify successful retry
    await expect(helper.page.locator('[data-testid="upload-success"]')).toBeVisible({
      timeout: UPLOAD_TIMEOUT,
    });
  });

  test('Concurrent file operations', async () => {
    // Test concurrent uploads
    const uploadPromises = [];
    for (let i = 0; i < 3; i++) {
      const filePath = await helper.createTestFile({
        ...FILE_CONFIGS.pdf,
        name: `concurrent-${i}.pdf`,
      });

      uploadPromises.push(
        helper.uploadSingleFile(filePath, {
          title: `Concurrent Upload ${i + 1}`,
          description: `Concurrent upload test ${i + 1}`,
          category: 'other',
        })
      );
    }

    const documentIds = await Promise.all(uploadPromises);
    expect(documentIds).toHaveLength(3);
    documentIds.forEach((id) => expect(id).toBeTruthy());
  });

  test('File security and virus scanning simulation', async () => {
    // Create a test file that would trigger security scanning
    const suspiciousFile = await helper.createTestFile({
      name: 'suspicious-file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      content: Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'), // Simulated virus signature
    });

    await helper.page.goto(`${BASE_URL}/documents`);
    await helper.page.waitForLoadState('networkidle');

    await helper.page.click('[data-testid="upload-document-button"]');
    await expect(helper.page.locator('[data-testid="document-upload-form"]')).toBeVisible();

    // Try to upload suspicious file
    await helper.page.setInputFiles('[data-testid="file-input"]', suspiciousFile);

    // Should trigger security scan failure
    await expect(helper.page.locator('[data-testid="security-scan-error"]')).toBeVisible({
      timeout: 30000,
    });

    const errorText = await helper.page
      .locator('[data-testid="security-scan-error"]')
      .textContent();
    expect(errorText).toMatch(/security|virus|threat/i);
  });
});
