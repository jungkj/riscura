#!/usr/bin/env node

/**
 * Comprehensive test runner for Riscura application
 * Runs all test suites with detailed reporting and coverage analysis
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface TestRunSummary {
  results: TestResult[];
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  overallCoverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class ComprehensiveTestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  constructor() {
    console.log('🚀 Starting Comprehensive Test Suite for Riscura\n');
    console.log('=' .repeat(60));
  }

  async runAllTests(): Promise<void> {
    const testSuites = [
      {
        name: 'Unit Tests - Billing System',
        command: 'npm test -- src/__tests__/unit/billing',
        critical: true,
      },
      {
        name: 'Unit Tests - API Middleware',
        command: 'npm test -- src/__tests__/unit/middleware',
        critical: true,
      },
      {
        name: 'Integration Tests - Billing API',
        command: 'npm test -- src/__tests__/integration/api/billing',
        critical: true,
      },
      {
        name: 'Performance Tests - API',
        command: 'npm test -- src/__tests__/integration/performance',
        critical: false,
      },
      {
        name: 'Unit Tests - Services',
        command: 'npm test -- src/__tests__/unit/services',
        critical: false,
      },
      {
        name: 'Integration Tests - API Routes',
        command: 'npm test -- src/__tests__/integration/api/risks.test.ts',
        critical: false,
      },
      {
        name: 'Component Tests',
        command: 'npm test -- src/__tests__/unit/components',
        critical: false,
      },
    ];

    console.log(`Running ${testSuites.length} test suites...\n`);

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    await this.generateCoverageReport();
    this.generateSummary();
    this.generateRecommendations();
  }

  private async runTestSuite(suite: {
    name: string;
    command: string;
    critical: boolean;
  }): Promise<void> {
    console.log(`\n📋 Running: ${suite.name}`);
    console.log('-'.repeat(50));

    const startTime = Date.now();
    let testResult: TestResult;

    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: 120000, // 2 minutes timeout
      });

      const duration = Date.now() - startTime;
      testResult = this.parseTestOutput(suite.name, output, duration);
      
      console.log(`✅ ${suite.name} completed successfully`);
      console.log(`   Tests: ${testResult.passed} passed, ${testResult.failed} failed`);
      console.log(`   Duration: ${duration}ms`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${suite.name} failed`);
      
      if (error.stdout) {
        testResult = this.parseTestOutput(suite.name, error.stdout, duration);
      } else {
        testResult = {
          suite: suite.name,
          passed: 0,
          failed: 1,
          duration,
        };
      }

      console.log(`   Tests: ${testResult.passed} passed, ${testResult.failed} failed`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Error: ${error.message.split('\n')[0]}`);

      if (suite.critical) {
        console.log(`\n💥 Critical test suite failed! Stopping execution.`);
        process.exit(1);
      }
    }

    this.results.push(testResult);
  }

  private parseTestOutput(suiteName: string, output: string, duration: number): TestResult {
    // Parse Jest output for test results
    const testPattern = /Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/;
    const coveragePattern = /All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/;

    const testMatch = output.match(testPattern);
    const coverageMatch = output.match(coveragePattern);

    let passed = 0;
    let failed = 0;

    if (testMatch) {
      failed = parseInt(testMatch[1], 10);
      passed = parseInt(testMatch[2], 10);
    } else {
      // Try alternative pattern for passing tests
      const passPattern = /Tests:\s+(\d+) passed, (\d+) total/;
      const passMatch = output.match(passPattern);
      if (passMatch) {
        passed = parseInt(passMatch[1], 10);
        failed = 0;
      }
    }

    const result: TestResult = {
      suite: suiteName,
      passed,
      failed,
      duration,
    };

    if (coverageMatch) {
      result.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4]),
      };
    }

    return result;
  }

  private async generateCoverageReport(): Promise<void> {
    console.log('\n📊 Generating comprehensive coverage report...');
    
    try {
      const coverageOutput = execSync('npm test -- --coverage --watchAll=false', {
        encoding: 'utf8',
        timeout: 180000, // 3 minutes
      });

      console.log('✅ Coverage report generated successfully');
      
      // Save coverage to file
      const coverageDir = join(process.cwd(), 'test-results');
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      
      writeFileSync(
        join(coverageDir, 'coverage-output.txt'),
        coverageOutput
      );

    } catch (error: any) {
      console.log('⚠️  Coverage report generation had issues');
      console.log(`   Error: ${error.message.split('\n')[0]}`);
    }
  }

  private generateSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📈 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));

    const summary: TestRunSummary = {
      results: this.results,
      totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed, 0),
      totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
      totalDuration: Date.now() - this.startTime,
      overallCoverage: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    };

    // Calculate average coverage
    const coverageResults = this.results.filter(r => r.coverage);
    if (coverageResults.length > 0) {
      summary.overallCoverage = {
        lines: coverageResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / coverageResults.length,
        functions: coverageResults.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) / coverageResults.length,
        branches: coverageResults.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) / coverageResults.length,
        statements: coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / coverageResults.length,
      };
    }

    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.totalPassed} (${(summary.totalPassed / summary.totalTests * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${summary.totalFailed} (${(summary.totalFailed / summary.totalTests * 100).toFixed(1)}%)`);
    console.log(`   Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);

    console.log(`\n📋 Test Suite Breakdown:`);
    this.results.forEach(result => {
      const status = result.failed === 0 ? '✅' : '❌';
      const total = result.passed + result.failed;
      const successRate = total > 0 ? (result.passed / total * 100).toFixed(1) : '0.0';
      
      console.log(`   ${status} ${result.suite}`);
      console.log(`      Tests: ${result.passed}/${total} (${successRate}%)`);
      console.log(`      Duration: ${(result.duration / 1000).toFixed(2)}s`);
      
      if (result.coverage) {
        console.log(`      Coverage: L:${result.coverage.lines.toFixed(1)}% F:${result.coverage.functions.toFixed(1)}% B:${result.coverage.branches.toFixed(1)}% S:${result.coverage.statements.toFixed(1)}%`);
      }
    });

    if (coverageResults.length > 0) {
      console.log(`\n📊 Overall Coverage:`);
      console.log(`   Lines: ${summary.overallCoverage.lines.toFixed(1)}%`);
      console.log(`   Functions: ${summary.overallCoverage.functions.toFixed(1)}%`);
      console.log(`   Branches: ${summary.overallCoverage.branches.toFixed(1)}%`);
      console.log(`   Statements: ${summary.overallCoverage.statements.toFixed(1)}%`);
    }

    // Save summary to JSON
    const resultsDir = join(process.cwd(), 'test-results');
    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }
    
    writeFileSync(
      join(resultsDir, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(`\n💾 Test results saved to: ./test-results/`);
  }

  private generateRecommendations(): void {
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(60));

    const failedSuites = this.results.filter(r => r.failed > 0);
    const lowCoverageSuites = this.results.filter(r => 
      r.coverage && (
        r.coverage.lines < 80 || 
        r.coverage.functions < 80 || 
        r.coverage.branches < 70
      )
    );

    if (failedSuites.length === 0) {
      console.log('🎉 All test suites passed! Excellent work!');
    } else {
      console.log('❌ Failed Test Suites:');
      failedSuites.forEach(suite => {
        console.log(`   • ${suite.suite}: ${suite.failed} failing tests`);
      });
      console.log('\n   Action: Review failing tests and fix issues before deployment');
    }

    if (lowCoverageSuites.length > 0) {
      console.log('\n📉 Low Coverage Areas:');
      lowCoverageSuites.forEach(suite => {
        console.log(`   • ${suite.suite}:`);
        if (suite.coverage!.lines < 80) console.log(`     - Lines: ${suite.coverage!.lines.toFixed(1)}% (target: 80%)`);
        if (suite.coverage!.functions < 80) console.log(`     - Functions: ${suite.coverage!.functions.toFixed(1)}% (target: 80%)`);
        if (suite.coverage!.branches < 70) console.log(`     - Branches: ${suite.coverage!.branches.toFixed(1)}% (target: 70%)`);
      });
      console.log('\n   Action: Add more test cases to improve coverage');
    }

    const slowSuites = this.results.filter(r => r.duration > 30000); // > 30s
    if (slowSuites.length > 0) {
      console.log('\n🐌 Slow Test Suites:');
      slowSuites.forEach(suite => {
        console.log(`   • ${suite.suite}: ${(suite.duration / 1000).toFixed(2)}s`);
      });
      console.log('\n   Action: Optimize slow tests with better mocking and parallel execution');
    }

    console.log('\n✨ Next Steps:');
    console.log('   1. Review and fix any failing tests');
    console.log('   2. Improve test coverage in critical areas');
    console.log('   3. Add integration tests for new features');
    console.log('   4. Set up continuous integration with these tests');
    console.log('   5. Consider adding E2E tests for user workflows');

    // Overall assessment
    const successRate = this.results.reduce((sum, r) => sum + r.passed, 0) / 
                       this.results.reduce((sum, r) => sum + r.passed + r.failed, 0);

    console.log('\n🎯 Overall Assessment:');
    if (successRate >= 0.95) {
      console.log('   EXCELLENT: Test suite is comprehensive and reliable');
    } else if (successRate >= 0.85) {
      console.log('   GOOD: Test suite is solid with room for improvement');
    } else if (successRate >= 0.70) {
      console.log('   FAIR: Test suite needs attention before production');
    } else {
      console.log('   POOR: Critical issues need immediate attention');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the comprehensive test suite
async function main() {
  const runner = new ComprehensiveTestRunner();
  
  try {
    await runner.runAllTests();
    console.log('\n🏁 Comprehensive test execution completed!');
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ComprehensiveTestRunner };