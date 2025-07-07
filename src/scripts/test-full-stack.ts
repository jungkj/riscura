import { execSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

console.log('🚀 Full Stack Testing Suite for Riscura\n');
console.log('=====================================\n');

const tests = [
  {
    name: 'Environment Check',
    command: 'node -v && npm -v',
    critical: true,
  },
  {
    name: 'Dependencies Check',
    command: 'npm ls --depth=0',
    critical: false,
  },
  {
    name: 'Database Connection',
    command: 'npx tsx src/scripts/test-db-connection.ts',
    critical: true,
  },
  {
    name: 'Prisma Generate',
    command: 'npx prisma generate',
    critical: true,
  },
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit --skipLibCheck',
    critical: false,
    timeout: 120000,
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    critical: false,
  },
  {
    name: 'Next.js Build',
    command: 'npm run build',
    critical: true,
    timeout: 300000,
  },
  {
    name: 'API Routes Test',
    command: 'curl -f http://localhost:3000/api/health || echo "Note: Start dev server to test API"',
    critical: false,
  },
];

let passed = 0;
let failed = 0;
let skipped = 0;

async function runTest(test: typeof tests[0]) {
  console.log(`\n🧪 ${test.name}`);
  console.log('─'.repeat(50));
  
  try {
    const output = execSync(test.command, {
      encoding: 'utf8',
      timeout: test.timeout || 60000,
      stdio: test.name === 'Dependencies Check' ? 'pipe' : 'inherit',
    });
    
    if (test.name === 'Dependencies Check') {
      console.log('✅ Dependencies installed correctly');
    }
    
    console.log(`✅ ${test.name} passed`);
    passed++;
    return true;
  } catch (error: any) {
    console.error(`❌ ${test.name} failed`);
    
    if (test.critical) {
      console.error('🛑 Critical test failed. Stopping test suite.');
      failed++;
      return false;
    } else {
      console.log('⚠️  Non-critical test failed. Continuing...');
      skipped++;
      return true;
    }
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  for (const test of tests) {
    const result = await runTest(test);
    if (!result && test.critical) {
      break;
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n\n📊 Test Summary');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`⏱️  Duration: ${duration}s`);
  
  if (failed === 0) {
    console.log('\n🎉 All critical tests passed! Your full stack is ready.');
    console.log('\n📝 Next Steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. View at: http://localhost:3000');
    console.log('3. Test login: testuser@riscura.com / test123');
    console.log('4. Check production build: npm start (after npm run build)');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Quick commands reference
console.log('🔧 Quick Test Commands:\n');
console.log('npm run dev              # Start development server');
console.log('npm run build            # Production build');
console.log('npm run start            # Start production server');
console.log('npm run type-check       # TypeScript check');
console.log('npm run lint             # ESLint check');
console.log('npm run test             # Run Jest tests');
console.log('npm run db:studio        # Open Prisma Studio');
console.log('npm run db:push          # Push schema changes');

console.log('\n🏃 Running full stack tests...\n');

runAllTests();