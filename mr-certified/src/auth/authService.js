/**
 * auth/authService.js
 * ---------------------------------------------------------------------------
 * DEMO ACCOUNT SERVICE - runs entirely in the browser (localStorage).
 *
 * IMPORTANT: this is a stand-in so the sign-in screens and role rules can be
 * built and tested. It is NOT secure enough for real customers because anyone
 * can open DevTools and edit localStorage. Before going live, replace the
 * functions below with calls to your real auth backend (e.g. Neon Auth) and
 * enforce roles/permissions on the server. Every exported function is async
 * and returns plain objects so the swap does not touch any screen.
 *
 * What this file does implement for real:
 *   - password hashing (PBKDF2-SHA256 + random salt via Web Crypto)
 *   - 30-day buyer session, wrong-password lockout, role statuses
 * ---------------------------------------------------------------------------
 */
import { DEMO_MODE, SESSION_DAYS, MAX_FAILED_ATTEMPTS, LOCKOUT_SECONDS, ROLE_LABEL } from './config.js';
import { parseIdentifier, normalizeEmail, normalizePhone } from './validators.js';

const KEYS = {
  users: 'mrc.demo.users',
  session: 'mrc.demo.session',
  attempts: 'mrc.demo.attempts',
  business: 'mrc.demo.business',
};

/* ------------------------------ storage ------------------------------ */
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
};

const authError = (code, message) => Object.assign(new Error(message), { code });

/* ------------------------- password hashing -------------------------- */
const ITERATIONS = 150000;
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hashPassword(password, saltB64, iterations = ITERATIONS) {
  if (!globalThis.crypto?.subtle) {
    throw authError('insecure', 'Open the site over HTTPS (or localhost) so your password can be protected.');
  }
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return { salt: toB64(salt), hash: toB64(bits), iter: iterations };
}

/** Constant-time string compare (avoids leaking how many characters matched). */
const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

async function passwordMatches(password, record) {
  const { hash } = await hashPassword(password, record.salt, record.iter);
  return safeEqual(hash, record.hash);
}

/* ------------------------ wrong-password lockout ----------------------- */
function assertNotLocked(key) {
  const entry = read(KEYS.attempts, {})[key];
  if (entry?.until && entry.until > Date.now()) {
    const secs = Math.ceil((entry.until - Date.now()) / 1000);
    throw authError('locked', `Too many wrong attempts. Try again in ${secs}s.`);
  }
}
function recordFailure(key) {
  const all = read(KEYS.attempts, {});
  const entry = all[key] || { count: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.until = Date.now() + LOCKOUT_SECONDS * 1000;
    entry.count = 0;
  }
  all[key] = entry;
  write(KEYS.attempts, all);
}
function clearFailures(key) {
  const all = read(KEYS.attempts, {});
  delete all[key];
  write(KEYS.attempts, all);
}

/* ------------------------------ helpers ------------------------------ */
/** What the screens are allowed to see: never any password data. */
const toPublicUser = (u) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone,
  address: { ...u.address },
  roles: Object.fromEntries(
    Object.entries(u.roles).map(([role, r]) => [role, { status: r.status, credentialMode: r.credential?.mode || 'same' }]),
  ),
});

const loadUsers = () => read(KEYS.users, []);
const saveUsers = (users) => write(KEYS.users, users);
const findUserById = (id) => loadUsers().find((u) => u.id === id);

function startSession(userId) {
  write(KEYS.session, { userId, expiresAt: Date.now() + SESSION_DAYS * 86400000 });
}

/** Builds the stored credential for a seller/marketer role. */
async function buildRoleCredential(choice) {
  if (choice.mode === 'separate') return { mode: 'separate', ...(await hashPassword(choice.password)) };
  return { mode: 'same' };
}

/* ------------------------------ sessions ------------------------------ */
/** Called on app start: returns the signed-in buyer, or null. */
export function restoreSession() {
  const session = read(KEYS.session, null);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    localStorage.removeItem(KEYS.session);
    return null;
  }
  const user = findUserById(session.userId);
  return user ? toPublicUser(user) : null;
}

export async function signOutUser() {
  try { localStorage.removeItem(KEYS.session); } catch { /* ignore */ }
}

/* ------------------------- register / sign in ------------------------- */
/**
 * Creates the account. Everyone is a Buyer (approved). Seller / Marketer are
 * only recorded as PENDING applications - they never start approved.
 */
