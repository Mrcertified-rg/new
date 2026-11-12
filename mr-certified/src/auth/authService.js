// MC
/**
 * auth/authService.js
 * ---------------------------------------------------------------------------
 * REAL ACCOUNT SERVICE - powered by Supabase (replaces the old localStorage demo).
 *
 * Supabase Auth stores the email + (hashed) password and keeps people signed in.
 * Our own tables (profiles, user_roles, seller_businesses - see
 * supabase/01_auth_schema.sql) hold everything else. The database rules (RLS)
 * make sure people can only see and change their OWN rows, and that only an
 * admin can approve a seller.
 *
 * The exported function names are the same as before, so the screens did not
 * need to change. A few "read" helpers stay synchronous by reading a small
 * in-memory copy that is filled once at start-up by initAuth() (see main.jsx).
 * ---------------------------------------------------------------------------
 */
import { supabase } from '../lib/supabase.js';
import { MAX_FAILED_ATTEMPTS, LOCKOUT_SECONDS, ROLE_LABEL } from './config.js';
import { parseIdentifier, normalizeEmail, normalizePhone, passwordProblem, validateDeliveryStep } from './validators.js';

const authError = (code, message) => Object.assign(new Error(message), { code });

/* ------------------- in-memory copy of the signed-in account ------------------- */
let currentUser = null;        // public account object (never contains passwords)
const businessCache = {};      // userId -> seller business details
const sessionEndedHandlers = new Set();
const sessionReadyHandlers = new Set();
let authInitialized = false;

export function onSessionReady(handler) {
  sessionReadyHandlers.add(handler);
  if (authInitialized) handler(currentUser);
  return () => sessionReadyHandlers.delete(handler);
}

/** Lets the UI know if Supabase signs the person out by itself (expired session, other tab...). */
export function onSessionEnded(handler) {
  sessionEndedHandlers.add(handler);
  return () => sessionEndedHandlers.delete(handler);
}

/* ----------------------- small browser-side lockout ----------------------- */
// Friendly UX only. The REAL brute-force protection is Supabase's server-side rate limits.
const ATTEMPTS_KEY = 'mrc.attempts';
const readAttempts = () => { try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}'); } catch { return {}; } };
const writeAttempts = (v) => { try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(v)); } catch { /* ignore */ } };

function assertNotLocked(key) {
  const entry = readAttempts()[key];
  if (entry?.until && entry.until > Date.now()) {
    const secs = Math.ceil((entry.until - Date.now()) / 1000);
    throw authError('locked', `Too many wrong attempts. Try again in ${secs}s.`);
  }
}
function recordFailure(key) {
  const all = readAttempts();
  const entry = all[key] || { count: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILED_ATTEMPTS) { entry.until = Date.now() + LOCKOUT_SECONDS * 1000; entry.count = 0; }
  all[key] = entry;
  writeAttempts(all);
}
function clearFailures(key) {
  const all = readAttempts();
  delete all[key];
  writeAttempts(all);
}

/* ------------------------------ helpers ------------------------------ */
const emptyAddress = { county: '', town: '', area: '', landmark: '', altPhone: '', notes: '' };

const toPublicUser = (p, roleRows) => ({
  id: p.id,
  firstName: p.first_name,
  lastName: p.last_name || '',
  username: p.username,
  email: p.email,
  phone: p.phone || '',
  profilePicture: p.profile_picture || '',
  theme: p.theme === 'light' ? 'light' : 'dark',
  address: { ...emptyAddress, ...(p.address || {}) },
  roles: Object.fromEntries((roleRows || []).map((r) => [r.role, { status: r.status }])),
});

/** Loads profile + roles + seller business for a signed-in person and caches them. */
async function loadAccount(userId) {
  const [profile, roles, biz] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role,status').eq('user_id', userId),
    supabase.from('seller_businesses').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  if (profile.error) throw authError('server', 'Could not load your account. Please try again.');
  if (!profile.data) return null;
  businessCache[userId] = biz.data
    ? { role: 'seller', name: biz.data.business_name, id: biz.data.business_id, kra: biz.data.kra_pin, phone: biz.data.phone || '' }
    : null;
  currentUser = toPublicUser(profile.data, roles.data);
  return currentUser;
}

const friendlyAuthError = (error, fallback) => {
  const msg = String(error?.message || '');
  if (error?.code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
    return authError('unconfirmed', 'Please confirm your email first - check your inbox for our message.');
  }
  if (/rate limit|too many/i.test(msg) || error?.status === 429) {
    return authError('rate', 'Too many attempts. Please wait a minute and try again.');
  }
  return authError('invalid', fallback);
};

/* ------------------------------ sessions ------------------------------ */
/**
 * Called ONCE before the app first draws (see main.jsx). Asks Supabase whether
 * this browser is already signed in and, if so, loads that account.
 */
