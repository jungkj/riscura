import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'src/__tests__/e2e/**/*.spec.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    env: {
      // Test environment variables
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'password123',
      TEST_ADMIN_EMAIL: 'admin@example.com',
      TEST_ADMIN_PASSWORD: 'admin123',
      API_URL: 'http://localhost:3000/api',
    },

    setupNodeEvents(on, config) {
      // Task for seeding test data
      on('task', {
        seedDatabase() {
          // This would seed the test database with known data
          console.log('Seeding test database...');
          return null;
        },
        
        clearDatabase() {
          // This would clear the test database
          console.log('Clearing test database...');
          return null;
        },
        
        log(message) {
          console.log(message);
          return null;
        },
        
        // Generate test user tokens
        generateAuthToken(user) {
          // This would generate a JWT token for testing
          console.log(`Generating auth token for ${user.email}`);
          return 'test-jwt-token';
        }
      });

      // Code coverage (if needed)
      require('@cypress/code-coverage/task')(on, config);
      
      return config;
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/__tests__/components/**/*.cy.tsx',
  },
}); 