// MC
/** Keep the console's authentication session separate from the shop session. */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Supabase is not configured for the administrator console.');
}

export const adminClient = createClient(url || 'http://localhost', key || 'missing-key', {
  auth: {
    storageKey: 'merqo-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
