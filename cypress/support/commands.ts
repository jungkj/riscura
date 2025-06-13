/// <reference types="cypress" />

// Login command
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL');
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD');
  
  cy.visit('/auth/login');
  
  cy.get('[data-testid="email-input"]')
    .type(testEmail);
  
  cy.get('[data-testid="password-input"]')
    .type(testPassword);
  
  cy.get('[data-testid="login-button"]')
    .click();
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
  
  // Verify user is logged in
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  
  // Verify redirect to login page
  cy.url().should('include', '/auth/login');
});

// Create risk command
Cypress.Commands.add('createRisk', (riskData) => {
  // Intercept the API call
  cy.intercept('POST', '/api/risks', {
    statusCode: 201,
    body: {
      success: true,
      data: {
        id: 'test-risk-id',
        ...riskData,
        riskScore: riskData.likelihood * riskData.impact,
        createdAt: new Date().toISOString(),
      }
    }
  }).as('createRisk');
  
  cy.visit('/dashboard/risks/new');
  
  cy.get('[data-testid="risk-title-input"]')
    .type(riskData.title);
  
  cy.get('[data-testid="risk-description-textarea"]')
    .type(riskData.description);
  
  cy.get('[data-testid="risk-category-select"]')
    .click();
  cy.get(`[data-value="${riskData.category}"]`)
    .click();
  
  cy.get('[data-testid="likelihood-input"]')
    .clear()
    .type(riskData.likelihood.toString());
  
  cy.get('[data-testid="impact-input"]')
    .clear()
    .type(riskData.impact.toString());
  
  cy.get('[data-testid="save-risk-button"]')
    .click();
  
  cy.wait('@createRisk');
  
  // Verify success message
  cy.get('[data-testid="success-toast"]')
    .should('contain', 'Risk created successfully');
});

// Navigate to dashboard command
Cypress.Commands.add('goToDashboard', (section?: string) => {
  if (section) {
    cy.visit(`/dashboard/${section}`);
  } else {
    cy.visit('/dashboard');
  }
  
  // Wait for dashboard to load
  cy.get('[data-testid="dashboard-header"]').should('be.visible');
});

// Wait for API command
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(`@${alias}`).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

// Seed test data command
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase');
  
  // Create test organization and users
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/test/seed`,
    body: {
      organizations: [
        {
          id: 'test-org-1',
          name: 'Test Organization',
          domain: 'test.com',
        }
      ],
      users: [
        {
          id: 'test-user-1',
          email: Cypress.env('TEST_USER_EMAIL'),
          firstName: 'Test',
          lastName: 'User',
          organizationId: 'test-org-1',
          role: 'USER',
        },
        {
          id: 'test-admin-1',
          email: Cypress.env('TEST_ADMIN_EMAIL'),
          firstName: 'Test',
          lastName: 'Admin',
          organizationId: 'test-org-1',
          role: 'ADMIN',
        }
      ],
      risks: [
        {
          id: 'test-risk-1',
          title: 'Test Operational Risk',
          description: 'A test risk for E2E testing',
          category: 'OPERATIONAL',
          likelihood: 3,
          impact: 4,
          organizationId: 'test-org-1',
        }
      ]
    }
  });
});

// Verify tenant isolation command
Cypress.Commands.add('verifyTenantIsolation', (organizationId: string) => {
  // Intercept API calls and verify they include organization filter
  cy.intercept('GET', '/api/risks*', (req) => {
    expect(req.headers).to.have.property('authorization');
    // The actual org verification would happen server-side
  }).as('getRisks');
  
  cy.visit('/dashboard/risks');
  cy.wait('@getRisks');
  
  // Verify only data from the correct organization is displayed
  cy.get('[data-testid="risk-card"]').each(($el) => {
    cy.wrap($el).should('have.attr', 'data-organization-id', organizationId);
  });
});

// Upload file command
Cypress.Commands.add('uploadFile', (fileName: string, fileType = 'application/pdf') => {
  cy.fixture(fileName, 'base64').then((fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, fileType);
    const file = new File([blob], fileName, { type: fileType });
    
    cy.get('[data-testid="file-dropzone"]').then((el) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      });
      
      el[0].dispatchEvent(dropEvent);
    });
  });
});

// Accessibility check command (requires cypress-axe)
Cypress.Commands.add('checkA11y', (context?: string, options?: any) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    if (violations.length > 0) {
      cy.task('log', `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} found`);
      
      violations.forEach((violation) => {
        cy.task('log', `${violation.impact}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          cy.task('log', `  - ${node.target.join(', ')}`);
        });
      });
    }
  });
});

// Custom command to handle loading states
Cypress.Commands.add('waitForLoadingToFinish', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

// Custom command to verify error handling
Cypress.Commands.add('verifyErrorHandling', (errorMessage: string) => {
  cy.get('[data-testid="error-message"]')
    .should('be.visible')
    .and('contain', errorMessage);
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (endpoint: string, response: any, statusCode = 200) => {
  cy.intercept('*', endpoint, {
    statusCode,
    body: response,
  });
});

// Extend Cypress interface for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      waitForLoadingToFinish(): Chainable<void>;
      verifyErrorHandling(errorMessage: string): Chainable<void>;
      mockApiResponse(endpoint: string, response: any, statusCode?: number): Chainable<void>;
    }
  }
} 