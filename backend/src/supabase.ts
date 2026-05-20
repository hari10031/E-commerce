import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

// Service role client — full DB access, server-side only, NEVER exposed to any client.
// IMPORTANT: never call auth.signInWithPassword / signUp on this client. Doing so
// replaces its service-role credentials with a user session, which then makes every
// subsequent .from() query run as that user and fail RLS-protected reads.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: { 'x-application-name': 'nanabanana-backend' },
    },
  }
)

// Dedicated client for user sign-in / sign-up only. Kept separate so user sessions
// never poison the service-role client above.
export const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)
