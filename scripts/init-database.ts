#!/usr/bin/env tsx

/**
 * Database Initialization Script
 * 
 * This script initializes the database by:
 * 1. Checking database connectivity
 * 2. Running Prisma migrations
 * 3. Verifying schema integrity
 * 4. Setting up initial configuration
 * 5. Creating default data if needed
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { connectDatabase, checkDatabaseConnectionDetailed, disconnectDatabase } from '../src/lib/db';

const execAsync = promisify(exec);

interface InitOptions {
  force?: boolean;
  seed?: boolean;
  verbose?: boolean;
  skipMigrations?: boolean;
}

class DatabaseInitializer {
  private options: InitOptions;
  
  constructor(options: InitOptions = {}) {
    this.options = options;
  }
  
  /**
   * Main initialization process
   */
  async initialize(): Promise<void> {
    console.log('🚀 Starting database initialization...\n');
    
    try {
      // Step 1: Validate environment
      await this.validateEnvironment();
      
      // Step 2: Check database connectivity
      await this.checkConnectivity();
      
      // Step 3: Run migrations
      if (!this.options.skipMigrations) {
        await this.runMigrations();
      }
      
      // Step 4: Verify schema
      await this.verifySchema();
      
      // Step 5: Seed database if requested
      if (this.options.seed) {
        await this.seedDatabase();
      }
      
      // Step 6: Final health check
      await this.finalHealthCheck();
      
      console.log('✅ Database initialization completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    } finally {
      await disconnectDatabase();
    }
  }
  
  /**
   * Validate required environment variables
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');
    
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please ensure your .env file contains all required database configuration.'
      );
    }
    
    // Validate DATABASE_URL format
    try {
      const dbUrl = new URL(process.env.DATABASE_URL!);
      if (!['postgresql:', 'postgres:'].includes(dbUrl.protocol)) {
        throw new Error('DATABASE_URL must be a PostgreSQL connection string');
      }
    } catch (error) {
      throw new Error(
        `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
        'Expected format: postgresql://username:password@host:port/database'
      );
    }
    
    console.log('✅ Environment validation passed');
  }
  
  /**
   * Check database connectivity
   */
  private async checkConnectivity(): Promise<void> {
    console.log('🔗 Checking database connectivity...');
    
    try {
      await connectDatabase();
      const healthCheck = await checkDatabaseConnectionDetailed();
      
      if (!healthCheck.isHealthy) {
        throw new Error(`Database connection failed: ${healthCheck.error}`);
      }
      
      console.log(`✅ Connected to database (${healthCheck.responseTime}ms)`);
      if (healthCheck.connectionInfo.version) {
        console.log(`📊 Database version: ${healthCheck.connectionInfo.version.split(' ')[0]}`);
      }
      
    } catch (error) {
      console.error('❌ Database connectivity check failed');
      throw error;
    }
  }
  
  /**
   * Run Prisma migrations
   */
  private async runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');
    
    try {
      // Check migration status first
      const { stdout: statusOutput } = await execAsync('npx prisma migrate status');
      
      if (this.options.verbose) {
        console.log('Migration status:', statusOutput);
      }
      
      // Deploy migrations
      const migrateCommand = this.options.force 
        ? 'npx prisma migrate deploy --force' 
        : 'npx prisma migrate deploy';
        
      const { stdout: migrateOutput, stderr: migrateError } = await execAsync(migrateCommand);
      
      if (migrateError && !migrateError.includes('No pending migrations')) {
        console.warn('⚠️  Migration warnings:', migrateError);
      }
      
      if (this.options.verbose) {
        console.log('Migration output:', migrateOutput);
      }
      
      console.log('✅ Database migrations completed');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      // Provide helpful error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('database does not exist')) {
        console.log('\n💡 Hint: Create the database first:');
        console.log('   createdb riscura  # or your database name');
      } else if (errorMessage.includes('permission denied')) {
        console.log('\n💡 Hint: Check database permissions for the user');
      }
      
      throw error;
    }
  }
  
  /**
   * Verify database schema integrity
   */
  private async verifySchema(): Promise<void> {
    console.log('🔍 Verifying database schema...');
    
    try {
      // Generate Prisma client to ensure schema is up to date
      await execAsync('npx prisma generate');
      
      // Validate schema against database
      const { stdout, stderr } = await execAsync('npx prisma db pull --print');
      
      if (stderr && !stderr.includes('warnings')) {
        console.warn('⚠️  Schema validation warnings:', stderr);
      }
      
      console.log('✅ Database schema verified');
      
    } catch (error) {
      console.error('❌ Schema verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Seed database with initial data
   */
  private async seedDatabase(): Promise<void> {
    console.log('🌱 Seeding database...');
    
    try {
      const seedScript = this.options.force ? 'seed-simple.ts' : 'seed.ts';
      const seedCommand = `npx tsx prisma/${seedScript}`;
      
      const { stdout, stderr } = await execAsync(seedCommand);
      
      if (stderr) {
        console.warn('⚠️  Seeding warnings:', stderr);
      }
      
      if (this.options.verbose && stdout) {
        console.log('Seed output:', stdout);
      }
      
      console.log('✅ Database seeding completed');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      
      // Don't fail initialization if seeding fails
      console.log('⚠️  Continuing without seeding...');
    }
  }
  
  /**
   * Final health check
   */
  private async finalHealthCheck(): Promise<void> {
    console.log('🏥 Running final health check...');
    
    try {
      const healthCheck = await checkDatabaseConnectionDetailed();
      
      if (!healthCheck.isHealthy) {
        throw new Error(`Final health check failed: ${healthCheck.error}`);
      }
      
      console.log('✅ Final health check passed');
      console.log(`📊 Connection info:`);
      console.log(`   - Response time: ${healthCheck.responseTime}ms`);
      console.log(`   - Active connections: ${healthCheck.connectionInfo.activeConnections || 'N/A'}`);
      console.log(`   - Max connections: ${healthCheck.connectionInfo.maxConnections || 'N/A'}`);
      
    } catch (error) {
      console.error('❌ Final health check failed:', error);
      throw error;
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): InitOptions {
  const args = process.argv.slice(2);
  const options: InitOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--force':
        options.force = true;
        break;
      case '--seed':
        options.seed = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--skip-migrations':
        options.skipMigrations = true;
        break;
      case '--help':
        console.log(`
Database Initialization Script

Usage: tsx scripts/init-database.ts [options]

Options:
  --force             Force migrations and seeding
  --seed              Run database seeding after migrations
  --verbose           Enable verbose output
  --skip-migrations   Skip running migrations
  --help              Show this help message

Examples:
  tsx scripts/init-database.ts                    # Basic initialization
  tsx scripts/init-database.ts --seed            # Initialize with seeding
  tsx scripts/init-database.ts --force --verbose # Force with verbose output
        `);
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
        break;
    }
  }
  
  return options;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    const initializer = new DatabaseInitializer(options);
    
    await initializer.initialize();
    
    console.log('🎉 Database is ready for use!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Initialization failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure PostgreSQL is running');
    console.log('3. Verify database exists and is accessible');
    console.log('4. Check user permissions');
    console.log('\nFor help: tsx scripts/init-database.ts --help');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseInitializer }; 