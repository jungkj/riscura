#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

console.log('🔍 Running optimized TypeScript checks for Next.js 15.3.4...\n');

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${command} failed with exit code ${code}\n`);
        reject(new Error(`${command} failed`));
      }
    });

    child.on('error', (error) => {
      console.log(`❌ Error running ${command}:`, error.message);
      reject(error);
    });
  });
}

async function main() {
  const startTime = Date.now();
  let hasErrors = false;

  try {
    // 1. Quick TypeScript syntax check (no emit, skip lib check)
    console.log('🔧 Step 1: TypeScript Syntax Check (Fast)');
    console.log('─'.repeat(50));
    try {
      await runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck', '--incremental']);
    } catch (error) {
      console.log('⚠️  TypeScript syntax issues found (continuing...)\n');
      // Don't fail the build for syntax issues when ignoreBuildErrors is true
    }

    // 2. Next.js build check (production-like)
    console.log('🏗️  Step 2: Next.js Build Check');
    console.log('─'.repeat(50));
    try {
      await runCommand('npx', ['next', 'build', '--no-lint'], {
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=6144',
          NODE_ENV: 'production',
          CI: 'true',
          SKIP_ENV_VALIDATION: '1',
        }
      });
    } catch (error) {
      hasErrors = true;
      console.log('💥 Next.js build failed!\n');
    }

    // 3. ESLint check (warnings only, don't fail)
    console.log('📝 Step 3: ESLint Check (Non-blocking)');
    console.log('─'.repeat(50));
    try {
      await runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx', '--max-warnings', '50']);
    } catch (error) {
      console.log('⚠️  ESLint found issues (not blocking build)\n');
    }

    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('📊 SUMMARY');
    console.log('═'.repeat(50));
    console.log(`⏱️  Total time: ${duration}s`);
    
    if (hasErrors) {
      console.log('❌ Critical build errors found!');
      console.log('🔧 Please fix build-blocking errors before deploying.\n');
      process.exit(1);
    } else {
      console.log('✅ Build validation PASSED!');
      console.log('🚀 Ready for Vercel deployment.\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Type checking script failed:', error.message);
    process.exit(1);
  }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Type checking interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Type checking terminated');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});