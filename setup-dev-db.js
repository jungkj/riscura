const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up development database...');

// Create .env.local with SQLite configuration if it doesn't exist
const envLocalPath = path.join(__dirname, '.env.local');
let envContent = '';

if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
}

// Update DATABASE_URL to use SQLite
if (envContent.includes('DATABASE_URL=')) {
  envContent = envContent.replace(
    /DATABASE_URL="[^"]*"/g,
    'DATABASE_URL="file:./dev.db"'
  );
} else {
  envContent += '\nDATABASE_URL="file:./dev.db"\n';
}

// Update DIRECT_URL to use SQLite
if (envContent.includes('DIRECT_URL=')) {
  envContent = envContent.replace(
    /DIRECT_URL="[^"]*"/g,
    'DIRECT_URL="file:./dev.db"'
  );
} else {
  envContent += 'DIRECT_URL="file:./dev.db"\n';
}

// Ensure NODE_ENV is set to development
if (!envContent.includes('NODE_ENV=')) {
  envContent += 'NODE_ENV="development"\n';
}

fs.writeFileSync(envLocalPath, envContent);
console.log('✅ Updated .env.local with SQLite configuration');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push database schema
  console.log('🗄️ Creating database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // Seed database with demo data
  console.log('🌱 Seeding database with demo data...');
  execSync('npx tsx prisma/seed-simple.ts', { stdio: 'inherit' });
  
  console.log('✅ Development database setup complete!');
  console.log('🚀 You can now run: npm run dev');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
} 