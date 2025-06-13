/// <reference types="cypress" />

describe('Multi-Tenant Data Isolation', () => {
  const org1Data = {
    id: 'org-1',
    name: 'Organization One',
    domain: 'org1.com',
    users: [
      {
        id: 'user-1-org1',
        email: 'user1@org1.com',
        firstName: 'User',
        lastName: 'One',
        role: 'ADMIN',
      },
      {
        id: 'user-2-org1',
        email: 'user2@org1.com',
        firstName: 'User',
        lastName: 'Two',
        role: 'USER',
      }
    ],
    risks: [
      {
        id: 'risk-1-org1',
        title: 'Org 1 Security Risk',
        description: 'Security risk for organization 1',
        category: 'TECHNOLOGY',
        likelihood: 3,
        impact: 4,
      },
      {
        id: 'risk-2-org1',
        title: 'Org 1 Compliance Risk',
        description: 'Compliance risk for organization 1',
        category: 'COMPLIANCE',
        likelihood: 2,
        impact: 5,
      }
    ]
  };

  const org2Data = {
    id: 'org-2',
    name: 'Organization Two',
    domain: 'org2.com',
    users: [
      {
        id: 'user-1-org2',
        email: 'user1@org2.com',
        firstName: 'User',
        lastName: 'Alpha',
        role: 'ADMIN',
      }
    ],
    risks: [
      {
        id: 'risk-1-org2',
        title: 'Org 2 Operational Risk',
        description: 'Operational risk for organization 2',
        category: 'OPERATIONAL',
        likelihood: 4,
        impact: 3,
      }
    ]
  };

  beforeEach(() => {
    // Clear and seed test data for both organizations
    cy.task('clearDatabase');
    
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL')}/test/seed-multi-tenant`,
      body: {
        organizations: [org1Data, org2Data]
      }
    });
  });

  describe('Data Isolation', () => {
    it('should only show risks from user organization', () => {
      // Login as user from organization 1
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      // Mock login response with org1 user
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: org1Data.users[0],
          token: 'org1-user-token',
        }
      }).as('loginOrg1');
      
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginOrg1');

      // Mock risks API to return only org1 risks
      cy.intercept('GET', '/api/risks*', {
        statusCode: 200,
        body: {
          success: true,
          data: org1Data.risks,
          pagination: {
            page: 1,
            limit: 10,
            total: org1Data.risks.length,
            totalPages: 1,
          }
        }
      }).as('getOrg1Risks');

      cy.visit('/dashboard/risks');
      cy.wait('@getOrg1Risks');

      // Verify only org1 risks are displayed
      cy.get('[data-testid="risk-card"]').should('have.length', 2);
      cy.get('[data-testid="risk-card"]').first()
        .should('contain', 'Org 1 Security Risk');
      cy.get('[data-testid="risk-card"]').last()
        .should('contain', 'Org 1 Compliance Risk');

      // Verify org2 risks are not visible
      cy.get('[data-testid="risk-card"]')
        .should('not.contain', 'Org 2 Operational Risk');
    });

    it('should prevent cross-organization data access via API', () => {
      // Login as org1 user
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/auth/login`,
        body: {
          email: 'user1@org1.com',
          password: 'password123'
        }
      }).then((response) => {
        const token = response.body.token;

        // Try to access org2 risk directly
        cy.request({
          method: 'GET',
          url: `${Cypress.env('API_URL')}/risks/${org2Data.risks[0].id}`,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          failOnStatusCode: false
        }).then((response) => {
          // Should return 404 (not found) due to organization isolation
          expect(response.status).to.equal(404);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.equal('Risk not found');
        });
      });
    });

    it('should isolate user lists by organization', () => {
      // Login as org1 admin
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: { ...org1Data.users[0], role: 'ADMIN' },
          token: 'org1-admin-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Mock users API to return only org1 users
      cy.intercept('GET', '/api/users*', {
        statusCode: 200,
        body: {
          success: true,
          data: org1Data.users,
        }
      }).as('getOrg1Users');

      cy.visit('/dashboard/admin/users');
      cy.wait('@getOrg1Users');

      // Verify only org1 users are displayed
      cy.get('[data-testid="user-row"]').should('have.length', 2);
      cy.get('[data-testid="user-row"]')
        .should('contain', 'user1@org1.com')
        .and('contain', 'user2@org1.com')
        .and('not.contain', 'user1@org2.com');
    });

    it('should prevent unauthorized organization switching', () => {
      // Login as org1 user
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: org1Data.users[0],
          token: 'org1-user-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Try to make API request with different organization ID
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/risks`,
        headers: {
          'Authorization': 'Bearer org1-user-token',
          'X-Organization-ID': org2Data.id // Try to access org2 data
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should either ignore the header or return unauthorized
        // The actual implementation should verify org ID against user's org
        expect(response.status).to.be.oneOf([200, 403]);
        
        if (response.status === 200) {
          // If 200, should only return org1 data
          expect(response.body.data.every((risk: any) => 
            risk.organizationId === org1Data.id
          )).to.be.true;
        }
      });
    });
  });

  describe('Organization Management', () => {
    it('should allow organization admin to manage settings', () => {
      // Login as org1 admin
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: { ...org1Data.users[0], role: 'ADMIN' },
          token: 'org1-admin-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Mock organization settings API
      cy.intercept('GET', '/api/organization/settings', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: org1Data.id,
            name: org1Data.name,
            domain: org1Data.domain,
            settings: {
              riskMatrix: '5x5',
              autoArchiveRisks: true,
              requireApprovalForHighRisks: true,
            }
          }
        }
      }).as('getOrgSettings');

      cy.visit('/dashboard/admin/organization');
      cy.wait('@getOrgSettings');

      // Verify organization settings page
      cy.get('[data-testid="org-name-input"]')
        .should('have.value', org1Data.name);
      
      cy.get('[data-testid="org-domain-input"]')
        .should('have.value', org1Data.domain);

      // Update organization name
      cy.get('[data-testid="org-name-input"]')
        .clear()
        .type('Updated Organization One');

      cy.intercept('PUT', '/api/organization/settings', {
        statusCode: 200,
        body: {
          success: true,
          data: { ...org1Data, name: 'Updated Organization One' }
        }
      }).as('updateOrgSettings');

      cy.get('[data-testid="save-org-button"]').click();
      cy.wait('@updateOrgSettings');

      cy.get('[data-testid="success-toast"]')
        .should('contain', 'Organization updated successfully');
    });

    it('should prevent regular users from accessing admin functions', () => {
      // Login as regular user (not admin)
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user2@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: org1Data.users[1], // Regular user, not admin
          token: 'org1-user-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Try to access admin pages
      cy.visit('/dashboard/admin/users');
      
      // Should be denied access
      cy.url().should('not.include', '/admin/users');
      cy.get('[data-testid="access-denied"]')
        .should('contain', 'Access denied');
    });

    it('should handle organization-specific branding', () => {
      // Login to org1
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: org1Data.users[0],
          token: 'org1-user-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Mock organization branding
      cy.intercept('GET', '/api/organization/branding', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            logo: '/logos/org1-logo.png',
            primaryColor: '#1a365d',
            secondaryColor: '#2d3748',
            organizationName: org1Data.name,
          }
        }
      }).as('getOrgBranding');

      cy.visit('/dashboard');
      cy.wait('@getOrgBranding');

      // Verify organization-specific elements
      cy.get('[data-testid="org-logo"]')
        .should('have.attr', 'src')
        .and('include', 'org1-logo.png');
      
      cy.get('[data-testid="org-name-display"]')
        .should('contain', org1Data.name);
    });
  });

  describe('Cross-Organization Security', () => {
    it('should prevent JWT token replay attacks across organizations', () => {
      // Get token for org1 user
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/auth/login`,
        body: {
          email: 'user1@org1.com',
          password: 'password123'
        }
      }).then((response) => {
        const org1Token = response.body.token;

        // Try to use org1 token to access org2 admin functions
        cy.request({
          method: 'GET',
          url: `${Cypress.env('API_URL')}/admin/users`,
          headers: {
            'Authorization': `Bearer ${org1Token}`,
            'X-Organization-ID': org2Data.id
          },
          failOnStatusCode: false
        }).then((response) => {
          // Should be denied
          expect(response.status).to.be.oneOf([401, 403]);
        });
      });
    });

    it('should audit cross-organization access attempts', () => {
      // This test would verify that suspicious access attempts are logged
      // Login as org1 user
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/auth/login`,
        body: {
          email: 'user1@org1.com',
          password: 'password123'
        }
      }).then((response) => {
        const token = response.body.token;

        // Attempt to access org2 resource
        cy.request({
          method: 'GET',
          url: `${Cypress.env('API_URL')}/risks/${org2Data.risks[0].id}`,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          failOnStatusCode: false
        });

        // Check audit logs (mock endpoint)
        cy.request({
          method: 'GET',
          url: `${Cypress.env('API_URL')}/admin/audit-logs`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then((auditResponse) => {
          // Should contain log of attempted unauthorized access
          expect(auditResponse.body.data.some((log: any) => 
            log.action === 'UNAUTHORIZED_ACCESS_ATTEMPT' &&
            log.resourceId === org2Data.risks[0].id
          )).to.be.true;
        });
      });
    });

    it('should handle data export restrictions per organization', () => {
      // Login as org1 admin
      cy.visit('/auth/login');
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: { ...org1Data.users[0], role: 'ADMIN' },
          token: 'org1-admin-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Mock export endpoint
      cy.intercept('POST', '/api/export/risks', {
        statusCode: 200,
        body: {
          success: true,
          downloadUrl: '/exports/org1-risks-export.xlsx',
          data: org1Data.risks // Only org1 data
        }
      }).as('exportRisks');

      cy.visit('/dashboard/risks');
      cy.get('[data-testid="export-button"]').click();
      
      cy.wait('@exportRisks');

      // Verify export contains only organization's data
      cy.get('@exportRisks').then((interception) => {
        expect(interception.request.body).to.deep.include({
          organizationId: org1Data.id
        });
      });

      cy.get('[data-testid="download-link"]')
        .should('contain', 'org1-risks-export.xlsx');
    });
  });

  describe('Subdomain Isolation', () => {
    it('should handle organization-specific subdomains', () => {
      // Visit org1 subdomain
      cy.visit('http://org1.localhost:3000/auth/login');
      
      // Should auto-populate organization context
      cy.get('[data-testid="organization-context"]')
        .should('contain', org1Data.name);

      // Login should automatically associate with correct org
      cy.get('[data-testid="email-input"]').type('user1@org1.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          user: org1Data.users[0],
          token: 'org1-user-token',
        }
      });
      
      cy.get('[data-testid="login-button"]').click();

      // Verify correct organization context is maintained
      cy.url().should('include', 'org1.localhost');
      cy.get('[data-testid="user-org-display"]')
        .should('contain', org1Data.name);
    });

    it('should prevent subdomain spoofing', () => {
      // Try to access org1 subdomain with org2 user credentials
      cy.visit('http://org1.localhost:3000/auth/login');
      
      cy.get('[data-testid="email-input"]').type('user1@org2.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      // Should reject login for wrong organization
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 403,
        body: {
          success: false,
          error: 'User not authorized for this organization'
        }
      }).as('rejectCrossOrgLogin');
      
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@rejectCrossOrgLogin');

      cy.get('[data-testid="error-message"]')
        .should('contain', 'not authorized for this organization');
    });
  });
}); 