export async function registerUser(form) {
  const email = normalizeEmail(form.email);
  const phone = normalizePhone(form.phone);
  const users = loadUsers();
  if (users.some((u) => u.email === email || u.phone === phone)) {
    throw authError('exists', 'An account with this email or phone already exists. Try signing in.');
  }

  const roles = { buyer: { status: 'approved' } };
  for (const role of ['seller', 'marketer']) {
    const choice = form.roleChoices?.[role];
    if (choice?.on) roles[role] = { status: 'pending', credential: await buildRoleCredential(choice) };
  }

  const user = {
    id: 'u_' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join(''),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email,
    phone,
    password: await hashPassword(form.password),
    address: {
      county: form.address.county,
      town: form.address.town.trim(),
      area: form.address.area.trim(),
      landmark: form.address.landmark.trim(),
      altPhone: form.address.altPhone.trim() ? normalizePhone(form.address.altPhone) : '',
      notes: form.address.notes.trim(),
    },
    roles,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  startSession(user.id);
  return toPublicUser(user);
}

export async function signInUser(identifierRaw, password) {
  const id = parseIdentifier(identifierRaw);
  if (!id) throw authError('invalid', 'Enter a valid email or phone number.');
  const lockKey = 'signin:' + id.value;
  assertNotLocked(lockKey);

  const user = loadUsers().find((u) => (id.type === 'email' ? u.email : u.phone) === id.value);
  // Same error for "no such user" and "wrong password" so attackers learn nothing.
  const ok = user && (await passwordMatches(password, user.password));
  if (!ok) {
    recordFailure(lockKey);
    throw authError('invalid', 'Wrong email/phone or password.');
  }
  clearFailures(lockKey);
  startSession(user.id);
  return toPublicUser(user);
}

/* ---------------------- seller / marketer access ---------------------- */
/**
 * "Log in again" check used every time someone switches into Seller or
 * Marketer mode. Uses the role's own password if they chose a separate one,
 * otherwise the account password.
 */
export async function verifyRolePassword(userId, role, password) {
  const user = findUserById(userId);
  const entry = user?.roles?.[role];
  if (!entry) throw authError('no-role', `You have not applied for ${ROLE_LABEL[role]} access yet.`);
  if (entry.status === 'rejected' || entry.status === 'suspended') {
    throw authError('blocked', `${ROLE_LABEL[role]} access is ${entry.status}.`);
  }
  const lockKey = `role:${userId}:${role}`;
  assertNotLocked(lockKey);

  const record = entry.credential?.mode === 'separate' ? entry.credential : user.password;
  if (!(await passwordMatches(password, record))) {
    recordFailure(lockKey);
    throw authError('invalid', `Wrong password for ${ROLE_LABEL[role]} mode.`);
  }
  clearFailures(lockKey);
  return toPublicUser(user);
}

/**
 * Existing buyer asks for Seller/Marketer access. Always starts as PENDING and
 * requires the account password (so a borrowed phone cannot add roles).
 */
export async function applyForRole(userId, role, choice, accountPassword) {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw authError('no-user', 'Please sign in again.');
  if (user.roles[role]) throw authError('exists', `You already applied for ${ROLE_LABEL[role]} access.`);

  const lockKey = `apply:${userId}`;
  assertNotLocked(lockKey);
  if (!(await passwordMatches(accountPassword, user.password))) {
    recordFailure(lockKey);
    throw authError('invalid', 'Wrong account password.');
  }
  clearFailures(lockKey);

  user.roles[role] = { status: 'pending', credential: await buildRoleCredential(choice) };
  saveUsers(users);
  return toPublicUser(user);
}

/** DEMO ONLY: pretend an admin approved the application. Disabled when DEMO_MODE is false. */
export async function setRoleStatusDemo(userId, role, status) {
  if (!DEMO_MODE) throw authError('forbidden', 'Only an administrator can change a role status.');
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user?.roles?.[role]) throw authError('no-role', 'No such role application.');
  user.roles[role].status = status;
  saveUsers(users);
  return toPublicUser(user);
}

/* --------------------- seller / marketer business info --------------------- */
/** Keeps the details typed in the existing "create seller account" screen. */
export const getBusinessProfile = (userId) => read(KEYS.business, {})[userId] || null;
export function saveBusinessProfile(userId, profile) {
  const all = read(KEYS.business, {});
  all[userId] = profile;
  write(KEYS.business, all);
}
