import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

// Import after env vars are loaded
const { storageService } = await import('@/lib/storage/supabase-storage');

async function initializeStorage() {
  // console.log('🗄️  Initializing Supabase Storage buckets...\n');

  try {
    await storageService.initializeBuckets();
    // console.log('\n✅ Storage initialization complete!');

    // console.log('\n📋 Storage Configuration:');
    // console.log('   - Max file size: 10MB per file');
    // console.log('   - Total storage: 1GB (Supabase free tier)');
    // console.log('   - Buckets created: documents, attachments, reports, avatars');

    // console.log('\n🔒 Security Features:');
    // console.log('   - All files are private by default');
    // console.log('   - Files organized by organization/user');
    // console.log('   - Signed URLs for temporary access');
    // console.log('   - MIME type restrictions per bucket');
  } catch (error) {
    // console.error('❌ Failed to initialize storage:', error);
    process.exit(1);
  }
}

initializeStorage();
