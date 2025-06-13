/// <reference types="cypress" />

// Import commands
import './commands';

// Global setup
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();
  
  // Set up test environment
  cy.task('seedDatabase');
});

after(() => {
  // Clean up after all tests
  cy.task('clearDatabase');
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail the test on certain errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Log the error but continue
  cy.log('Uncaught exception:', err.message);
  return true;
});

// Add custom Cypress commands type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       */
      login(email?: string, password?: string): Chainable<void>;
      
      /**
       * Custom command to log out
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to create a test risk
       */
      createRisk(riskData: {
        title: string;
        description: string;
        category: string;
        likelihood: number;
        impact: number;
      }): Chainable<void>;
      
      /**
       * Custom command to navigate to specific dashboard section
       */
      goToDashboard(section?: string): Chainable<void>;
      
      /**
       * Custom command to wait for API call to complete
       */
      waitForApi(alias: string): Chainable<void>;
      
      /**
       * Custom command to seed test data
       */
      seedTestData(): Chainable<void>;
      
      /**
       * Custom command to verify multi-tenant isolation
       */
      verifyTenantIsolation(organizationId: string): Chainable<void>;
      
      /**
       * Custom command to upload files via drag and drop
       */
      uploadFile(fileName: string, fileType?: string): Chainable<void>;
      
      /**
       * Custom command to check accessibility
       */
      checkA11y(context?: string, options?: any): Chainable<void>;
    }
  }
} 