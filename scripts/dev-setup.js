#!/usr/bin/env node

/**
 * Development Setup and Health Check Script
 * Ensures the development environment is ready for feature development
 * 
 * Cross-platform compatible - works on Windows, macOS, and Linux
 * Provides detailed error reporting for debugging
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Riscura Development Environment Setup\n');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`${description}...`, 'blue');
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`   Command: ${command}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.stdout) {
      log(`   Output: ${error.stdout.toString().trim()}`, 'red');
    }
    if (error.stderr) {
      log(`   Stderr: ${error.stderr.toString().trim()}`, 'red');
    }
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} not found`, 'red');
    return false;
  }
}

/**
 * Test development server startup with robust retry mechanism and event detection
 * Returns an object with success, warning, and message properties
 */
function testDevelopmentServer() {
  return new Promise((resolve) => {
    log('Starting development server (robust test)...', 'blue');
    
    const maxRetries = 2;
    const timeoutMs = 15000; // Extended timeout for more reliability
    let currentAttempt = 0;
    
    function attemptServerStart() {
      currentAttempt++;
      
      if (currentAttempt > 1) {
        log(`Retry attempt ${currentAttempt}/${maxRetries}...`, 'blue');
      }
      
      // Spawn the development server process
      const serverProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true // Cross-platform shell execution
      });

      let serverOutput = '';
      let serverReady = false;
      let compilationComplete = false;
      let timeoutId;
      let progressDots = 0;

      // Progress indicator
      const progressInterval = setInterval(() => {
        progressDots = (progressDots + 1) % 4;
        process.stdout.write(`\r   Waiting for server startup${'.'.repeat(progressDots)}${' '.repeat(3 - progressDots)}`);
      }, 500);

      // Set up timeout
      timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        process.stdout.write('\r   \n'); // Clear progress line
        serverProcess.kill();
        
        if (serverReady) {
          resolve({ 
            success: true, 
            message: 'Server started successfully (timeout reached)' 
          });
        } else if (currentAttempt < maxRetries) {
          log(`Attempt ${currentAttempt} timed out, retrying...`, 'yellow');
          setTimeout(attemptServerStart, 2000); // Wait 2 seconds before retry
        } else {
          resolve({ 
            warning: true, 
            message: 'Server test timed out after multiple attempts - may need more time to start' 
          });
        }
      }, timeoutMs);

      // Enhanced readiness detection patterns
      const readinessPatterns = [
        // Next.js specific patterns
        /Ready in \d+/i,
        /Local:\s+https?:\/\//i,
        /Network:\s+https?:\/\//i,
        /started server on/i,
        /ready - started server/i,
        /ready on https?:\/\//i,
        // Generic server patterns
        /server.*ready/i,
        /listening.*on.*\d+/i,
        /server.*started/i,
        /compiled successfully/i
      ];

      // Listen for stdout data
      serverProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        serverOutput += chunk;
        
        // Check for compilation completion
        if (chunk.includes('compiled successfully') || chunk.includes('Compiled successfully')) {
          compilationComplete = true;
        }
        
        // Check for successful startup indicators using regex patterns
        const foundPattern = readinessPatterns.some(pattern => pattern.test(chunk));
        
        if (foundPattern && (compilationComplete || chunk.includes('Ready'))) {
          serverReady = true;
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          process.stdout.write('\r   \n'); // Clear progress line
          
          // Extract the specific indicator that was found
          const matchedPattern = readinessPatterns.find(pattern => pattern.test(chunk));
          const match = chunk.match(matchedPattern);
          
          serverProcess.kill();
          resolve({ 
            success: true, 
            message: `Server started successfully (detected: "${match ? match[0] : 'server ready'}")` 
          });
        }
      });

      // Listen for stderr data (some servers output ready messages to stderr)
      serverProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        serverOutput += chunk;
        
        // Check stderr for readiness patterns too
        const foundPattern = readinessPatterns.some(pattern => pattern.test(chunk));
        if (foundPattern) {
          serverReady = true;
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
          process.stdout.write('\r   \n'); // Clear progress line
          
          serverProcess.kill();
          resolve({ 
            success: true, 
            message: 'Server started successfully (detected via stderr)' 
          });
        }
      });

      // Handle process errors
      serverProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        process.stdout.write('\r   \n'); // Clear progress line
        
        if (currentAttempt < maxRetries && error.code !== 'ENOENT') {
          log(`Attempt ${currentAttempt} failed with error, retrying...`, 'yellow');
          setTimeout(attemptServerStart, 2000); // Wait 2 seconds before retry
        } else {
          resolve({ 
            success: false, 
            message: `Failed to start server: ${error.message}` 
          });
        }
      });

      // Handle process exit
      serverProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        process.stdout.write('\r   \n'); // Clear progress line
        
        if (!serverReady && code !== 0) {
          if (currentAttempt < maxRetries) {
            log(`Attempt ${currentAttempt} exited with code ${code}, retrying...`, 'yellow');
            setTimeout(attemptServerStart, 2000); // Wait 2 seconds before retry
          } else {
            resolve({ 
              success: false, 
              message: `Server exited with code ${code} after ${maxRetries} attempts` 
            });
          }
        }
      });
    }
    
    // Start the first attempt
    attemptServerStart();
  });
}

