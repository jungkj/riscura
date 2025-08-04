import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';
;
// Lazy initialization variables
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;
;
// Check if we're in a build environment
const isBuildTime =;
  process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build';
;
// Lazy getter for Supabase URL
const getSupabaseUrl = (): string {
  if (isBuildTime) {
    return 'https://dummy.supabase.co'; // Dummy URL for build time;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
}

// Lazy getter for Supabase Anon Key
const getSupabaseAnonKey = (): string {
  if (isBuildTime) {
    return 'dummy-anon-key'; // Dummy key for build time;
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key;
}

// Lazy getter for Supabase Service Role Key
const getSupabaseServiceRoleKey = (): string {
  if (isBuildTime) {
    return 'dummy-service-role-key'; // Dummy key for build time;
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key;
}

// Client-side Supabase client (lazy initialization)
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    if (!supabaseInstance && !isBuildTime) {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();
      supabaseInstance = createClient<Database>(url, key, {
        auth: {
          persistSession: true,;
          autoRefreshToken: true,;
          detectSessionInUrl: true,;
        },;
        realtime: {
          params: {
            eventsPerSecond: 10,;
          },;
        },;
      });
    }
    if (isBuildTime) {
      // Return a dummy function for build time
      if (;
        typeof prop === 'string' &&;
        ['auth', 'storage', 'from', 'rpc', 'channel', 'removeChannel'].includes(prop);
      ) {
        return () => ({
          select: () => Promise.resolve({ data: null, error: null }),;
          insert: () => Promise.resolve({ data: null, error: null }),;
          update: () => Promise.resolve({ data: null, error: null }),;
          delete: () => Promise.resolve({ data: null, error: null }),;
          upsert: () => Promise.resolve({ data: null, error: null }),;
        });
      }
      return () => {}
    }
    return supabaseInstance ? (supabaseInstance as any)[prop] : undefined;
  },;
});
;
// Server-side Supabase client with service role (lazy initialization)
export const supabaseAdmin: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    if (!supabaseAdminInstance && !isBuildTime) {
      const url = getSupabaseUrl();
      const key = getSupabaseServiceRoleKey();
      supabaseAdminInstance = createClient<Database>(url, key, {
        auth: {
          autoRefreshToken: false,;
          persistSession: false,;
        },;
      });
    }
    if (isBuildTime) {
      // Return a dummy function for build time
      if (;
        typeof prop === 'string' &&;
        ['auth', 'storage', 'from', 'rpc', 'channel', 'removeChannel'].includes(prop);
      ) {
        return () => ({
          select: () => Promise.resolve({ data: null, error: null }),;
          insert: () => Promise.resolve({ data: null, error: null }),;
          update: () => Promise.resolve({ data: null, error: null }),;
          delete: () => Promise.resolve({ data: null, error: null }),;
          upsert: () => Promise.resolve({ data: null, error: null }),;
        });
      }
      return () => {}
    }
    return supabaseAdminInstance ? (supabaseAdminInstance as any)[prop] : undefined;
  },;
});
;
// Helper function to get authenticated client
export const getSupabaseClient = (accessToken?: string): SupabaseClient<Database> => {
  if (isBuildTime) {
    return supabase; // Return the proxy during build time;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
;
  if (accessToken) {
    return createClient<Database>(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,;
        },;
      },;
    });
  }
  return supabase;
}
;
export default supabase;
;