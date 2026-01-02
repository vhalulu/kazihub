// lib/supabase/client.ts
// Updated to handle refresh token errors

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Handle refresh token errors gracefully
        onAuthStateChange: (event, session) => {
          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully')
          }
          if (event === 'SIGNED_OUT') {
            console.log('User signed out')
          }
        }
      }
    }
  )
}
