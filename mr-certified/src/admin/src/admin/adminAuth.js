// MC
/**
 * admin/adminAuth.js
 * ---------------------------------------------------------------------------
 * Administrator login, powered by Supabase.
 * An administrator is a normal Supabase login that is listed in the "admins"
 * table. The console asks the database function is_admin() - the very same
 * check the data rules use - so "can sign in" always means "can see the data".
 *
 * Sessions
 *  - Locks after IDLE_MINUTES without a click or key press (change the number below).
 *  - Locking only ends THIS browser's session ("local" sign-out), so it never signs
 *    out the same administrator on another device.
 *  - If another login is used in this browser, or the session ends, the console locks
 *    itself and says why instead of quietly showing the wrong person's data.
 * ---------------------------------------------------------------------------
 */
import { adminClient as supabase } from './adminClient.js';

export const IDLE_MINUTES = 30;
const ACTIVE_KEY = 'mrc.admin.lastActive';

let currentEmail = '';
let currentId = '';
let quiet = false; // true while WE are signing out, so the "session lost" message is not shown

const lastActive = () => { try { return Number(localStorage.getItem(ACTIVE_KEY)) || 0; } catch { return 0; } };
const markActive = () => { try { localStorage.setItem(ACTIVE_KEY, String(Date.now())); } catch { /* blocked */ } };
const clearActive = () => { try { localStorage.removeItem(ACTIVE_KEY); } catch { /* blocked */ } };

export const adminEmail = () => currentEmail;
export const hasSession = () => { const t = lastActive(); return t > 0 && Date.now() - t < IDLE_MINUTES * 60000; };

let lastTouch = 0;
export const touchSession = () => { // called on clicks / key presses; never revives an expired session
  const now = Date.now();
  if (now - lastTouch < 5000) return;
  lastTouch = now;
  if (hasSession()) markActive();
};

export async function signOutAdmin() {
  quiet = true;
  clearActive();
  currentEmail = '';
  currentId = '';
  try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
  quiet = false;
}

/** Asks the database "is the person signed in right now an administrator?" */
async function checkAdmin() {
  const { data: u, error: userError } = await supabase.auth.getUser();
  if (userError || !u || !u.user) return { ok: false, message: 'No active login found.' };
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return { ok: false, message: error.message };
  if (data !== true) return { ok: false, notAdmin: true };
  currentEmail = u.user.email || '';
  currentId = u.user.id;
  return { ok: true };
}

/** On page load: still signed in as an admin, and not idle for too long? */
export async function restoreAdmin() {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { clearActive(); return { ok: false, notice: '' }; }
    if (!hasSession()) {
      await signOutAdmin();
      return { ok: false, notice: `You were signed out after ${IDLE_MINUTES} minutes without activity. Please sign in again.` };
    }
    const result = await checkAdmin();
    if (!result.ok) {
      await signOutAdmin();
      return { ok: false, notice: result.notAdmin ? 'This login is not listed as an administrator.' : '' };
    }
    markActive();
    return { ok: true, notice: '' };
  } catch {
    return { ok: false, notice: 'Cannot reach the database. Check your internet connection and refresh.' };
  }
}

export async function signInAdmin(email, pass) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
  if (error) {
    if (error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
      throw new Error('This email is not confirmed yet. In Supabase, open Authentication > Users and confirm it.');
    }
    if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
      throw new Error('Too many attempts. Wait a minute and try again.');
    }
    if (error.status === 0 || /fetch|network/i.test(error.message) || error.name === 'AuthRetryableFetchError') {
      throw new Error('Cannot reach the database. Check your internet connection.');
    }
    throw new Error('Wrong email or password.');
  }
  const result = await checkAdmin();
  if (!result.ok) {
    quiet = true;
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
    quiet = false;
    throw new Error(result.notAdmin
      ? 'Password is correct, but this login is not listed as an administrator. Add it to the "admins" table in Supabase.'
      : 'Signed in, but the database check failed: ' + (result.message || 'unknown error'));
  }
  markActive();
}

/** Calls back (with a message) if the login ends or a different person logs in in this browser. */
export function onAdminSessionLost(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (quiet) return;
    if (event === 'SIGNED_OUT' && currentId) {
      callback('Your session ended. Please sign in again.');
    } else if (session && session.user && currentId && session.user.id !== currentId) {
      callback('Another login was used in this browser. Please sign in again.');
    }
  });
  return () => data.subscription.unsubscribe();
}