export async function initAuth() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const account = await loadAccount(data.session.user.id);
      if (!account) await supabase.auth.signOut(); // login exists but no profile row: start clean
    }
  } catch (err) {
    console.error('initAuth failed', err);
  } finally {
    authInitialized = true;
    sessionReadyHandlers.forEach((fn) => fn(currentUser));
  }
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && currentUser) {
      currentUser = null;
      sessionEndedHandlers.forEach((fn) => fn());
    }
  });
}

/** Synchronous: returns the account loaded by initAuth()/signIn, or null. */
export function restoreSession() {
  return currentUser;
}

export async function signOutUser() {
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
  currentUser = null;
}

/* ------------------------- register / sign in ------------------------- */
/**
 * Creates the account. The person's details travel as "metadata"; a database
 * trigger (handle_new_user) turns them into the profile, roles and business rows.
 * Seller-intent signup is seller-only; other signups get Buyer access.
 * Seller access always starts as PENDING.
 */
export async function registerUser(form) {
  const email = normalizeEmail(form.email);
  const phone = normalizePhone(form.phone);
  const sellerChoice = form.roleChoices?.seller;
  if (form.accountIntent === 'seller' && !sellerChoice?.on) {
    throw authError('invalid-role', 'Choose the seller workspace to create a seller account.');
  }

  const a = form.address || {};
  const metadata = {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone,
    account_intent: form.accountIntent || '',
    address: {
      county: a.county || '',
      town: (a.town || '').trim(),
      area: (a.area || '').trim(),
      landmark: (a.landmark || '').trim(),
      altPhone: (a.altPhone || '').trim() ? normalizePhone(a.altPhone) : '',
      notes: (a.notes || '').trim(),
    },
    seller: sellerChoice?.on
      ? {
          on: true,
          name: sellerChoice.biz.name.trim(),
          id: sellerChoice.biz.id.trim(),
          kra: sellerChoice.biz.kra.trim().toUpperCase(),
          phone: normalizePhone(sellerChoice.biz.phone),
        }
      : { on: false },
  };

  const { data, error } = await supabase.auth.signUp({ email, password: form.password, options: { data: metadata } });
  if (error) {
    if (error.code === 'user_already_exists' || /already (registered|exists)/i.test(error.message)) {
      throw authError('exists', 'An account with this email or phone already exists. Try signing in.');
    }
    if (/database error/i.test(error.message)) {
      // The only normal cause is a duplicate phone number (unique in the database).
      throw authError('exists', 'An account with this email or phone already exists. Try signing in.');
    }
    if (error.code === 'weak_password') throw authError('weak', error.message);
    throw friendlyAuthError(error, 'We could not create your account. Please try again.');
  }
  // With "Confirm email" ON, Supabase hides duplicates by returning a user with no identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw authError('exists', 'An account with this email or phone already exists. Try signing in.');
  }

  // "Confirm email" is ON: no session yet; the person must click the link in their inbox.
  if (!data.session) return { needsEmailConfirmation: true };

  if (sellerChoice?.on) {
    const account = await loadAccount(data.user.id); // seller signups stay signed in
    return account || { needsEmailConfirmation: true };
  }
  // Buyer signups go back to the sign-in screen (same flow as before).
  await supabase.auth.signOut();
  currentUser = null;
  return { id: data.user.id };
}

export async function signInUser(identifierRaw, password) {
  const id = parseIdentifier(identifierRaw);
  if (!id) throw authError('invalid', 'Enter a valid email or phone number.');
  if (id.type !== 'email') {
    throw authError('phone-login', 'Phone sign-in is coming soon. Please sign in with your email address for now.');
  }
  const lockKey = 'signin:' + id.value;
  assertNotLocked(lockKey);

  const { data, error } = await supabase.auth.signInWithPassword({ email: id.value, password });
  if (error) {
    if (error.code !== 'email_not_confirmed') recordFailure(lockKey);
    throw friendlyAuthError(error, 'Wrong email or password.');
  }
  clearFailures(lockKey);
  const account = await loadAccount(data.user.id);
  if (!account) {
    await supabase.auth.signOut();
    throw authError('no-profile', 'Your account setup is incomplete. Please contact support.');
  }
  return account;
}

