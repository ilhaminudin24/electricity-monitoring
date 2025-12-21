
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Supabase credentials missing - will fail on API calls
  // This is expected in development if .env.local is not configured
}

// Create client with empty strings if missing (will fail on actual API calls, but won't crash on import)
// Add timeout configuration to prevent hanging requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'electricity-monitoring-app'
    }
  },
  db: {
    schema: 'public'
  }
});
