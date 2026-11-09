// MC
/**
 * admin/adminAuth.js
 * ---------------------------------------------------------------------------
 * Administrator login, powered by Supabase.
 * An administrator is a normal Supabase login whose id is listed in the
 * "admins" table (see supabase/03_admin.sql). Nobody can make themselves an
 * admin from the browser - the database refuses.
 *
 * The console also locks itself after IDLE_MINUTES without a click or key.
 * ---------------------------------------------------------------------------
 */
import { supabase } from '../../../lib/supabase.js';

export const IDLE_MINUTES = 10;
const SESSION_KEY = 'mrc.admin.session';
let currentEmail = '';

const read = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const startSession = () => { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + IDLE_MINUTES * 60000 })); } catch { /* blocked */ } };

export const adminEmail = () => currentEmail;
export const hasSession = () => { const s = read(); return !!s && s.expiresAt > Date.now(); };
export const touchSession = () => { if (hasSession()) startSession(); }; // never revives an expired session

export async function signOutAdmin() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  currentEmail = '';
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}

/** Asks the database "is the person signed in right now an administrator?" */
async function checkAdmin() {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return false;
  const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', u.user.id).maybeSingle();
  if (error || !data) return false;
  currentEmail = u.user.email || '';
  return true;
}

/** On page load: still signed in as an admin, and not idle for too long? */
export async function restoreAdmin() {
  try {
    if (!hasSession()) return false;
    const ok = await checkAdmin();
    if (!ok) await signOutAdmin();
    return ok;
  } catch { return false; }
}

export async function signInAdmin(email, pass) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
  if (error) throw new Error('Wrong email or password.');
  if (!(await checkAdmin())) {
    await supabase.auth.signOut();
    throw new Error('This account is not an administrator.');
  }
  startSession();
}
