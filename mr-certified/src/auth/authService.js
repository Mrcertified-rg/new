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
 *   - 30-day shared account session, wrong-password lockout, role statuses
 * ---------------------------------------------------------------------------
 */
import { DEMO_MODE, SESSION_DAYS, MAX_FAILED_ATTEMPTS, LOCKOUT_SECONDS, ROLE_LABEL } from './config.js';
import { parseIdentifier, normalizeEmail, normalizePhone, passwordProblem, validateDeliveryStep } from './validators.js';

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
  username: u.username || (u.firstName + (u.lastName ? '.' + u.lastName : '')).toLowerCase().replace(/[^a-z0-9.]/g, ''),
  email: u.email,
  phone: u.phone,
  profilePicture: u.profilePicture || '',
  theme: u.theme || 'dark',
  address: { ...u.address },
  roles: Object.fromEntries(
    Object.entries(u.roles)
      .filter(([role]) => role === 'buyer' || role === 'seller')
      .map(([role, r]) => [role, { status: r.status }]),
  ),
});

const loadUsers = () => read(KEYS.users, []);
const saveUsers = (users) => write(KEYS.users, users);
const findUserById = (id) => loadUsers().find((u) => u.id === id);

function startSession(userId) {
  write(KEYS.session, { userId, expiresAt: Date.now() + SESSION_DAYS * 86400000 });
}

/* ------------------------------ sessions ------------------------------ */
/** Called on app start: returns the signed-in account, or null. */
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
 * Creates a login. Seller-intent signup is seller-only; other signups include
 * Buyer access. Seller workspaces are recorded as PENDING applications.
 */
