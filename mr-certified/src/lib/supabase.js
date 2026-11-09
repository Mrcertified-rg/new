// MC
/**
 * lib/supabase.js
 * The ONE place that connects the app to Supabase. Every other file imports
 * `supabase` from here.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Shows a clear message in the browser console instead of a confusing crash.
  console.error('Supabase is not configured. Create a .env file (see .env.example) and restart `npm run dev`.');
}

export const supabase = createClient(url || 'http://localhost', key || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
});
