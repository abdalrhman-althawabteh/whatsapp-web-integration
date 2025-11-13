/**
 * Supabase Client Configuration
 * Provides both browser and server-side Supabase clients
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use placeholder values during build time to avoid errors
// Runtime checks will happen in components/API routes
const url = supabaseUrl || 'https://placeholder.supabase.co';
const anonKey = supabaseAnonKey || 'placeholder-anon-key';

/**
 * Browser/Client-side Supabase client
 * Use this in components and client-side code
 * Includes automatic session management
 *
 * Note: During build time, placeholder values are used.
 * Runtime validation happens in components.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Server-side Supabase client with admin privileges
 * Use this ONLY in API routes or server-side operations
 * Has full access and bypasses RLS
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(url, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Create authenticated Supabase client for API routes
 * @param {string} accessToken - User's access token
 * @returns {Object} Authenticated Supabase client
 */
export function createAuthenticatedClient(accessToken) {
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Check if Supabase is properly configured
 * Use this in components to validate at runtime
 * @returns {boolean} True if configured
 */
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Helper function to get user from request
 * @param {Object} req - Request object with Authorization header
 * @returns {Object|null} User object or null
 */
export async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export default supabase;