export async function registerUser(form) {
  const email = normalizeEmail(form.email);
  const phone = normalizePhone(form.phone);
  const users = loadUsers();
  if (users.some((u) => u.email === email || u.phone === phone)) {
    throw authError('exists', 'An account with this email or phone already exists. Try signing in.');
  }

  const roles = form.accountIntent === 'seller' ? {} : { buyer: { status: 'approved' } };
  const sellerChoice = form.roleChoices?.seller;
  if (form.accountIntent === 'seller' && !sellerChoice?.on) {
    throw authError('invalid-role', 'Choose the seller workspace to create a seller account.');
  }
  if (sellerChoice?.on) roles.seller = { status: 'pending' };

  const user = {
    id: 'u_' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join(''),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    username: (form.firstName + '.' + form.lastName).trim().toLowerCase().replace(/[^a-z0-9.]/g, ''),
    email,
    phone,
    profilePicture: '',
    theme: 'dark',
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
  // Seller details typed during sign-up are saved so that workspace opens straight away.
  if (sellerChoice?.on && sellerChoice.biz) {
    const b = sellerChoice.biz;
    saveBusinessProfile(user.id, {
      role: 'seller', name: b.name.trim(), id: b.id.trim(), kra: b.kra.trim().toUpperCase(), phone: normalizePhone(b.phone),
    });
  }
  if (sellerChoice?.on) startSession(user.id);
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

export async function updateBuyerProfile(userId, profile) {
  const users = loadUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) throw authError('no-user', 'Please sign in again.');

  const firstName = String(profile.firstName || '').trim();
  const lastName = String(profile.lastName || '').trim();
  const username = String(profile.username || '').trim().toLowerCase();
  const email = normalizeEmail(profile.email);
  const phone = normalizePhone(profile.phone);

  if (firstName.length < 2 || lastName.length < 2) throw authError('invalid-profile', 'Enter your first and last name.');
  if (!/^[a-z0-9._]{3,24}$/.test(username)) throw authError('invalid-username', 'Username must be 3–24 characters using letters, numbers, dots or underscores.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw authError('invalid-email', 'Enter a valid email address.');
  if (!phone) throw authError('invalid-phone', 'Enter a valid Kenyan phone number.');

  const conflict = users.find((item) => {
    if (item.id === userId) return false;
    const existingUsername = item.username || (item.firstName + (item.lastName ? '.' + item.lastName : '')).toLowerCase().replace(/[^a-z0-9.]/g, '');
    return item.email === email || item.phone === phone || existingUsername.toLowerCase() === username;
  });
  if (conflict) throw authError('exists', 'That email, phone number or username is already in use.');

  if (profile.newPassword) {
    if (!profile.currentPassword || !(await passwordMatches(profile.currentPassword, user.password))) {
      throw authError('invalid-password', 'Enter your current password to change it.');
    }
    const problem = passwordProblem(profile.newPassword);
    if (problem) throw authError('invalid-password', problem);
    user.password = await hashPassword(profile.newPassword);
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.username = username;
  user.email = email;
  user.phone = phone;
  user.profilePicture = profile.profilePicture || '';
  user.theme = profile.theme === 'light' ? 'light' : 'dark';

  if (profile.address && Object.values(profile.address).some((value) => String(value || '').trim())) {
    const errors = validateDeliveryStep(profile.address);
    if (Object.keys(errors).length) throw authError('invalid-address', Object.values(errors)[0]);
    user.address = {
      county: profile.address.county,
      town: profile.address.town.trim(),
      area: profile.address.area.trim(),
      landmark: profile.address.landmark.trim(),
      altPhone: profile.address.altPhone.trim() ? normalizePhone(profile.address.altPhone) : '',
      notes: profile.address.notes.trim(),
    };
  } else if (profile.address) {
    user.address = { county: '', town: '', area: '', landmark: '', altPhone: '', notes: '' };
  }

  saveUsers(users);
  return toPublicUser(user);
}

/* ---------------------- seller access ---------------------- */
/**
 * "Log in again" check used every time someone switches into Seller mode.
 * Always verifies the shared account password.
 */
export async function verifyRolePassword(userId, role, password) {
  assertSellerRole(role);
  const user = findUserById(userId);
  const entry = user?.roles?.[role];
  if (!entry) throw authError('no-role', `You have not applied for ${ROLE_LABEL[role]} access yet.`);
  if (entry.status === 'rejected' || entry.status === 'suspended') {
    throw authError('blocked', `${ROLE_LABEL[role]} access is ${entry.status}.`);
  }
  const lockKey = `role:${userId}:${role}`;
  assertNotLocked(lockKey);

  if (!(await passwordMatches(password, user.password))) {
    recordFailure(lockKey);
    throw authError('invalid', `Wrong password for ${ROLE_LABEL[role]} mode.`);
  }
  clearFailures(lockKey);
  return toPublicUser(user);
}

/**
 * Existing buyer asks for Seller access. Always starts as PENDING and
 * requires the account password (so a borrowed phone cannot add roles).
 */
export async function applyForRole(userId, role, accountPassword) {
  assertSellerRole(role);
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

  user.roles[role] = { status: 'pending' };
  saveUsers(users);
  return toPublicUser(user);
}

/** DEMO ONLY: pretend an admin approved the application. Disabled when DEMO_MODE is false. */
export async function setRoleStatusDemo(userId, role, status) {
  if (!DEMO_MODE) throw authError('forbidden', 'Only an administrator can change a role status.');
  assertSellerRole(role);
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user?.roles?.[role]) throw authError('no-role', 'No such role application.');
  user.roles[role].status = status;
  saveUsers(users);
  return toPublicUser(user);
}

/* ------------------------- seller business info ------------------------- */
/** Keeps the details typed in the existing "create seller account" screen. */
/** Older saves held one profile ({ role, ... }). */
function assertSellerRole(role) {
  if (role !== 'seller') throw authError('invalid-role', 'Only seller workspaces are supported.');
}

const profilesByRole = (entry) => (!entry ? {} : entry.role ? { [entry.role]: entry } : entry);
export const getBusinessProfile = (userId, role) => {
  assertSellerRole(role);
  const byRole = profilesByRole(read(KEYS.business, {})[userId]);
  return byRole[role] || null;
};
export function saveBusinessProfile(userId, profile) {
  assertSellerRole(profile.role);
  const all = read(KEYS.business, {});
  all[userId] = { ...profilesByRole(all[userId]), [profile.role]: profile };
  write(KEYS.business, all);
}

/* ---------------------- people directory (friends) ---------------------- */
// Friend lists expose only display identity fields, never contact or address details.
const toPerson = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username || '',
  profilePicture: user.profilePicture || '',
});

export function getPerson(id) {
  const user = findUserById(id);
  return user ? toPerson(user) : null;
}

/** Search people by name without exposing account contact or address details. */
export function findPeople(query, excludeId) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];
  return loadUsers()
    .filter((user) => user.id !== excludeId && (user.firstName + ' ' + user.lastName).toLowerCase().includes(normalizedQuery))
    .slice(0, 20)
    .map(toPerson);
}