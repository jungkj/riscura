import { test as cleanup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Authentication Cleanup for E2E Tests
 *
 * This cleanup runs after tests to clean up authentication files and test data.
 */

cleanup('cleanup auth files', async () => {
  console.log('Cleaning up authentication files...');

  const authFiles = ['src/__tests__/e2e/.auth/user.json', 'src/__tests__/e2e/.auth/admin.json'];

  authFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Removed auth file: ${file}`);
    }
  });
});

cleanup('cleanup test data', async ({ request }) => {
  console.log('Cleaning up test data...');

  try {
    const response = await request.post('/api/test/cleanup-data', {
      data: {
        removeTestUsers: false, // Keep test users for reuse
        removeTestRisks: true,
        removeTestAssessments: true,
      },
    });

    if (response.status() === 200) {
      console.log('Test data cleanup successful');
    } else {
      console.log('Test data cleanup API not available - manual cleanup may be needed');
    }
  } catch (error) {
    console.log('Test data cleanup API not available - continuing');
  }
});
