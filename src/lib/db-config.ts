// Temporary database configuration override for production
// This file ensures the pooled URL is used even if environment variables are misconfigured

export function getProductionDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL || process.env.database_url;

  // Only apply in production for the specific project
  if (
    process.env.NODE_ENV === 'production' &&
    rawUrl?.includes('db.zggstcxinvxsfksssdyr.supabase.co')
  ) {
    console.log('🚨 Applying production database URL override');

    // Extract password from the direct URL
    const passwordMatch = rawUrl.match(/postgres:([^@]+)@/);
    if (passwordMatch) {
      const password = passwordMatch[1];
      const pooledUrl = `postgresql://postgres.zggstcxinvxsfksssdyr:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
      console.log('✅ Converted to pooled URL for production');
      return pooledUrl;
    }
  }

  return rawUrl;
}