export async function updateBuyerProfile(userId, profile) {
  if (!currentUser || currentUser.id !== userId) throw authError('no-user', 'Please sign in again.');

  const firstName = String(profile.firstName || '').trim();
  const lastName = String(profile.lastName || '').trim();
  const username = String(profile.username || '').trim().toLowerCase();
  const email = normalizeEmail(profile.email);
  const phone = normalizePhone(profile.phone);

  if (firstName.length < 2 || lastName.length < 2) throw authError('invalid-profile', 'Enter your first and last name.');
  if (!/^[a-z0-9._]{3,24}$/.test(username)) throw authError('invalid-username', 'Username must be 3–24 characters using letters, numbers, dots or underscores.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw authError('invalid-email', 'Enter a valid email address.');
  if (!phone) throw authError('invalid-phone', 'Enter a valid Kenyan phone number.');

  let address = currentUser.address;
  if (profile.address && Object.values(profile.address).some((v) => String(v || '').trim())) {
    const errors = validateDeliveryStep(profile.address);
    if (Object.keys(errors).length) throw authError('invalid-address', Object.values(errors)[0]);
    address = {
      county: profile.address.county,
      town: profile.address.town.trim(),
      area: profile.address.area.trim(),
      landmark: profile.address.landmark.trim(),
      altPhone: profile.address.altPhone.trim() ? normalizePhone(profile.address.altPhone) : '',
      notes: profile.address.notes.trim(),
    };
  } else if (profile.address) {
    address = { ...emptyAddress };
  }

  // Password change: prove the current password first, then set the new one.
  if (profile.newPassword) {
    const problem = passwordProblem(profile.newPassword);
    if (problem) throw authError('invalid-password', problem);
    const check = profile.currentPassword
      ? await supabase.auth.signInWithPassword({ email: currentUser.email, password: profile.currentPassword })
      : { error: true };
    if (check.error) throw authError('invalid-password', 'Enter your current password to change it.');
    const { error } = await supabase.auth.updateUser({ password: profile.newPassword });
    if (error) throw authError('invalid-password', error.message);
  }

  // Email change: Supabase emails a confirmation link; the profile email updates once confirmed.
  if (email !== currentUser.email) {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw authError('invalid-email', error.message);
  }

  const { error } = await supabase.from('profiles').update({
    first_name: firstName,
    last_name: lastName,
    username,
    phone,
    profile_picture: profile.profilePicture || '',
    theme: profile.theme === 'light' ? 'light' : 'dark',
    address,
  }).eq('id', userId);
  if (error) {
    if (error.code === '23505') throw authError('exists', 'That phone number or username is already in use.');
    throw authError('server', 'Could not save your profile. Please try again.');
  }
  return loadAccount(userId);
}

/* ---------------------- seller access ---------------------- */
function assertSellerRole(role) {
  if (role !== 'seller') throw authError('invalid-role', 'Only seller workspaces are supported.');
}

/** Re-checks the password with Supabase (used for the "log in again" steps). */
async function confirmPassword(lockKey, password, wrongMessage) {
  assertNotLocked(lockKey);
  const { error } = await supabase.auth.signInWithPassword({ email: currentUser.email, password });
  if (error) {
    recordFailure(lockKey);
    throw authError('invalid', wrongMessage);
  }
  clearFailures(lockKey);
}

/**
 * "Log in again" check used every time someone switches into Seller mode.
 * Always verifies the account password and re-reads the role status from the database.
 */
export async function verifyRolePassword(userId, role, password) {
  assertSellerRole(role);
  if (!currentUser || currentUser.id !== userId) throw authError('no-user', 'Please sign in again.');
  const fresh = await loadAccount(userId); // picks up admin approvals/suspensions
  const entry = fresh?.roles?.[role];
  if (!entry) throw authError('no-role', `You have not applied for ${ROLE_LABEL[role]} access yet.`);
  if (entry.status === 'rejected' || entry.status === 'suspended') {
    throw authError('blocked', `${ROLE_LABEL[role]} access is ${entry.status}.`);
  }
  await confirmPassword(`role:${userId}:${role}`, password, `Wrong password for ${ROLE_LABEL[role]} mode.`);
  return fresh;
}

/** Existing buyer asks for Seller access. Always starts as PENDING. */
export async function applyForRole(userId, role, accountPassword) {
  assertSellerRole(role);
  if (!currentUser || currentUser.id !== userId) throw authError('no-user', 'Please sign in again.');
  if (currentUser.roles[role]) throw authError('exists', `You already applied for ${ROLE_LABEL[role]} access.`);
  await confirmPassword(`apply:${userId}`, accountPassword, 'Wrong account password.');
  const { error } = await supabase.rpc('apply_for_seller');
  if (error) throw authError('server', 'Could not send your application. Please try again.');
  return loadAccount(userId);
}

/** Not available any more: approvals are done by an admin in the Supabase dashboard. */
export async function setRoleStatusDemo() {
  throw authError('forbidden', 'Only an administrator can change a role status.');
}

/* ------------------------- seller business info ------------------------- */
export const getBusinessProfile = (userId, role) => {
  assertSellerRole(role);
  return businessCache[userId] || null;
};

/** Updates the local copy immediately and saves to Supabase in the background. */
export function saveBusinessProfile(userId, profile) {
  assertSellerRole(profile.role);
  businessCache[userId] = profile;
  return supabase.from('seller_businesses').upsert({
    user_id: userId,
    business_name: profile.name,
    business_id: profile.id,
    kra_pin: String(profile.kra || '').toUpperCase(),
    phone: profile.phone || null,
    updated_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.error('Could not save business details', error);
  });
}

/* ---------------------- people directory (friends) ---------------------- */
// Step 3 of the backend plan moves friends & chat to Supabase. Until then only
// your own account is known, so "Find people" returns nothing.
const toPerson = (u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, username: u.username || '', profilePicture: u.profilePicture || '' });
export function getPerson(id) {
  return currentUser && currentUser.id === id ? toPerson(currentUser) : null;
}
export function findPeople() {
  return [];
}
