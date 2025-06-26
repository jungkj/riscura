#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Running comprehensive TypeScript checks...\n');

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
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
    // 1. TypeScript Compilation Check
    console.log('🔧 Step 1: TypeScript Compilation Check');
    console.log('─'.repeat(50));
    try {
      await runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck']);
    } catch (error) {
      hasErrors = true;
      console.log('💥 TypeScript compilation failed!\n');
    }

    // 2. Next.js Type Check
    console.log('🏗️  Step 2: Next.js Build Type Check');
    console.log('─'.repeat(50));
    try {
      await runCommand('npx', ['next', 'build', '--no-lint']);
    } catch (error) {
      hasErrors = true;
      console.log('💥 Next.js build failed!\n');
    }

    // 3. ESLint TypeScript Rules
    console.log('📝 Step 3: ESLint TypeScript Rules');
    console.log('─'.repeat(50));
    try {
      await runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx', '--max-warnings', '0']);
    } catch (error) {
      console.log('⚠️  ESLint found issues (not blocking)\n');
    }

    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('📊 SUMMARY');
    console.log('═'.repeat(50));
    console.log(`⏱️  Total time: ${duration}s`);
    
    if (hasErrors) {
      console.log('❌ Type checking FAILED!');
      console.log('🔧 Please fix the above errors before deploying.\n');
      process.exit(1);
    } else {
      console.log('✅ All type checks PASSED!');
      console.log('🚀 Ready for deployment.\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Type checking script failed:', error.message);
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Type checking interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Type checking terminated');
  process.exit(1);
});

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 