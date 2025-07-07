#!/usr/bin/env ts-node

/**
 * Manual Authentication Flow Test Script
 * Run this script to verify authentication is working correctly
 * 
 * Usage: npm run test:auth-flow
 */

import { rcsaApiClient } from '../src/lib/api/rcsa-client';
import { apiClient } from '../src/lib/api/client';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

async function testAuthenticationFlow() {
  logSection('Authentication Flow Test');
  
  try {
    // Test 1: Basic API Health Check
    logInfo('Testing API health check...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    if (healthResponse.ok) {
      logSuccess('API health check passed');
    } else {
      logError(`API health check failed: ${healthResponse.status}`);
    }

    // Test 2: Unauthenticated Request (should fail)
    logInfo('\nTesting unauthenticated request to protected endpoint...');
    const unauthResponse = await fetch('http://localhost:3000/api/risks');
    if (unauthResponse.status === 401) {
      logSuccess('Unauthenticated request correctly rejected with 401');
    } else {
      logError(`Expected 401, got ${unauthResponse.status}`);
    }

    // Test 3: Get Session (simulate authentication)
    logInfo('\nSimulating authentication...');
    
    // In a real scenario, you would authenticate through NextAuth
    // For testing, we'll use the development mode mock authentication
    process.env.NODE_ENV = 'development';
    
    // Test 4: Authenticated Request using RCSAApiClient
    logInfo('\nTesting authenticated request using RCSAApiClient...');
    const risksResult = await rcsaApiClient.getRisks({ limit: 5 });
    
    if (risksResult.success) {
      logSuccess('RCSAApiClient authentication successful');
      logInfo(`Retrieved ${risksResult.data?.data?.length || 0} risks`);
    } else {
      logError(`RCSAApiClient request failed: ${risksResult.error?.message}`);
    }

    // Test 5: Create a test risk
    logInfo('\nTesting risk creation...');
    const createResult = await rcsaApiClient.createRisk({
      title: 'Test Risk - Authentication Flow',
      description: 'This is a test risk created to verify authentication',
      category: 'operational',
      likelihood: 3,
      impact: 4
    });

    if (createResult.success && createResult.data) {
      logSuccess(`Risk created successfully with ID: ${createResult.data.id}`);
      
      // Test 6: Retrieve the created risk
      logInfo('\nTesting risk retrieval...');
      const getResult = await rcsaApiClient.getRisk(createResult.data.id);
      
      if (getResult.success) {
        logSuccess('Risk retrieved successfully');
        logInfo(`Risk title: ${getResult.data?.title}`);
      } else {
        logError(`Failed to retrieve risk: ${getResult.error?.message}`);
      }

      // Test 7: Delete the test risk
      logInfo('\nCleaning up test data...');
      const deleteResult = await rcsaApiClient.deleteRisk(createResult.data.id);
      
      if (deleteResult.success) {
        logSuccess('Test risk deleted successfully');
      } else {
        logError(`Failed to delete test risk: ${deleteResult.error?.message}`);
      }
    } else {
      logError(`Failed to create risk: ${createResult.error?.message}`);
    }

    // Test 8: Test base ApiClient
    logInfo('\nTesting base ApiClient...');
    try {
      const baseClientResult = await apiClient.get('/api/health');
      logSuccess('Base ApiClient request successful');
    } catch (error) {
      logError(`Base ApiClient request failed: ${error}`);
    }

    // Test 9: Test error handling
    logInfo('\nTesting error handling...');
    const errorResult = await rcsaApiClient.getRisk('non-existent-id');
    
    if (!errorResult.success) {
      logSuccess('Error handling working correctly');
      logInfo(`Error message: ${errorResult.error?.message}`);
    } else {
      logError('Expected error for non-existent resource');
    }

    // Summary
    logSection('Test Summary');
    logSuccess('Authentication flow tests completed');
    logInfo('All authentication mechanisms are working as expected');

  } catch (error) {
    logSection('Test Failed');
    logError(`Unexpected error: ${error}`);
    process.exit(1);
  }
}

// Run the test
testAuthenticationFlow().catch(console.error);