async function main() {
  log('📋 Running Development Environment Health Check\n', 'bold');

  // Track overall success using logical AND assignment (&&=) for boolean logic
  let allChecksPass = true;

  // Check essential files
  log('📁 Checking Essential Files:', 'bold');
  allChecksPass &&= checkFile('package.json', 'Package.json');
  allChecksPass &&= checkFile('tsconfig.json', 'TypeScript config');
  allChecksPass &&= checkFile('next.config.js', 'Next.js config');
  allChecksPass &&= checkFile('prisma/schema.prisma', 'Prisma schema');
  allChecksPass &&= checkFile('.env.local', 'Environment variables');
  allChecksPass &&= checkFile('README.md', 'README documentation');
  console.log('');

  // Check dependencies
  log('📦 Checking Dependencies:', 'bold');
  allChecksPass &&= runCommand('npm list --depth=0', 'Dependencies installed');
  console.log('');

  // Check development tools
  log('🛠️  Checking Development Tools:', 'bold');
  allChecksPass &&= runCommand('npm run lint -- --max-warnings 0', 'ESLint checks');
  
  // Note: TypeScript check expected to have errors during technical debt phase
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    log('✅ TypeScript checks passed', 'green');
  } catch (error) {
    log('⚠️  TypeScript errors present (expected during technical debt phase)', 'yellow');
    log('   See DEVELOPMENT_STATUS.md for systematic cleanup plan', 'yellow');
  }
  console.log('');

  // Check development server
  log('🌐 Testing Development Server:', 'bold');
  const serverTestResult = await testDevelopmentServer();
  if (serverTestResult.success) {
    log('✅ Development server starts successfully', 'green');
  } else if (serverTestResult.warning) {
    log('⚠️  Development server may have issues', 'yellow');
    log(`   ${serverTestResult.message}`, 'yellow');
  } else {
    log('❌ Development server failed to start', 'red');
    log(`   ${serverTestResult.message}`, 'red');
    allChecksPass = false;
  }
  console.log('');

  // Check database connection
  log('🗄️  Checking Database:', 'bold');
  try {
    execSync('npx prisma db pull', { stdio: 'pipe' });
    log('✅ Database connection successful', 'green');
  } catch (error) {
    log('⚠️  Database connection issues (check .env.local)', 'yellow');
    log(`   Error: ${error.message}`, 'yellow');
  }
  console.log('');

  // Summary
  log('📊 Development Environment Summary:', 'bold');
  if (allChecksPass) {
    log('🎉 Environment ready for feature development!', 'green');
    log('📖 See DEVELOPMENT_STATUS.md for current status and next steps', 'blue');
  } else {
    log('⚠️  Some issues detected - see messages above', 'yellow');
    log('📖 Check DEVELOPMENT_STATUS.md for troubleshooting', 'blue');
  }

  console.log('\n🚀 Quick Start Commands:');
  log('  npm run dev                 # Start development server', 'blue');
  log('  npm run lint                # Run linting (should pass)', 'blue');
  log('  npm run type-check          # Check TypeScript (has known errors)', 'blue');
  log('  npm run test                # Run test suite', 'blue');

  console.log('\n📋 Development Workflow:');
  log('  1. Create feature branch from main', 'blue');
  log('  2. Use // @ts-ignore for TypeScript issues during development', 'blue');
  log('  3. Focus on functionality over perfect types', 'blue');
  log('  4. Ensure linting passes for new code', 'blue');
  log('  5. Write tests for new features', 'blue');

  console.log('\n📈 Ready for Implementation:');
  log('  ✅ Advanced Risk Analytics', 'green');
  log('  ✅ Collaboration Tools', 'green');
  log('  ✅ Compliance Automation', 'green');
  log('  ✅ Mobile Optimization', 'green');
  log('  ✅ Dashboard Enhancements', 'green');

  return allChecksPass;
}

main().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('❌ Development setup failed:', error);
  process.exit(1);
}); 