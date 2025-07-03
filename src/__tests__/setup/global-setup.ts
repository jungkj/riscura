/**
 * Global Test Setup
 * Prepares test environment, seeds database, and creates test users
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Starting global test setup...');
  
  // Create browser instance for setup operations
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 1. Wait for application to be ready
    console.log('📡 Waiting for application to be ready...');
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    
    // Wait for health check endpoint
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.request.get(`${baseURL}/api/health`);
        if (response.ok()) break;
      } catch (error) {
        // Application not ready yet
      }
      
      retries--;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (retries === 0) {
      throw new Error('Application did not become ready within timeout');
    }
    
    console.log('✅ Application is ready');
    
    // 2. Clean existing test data
    console.log('🧹 Cleaning existing test data...');
    await page.request.post(`${baseURL}/api/test/cleanup`, {
      data: { confirm: true }
    });
    
    // 3. Seed database with test data
    console.log('🌱 Seeding test database...');
    
    // Create test organizations
    const organizations = [
      {
        name: 'TenantA Test Corp',
        domain: 'tenanta.test.com',
        industry: 'financial-services',
        size: 'medium'
      },
      {
        name: 'TenantB Test Corp', 
        domain: 'tenantb.test.com',
        industry: 'technology',
        size: 'large'
      },
      {
        name: 'Load Test Organization',
        domain: 'loadtest.test.com',
        industry: 'healthcare',
        size: 'enterprise'
      }
    ];
    
    const createdOrgs: any[] = [];
    for (const org of organizations) {
      const response = await page.request.post(`${baseURL}/api/test/organizations`, {
        data: org
      });
      const result = await response.json();
      createdOrgs.push(result.data);
      console.log(`  ✅ Created organization: ${org.name}`);
    }
    
    // 4. Create test users
    console.log('👥 Creating test users...');
    
    const testUsers = [
      // Admin users
      {
        email: 'admin@tenanta.test.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'UserA',
        role: 'admin',
        organizationId: createdOrgs[0]?.id || 'default-org-id'
      },
      {
        email: 'admin@tenantb.test.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'UserB',
        role: 'admin',
        organizationId: createdOrgs[1]?.id || 'default-org-id'
      },
      
      // Regular users for each tenant
      {
        email: 'user@tenanta.test.com',
        password: 'UserPassword123!',
        firstName: 'Regular',
        lastName: 'UserA',
        role: 'risk_manager',
        organizationId: createdOrgs[0]?.id || 'default-org-id'
      },
      {
        email: 'user@tenantb.test.com',
        password: 'UserPassword123!',
        firstName: 'Regular',
        lastName: 'UserB',
        role: 'risk_manager',
        organizationId: createdOrgs[1]?.id || 'default-org-id'
      },
      
      // Load testing users
      ...Array.from({ length: 100 }, (_, i) => ({
        email: `loadtest${i}@example.com`,
        password: 'TestPassword123!',
        firstName: `LoadTest`,
        lastName: `User${i}`,
        role: 'risk_manager',
        organizationId: createdOrgs[2]?.id || 'default-org-id'
      })),
      
      // Specialized test users
      {
        email: 'api-test@test.com',
        password: 'ApiTestPassword123!',
        firstName: 'API',
        lastName: 'Tester',
        role: 'admin',
        organizationId: createdOrgs[2]?.id || 'default-org-id'
      },
      {
        email: 'upload-test@test.com',
        password: 'UploadTestPassword123!',
        firstName: 'Upload',
        lastName: 'Tester',
        role: 'risk_manager',
        organizationId: createdOrgs[2]?.id || 'default-org-id'
      }
    ];
    
    // Create users in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize);
      
      const promises = batch.map(user => 
        page.request.post(`${baseURL}/api/test/users`, { data: user })
      );
      
      await Promise.all(promises);
      console.log(`  ✅ Created ${batch.length} users (batch ${Math.floor(i / batchSize) + 1})`);
    }
    
    // 5. Create sample data for testing
    console.log('📊 Creating sample test data...');
    
    // Create sample risks for each organization
    for (const org of createdOrgs) {
      const sampleRisks = [
        {
          title: `${org.name} Data Privacy Risk`,
          description: 'Risk of unauthorized access to customer data',
          category: 'compliance',
          likelihood: 3,
          impact: {
            financial: 4,
            operational: 3,
            reputational: 5,
            regulatory: 5
          },
          organizationId: org.id
        },
        {
          title: `${org.name} Operational Risk`,
          description: 'Risk of business process failure',
          category: 'operational',
          likelihood: 2,
          impact: {
            financial: 3,
            operational: 5,
            reputational: 2,
            regulatory: 1
          },
          organizationId: org.id
        }
      ];
      
      for (const risk of sampleRisks) {
        await page.request.post(`${baseURL}/api/test/risks`, { data: risk });
      }
      
      console.log(`  ✅ Created sample risks for ${org.name}`);
    }
    
    // Create sample controls
    for (const org of createdOrgs) {
      const sampleControls = [
        {
          name: `${org.name} Access Control`,
          description: 'Multi-factor authentication and role-based access',
          type: 'preventive',
          frequency: 'continuous',
          effectiveness: 4,
          organizationId: org.id
        },
        {
          name: `${org.name} Data Monitoring`,
          description: 'Continuous monitoring of data access and usage',
          type: 'detective',
          frequency: 'daily',
          effectiveness: 3,
          organizationId: org.id
        }
      ];
      
      for (const control of sampleControls) {
        await page.request.post(`${baseURL}/api/test/controls`, { data: control });
      }
      
      console.log(`  ✅ Created sample controls for ${org.name}`);
    }
    
    // 6. Create test documents
    console.log('📄 Creating test documents...');
    
    const testDocuments = [
      {
        title: 'Privacy Policy Template',
        content: 'Sample privacy policy content for testing',
        type: 'policy',
        classification: 'internal'
      },
      {
        title: 'Security Procedure',
        content: 'Sample security procedure content for testing',
        type: 'procedure',
        classification: 'confidential'
      }
    ];
    
    for (const doc of testDocuments) {
      await page.request.post(`${baseURL}/api/test/documents`, { data: doc });
    }
    
    console.log('  ✅ Created test documents');
    
    // 7. Set up performance monitoring
    console.log('📈 Setting up performance monitoring...');
    
    await page.request.post(`${baseURL}/api/test/performance/setup`, {
      data: { enableMonitoring: true }
    });
    
    console.log('  ✅ Performance monitoring enabled');
    
    // 8. Create test fixtures
    console.log('🏗️ Creating test fixtures...');
    
    // Store test data in global state for use in tests
    const testData = {
      organizations: createdOrgs,
      baseURL,
      setupComplete: true,
      timestamp: new Date().toISOString()
    };
    
    // Save test data to file for access during tests
    await page.evaluate((data) => {
      (globalThis as any).testSetupData = data;
    }, testData);
    
    console.log('✅ Global test setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup; 