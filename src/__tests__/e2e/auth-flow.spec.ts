/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.seedTestData();
  });

  describe('User Login', () => {
    it('should allow valid user to log in', () => {
      cy.visit('/auth/login');
      
      // Verify login page elements
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
      
      // Enter credentials
      cy.get('[data-testid="email-input"]')
        .type(Cypress.env('TEST_USER_EMAIL'));
      
      cy.get('[data-testid="password-input"]')
        .type(Cypress.env('TEST_USER_PASSWORD'));
      
      // Intercept login API call
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: {
            id: 'test-user-1',
            email: Cypress.env('TEST_USER_EMAIL'),
            firstName: 'Test',
            lastName: 'User',
            role: 'USER',
            organizationId: 'test-org-1',
          },
          token: 'test-jwt-token',
        }
      }).as('login');
      
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@login');
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="welcome-message"]')
        .should('contain', 'Welcome, Test User');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-testid="email-input"]')
        .type('invalid@example.com');
      
      cy.get('[data-testid="password-input"]')
        .type('wrongpassword');
      
      // Mock failed login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          error: 'Invalid credentials',
        }
      }).as('failedLogin');
      
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@failedLogin');
      
      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
      
      // Should remain on login page
      cy.url().should('include', '/auth/login');
    });

    it('should validate form fields', () => {
      cy.visit('/auth/login');
      
      // Try to submit empty form
      cy.get('[data-testid="login-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="email-error"]')
        .should('contain', 'Email is required');
      
      cy.get('[data-testid="password-error"]')
        .should('contain', 'Password is required');
      
      // Test invalid email format
      cy.get('[data-testid="email-input"]')
        .type('invalid-email');
      
      cy.get('[data-testid="email-error"]')
        .should('contain', 'Please enter a valid email');
    });

    it('should handle forgotten password flow', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-testid="forgot-password-link"]').click();
      
      cy.url().should('include', '/auth/forgot-password');
      
      cy.get('[data-testid="reset-email-input"]')
        .type(Cypress.env('TEST_USER_EMAIL'));
      
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: { success: true, message: 'Reset email sent' }
      }).as('forgotPassword');
      
      cy.get('[data-testid="send-reset-button"]').click();
      
      cy.wait('@forgotPassword');
      
      cy.get('[data-testid="success-message"]')
        .should('contain', 'Password reset email sent');
    });
  });

  describe('User Registration', () => {
    it('should allow new user registration', () => {
      cy.visit('/auth/register');
      
      // Fill registration form
      cy.get('[data-testid="first-name-input"]')
        .type('New');
      
      cy.get('[data-testid="last-name-input"]')
        .type('User');
      
      cy.get('[data-testid="email-input"]')
        .type('newuser@example.com');
      
      cy.get('[data-testid="password-input"]')
        .type('password123');
      
      cy.get('[data-testid="confirm-password-input"]')
        .type('password123');
      
      cy.get('[data-testid="organization-name-input"]')
        .type('New Organization');
      
      cy.get('[data-testid="terms-checkbox"]').check();
      
      // Mock successful registration
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 201,
        body: {
          success: true,
          message: 'Registration successful',
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
          }
        }
      }).as('register');
      
      cy.get('[data-testid="register-button"]').click();
      
      cy.wait('@register');
      
      // Should redirect to verification page
      cy.url().should('include', '/auth/verify-email');
      cy.get('[data-testid="verification-message"]')
        .should('contain', 'Please check your email');
    });

    it('should validate registration form', () => {
      cy.visit('/auth/register');
      
      // Try to submit empty form
      cy.get('[data-testid="register-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="first-name-error"]')
        .should('contain', 'First name is required');
      
      cy.get('[data-testid="email-error"]')
        .should('contain', 'Email is required');
      
      // Test password mismatch
      cy.get('[data-testid="password-input"]')
        .type('password123');
      
      cy.get('[data-testid="confirm-password-input"]')
        .type('different');
      
      cy.get('[data-testid="password-mismatch-error"]')
        .should('contain', 'Passwords do not match');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should maintain session across page refreshes', () => {
      cy.visit('/dashboard');
      
      // Verify user is logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
      
      // Refresh page
      cy.reload();
      
      // Should still be logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.url().should('include', '/dashboard');
    });

    it('should handle session expiration', () => {
      cy.visit('/dashboard');
      
      // Mock expired session
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 401,
        body: { success: false, error: 'Session expired' }
      }).as('sessionExpired');
      
      // Try to access protected resource
      cy.visit('/dashboard/risks');
      
      cy.wait('@sessionExpired');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
      cy.get('[data-testid="session-expired-message"]')
        .should('contain', 'Your session has expired');
    });

    it('should logout user successfully', () => {
      cy.visit('/dashboard');
      
      // Open user menu
      cy.get('[data-testid="user-menu"]').click();
      
      // Mock logout API
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: { success: true }
      }).as('logout');
      
      cy.get('[data-testid="logout-button"]').click();
      
      cy.wait('@logout');
      
      // Should redirect to login page
      cy.url().should('include', '/auth/login');
      
      // Try to access protected page
      cy.visit('/dashboard');
      
      // Should redirect back to login
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should handle MFA setup for new users', () => {
      cy.login();
      
      // Navigate to security settings
      cy.visit('/dashboard/settings/security');
      
      cy.get('[data-testid="enable-mfa-button"]').click();
      
      // Should show QR code
      cy.get('[data-testid="mfa-qr-code"]').should('be.visible');
      
      // Enter verification code
      cy.get('[data-testid="mfa-verification-input"]')
        .type('123456');
      
      cy.intercept('POST', '/api/auth/mfa/verify', {
        statusCode: 200,
        body: { success: true, backupCodes: ['code1', 'code2'] }
      }).as('verifyMFA');
      
      cy.get('[data-testid="verify-mfa-button"]').click();
      
      cy.wait('@verifyMFA');
      
      // Should show backup codes
      cy.get('[data-testid="backup-codes"]').should('be.visible');
    });

    it('should require MFA during login when enabled', () => {
      // Mock user with MFA enabled
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          requiresMFA: true,
          tempToken: 'temp-token',
        }
      }).as('loginWithMFA');
      
      cy.visit('/auth/login');
      
      cy.get('[data-testid="email-input"]')
        .type(Cypress.env('TEST_USER_EMAIL'));
      
      cy.get('[data-testid="password-input"]')
        .type(Cypress.env('TEST_USER_PASSWORD'));
      
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@loginWithMFA');
      
      // Should show MFA verification page
      cy.url().should('include', '/auth/mfa');
      cy.get('[data-testid="mfa-code-input"]').should('be.visible');
      
      // Enter MFA code
      cy.get('[data-testid="mfa-code-input"]')
        .type('123456');
      
      cy.intercept('POST', '/api/auth/mfa/verify', {
        statusCode: 200,
        body: {
          success: true,
          user: { id: 'test-user-1', email: Cypress.env('TEST_USER_EMAIL') },
          token: 'final-jwt-token',
        }
      }).as('verifyMFALogin');
      
      cy.get('[data-testid="verify-mfa-login-button"]').click();
      
      cy.wait('@verifyMFALogin');
      
      // Should complete login
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Social Authentication', () => {
    it('should handle Google OAuth login', () => {
      cy.visit('/auth/login');
      
      // Mock OAuth redirect
      cy.window().then((win) => {
        cy.stub(win, 'open').as('googleOAuth');
      });
      
      cy.get('[data-testid="google-login-button"]').click();
      
      cy.get('@googleOAuth').should('have.been.called');
      
      // Simulate OAuth callback
      cy.visit('/auth/callback/google?code=test-auth-code');
      
      cy.intercept('POST', '/api/auth/google/callback', {
        statusCode: 200,
        body: {
          success: true,
          user: {
            id: 'google-user-1',
            email: 'user@gmail.com',
            firstName: 'Google',
            lastName: 'User',
          },
          token: 'google-jwt-token',
        }
      }).as('googleCallback');
      
      cy.wait('@googleCallback');
      
      // Should complete login
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Access Control', () => {
    it('should redirect unauthenticated users to login', () => {
      // Try to access protected page without authentication
      cy.visit('/dashboard/risks');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
      cy.get('[data-testid="login-required-message"]')
        .should('contain', 'Please log in to continue');
    });

    it('should preserve intended destination after login', () => {
      // Try to access specific page
      cy.visit('/dashboard/risks/assessment');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
      
      // Login
      cy.login();
      
      // Should redirect to originally requested page
      cy.url().should('include', '/dashboard/risks/assessment');
    });

    it('should enforce role-based access control', () => {
      // Login as regular user
      cy.login();
      
      // Try to access admin-only page
      cy.visit('/dashboard/admin/users');
      
      // Should show access denied
      cy.get('[data-testid="access-denied"]')
        .should('contain', 'Access denied');
      
      // Or redirect to dashboard
      cy.url().should('match', /\/(dashboard|access-denied)/);
    });
  });

  describe('Security Features', () => {
    it('should implement rate limiting on login attempts', () => {
      cy.visit('/auth/login');
      
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="email-input"]').clear().type('test@example.com');
        cy.get('[data-testid="password-input"]').clear().type('wrong-password');
        
        cy.intercept('POST', '/api/auth/login', {
          statusCode: 401,
          body: { success: false, error: 'Invalid credentials' }
        });
        
        cy.get('[data-testid="login-button"]').click();
        cy.wait(500);
      }
      
      // Next attempt should be rate limited
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 429,
        body: { success: false, error: 'Too many attempts' }
      }).as('rateLimited');
      
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@rateLimited');
      
      cy.get('[data-testid="rate-limit-error"]')
        .should('contain', 'Too many login attempts');
    });

    it('should clear sensitive data on logout', () => {
      cy.login();
      
      // Verify token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.exist;
      });
      
      cy.logout();
      
      // Verify token is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
      
      // Verify cookies are cleared
      cy.getCookies().should('be.empty');
    });
  });
}); 