// MC
/**
 * admin/adminAuth.js
 * ---------------------------------------------------------------------------
 * DEMO administrator login (runs in this browser only).
 * The first person to open the console creates the one administrator account.
 * Passphrase is hashed with PBKDF2-SHA256 (600k rounds + random salt).
 *
 * NOT real protection: anyone with this browser can edit localStorage.
 * Real protection = a server that checks the admin role on every request.
 * When the backend exists, replace setUpAdmin / signInAdmin / hasSession here.
 *
 * Forgot your passphrase (demo only)? DevTools > Application > Local Storage >
 * delete "mrc.admin.cred", then set up again.
 * ---------------------------------------------------------------------------
 */
const K = { cred: 'mrc.admin.cred', tries: 'mrc.admin.tries', session: 'mrc.admin.session' };
export const IDLE_MINUTES = 10;
const ITER = 600000;
const MAX_TRIES = 5;
const LOCK_SECONDS = 300;

const read = (store, key, fallback) => { try { const r = store.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } };
const write = (store, key, value) => { try { store.setItem(key, JSON.stringify(value)); } catch { /* blocked */ } };
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hash(pass, saltB64) {
  if (!globalThis.crypto?.subtle) throw new Error('Open the console on localhost or HTTPS.');
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, key, 256);
  return { salt: toB64(salt), hash: toB64(bits) };
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i += 1) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export const isSetUp = () => !!read(localStorage, K.cred, null);
export const adminEmail = () => read(localStorage, K.cred, null)?.email || '';

export function passphraseProblem(p) {
  if (p.length < 12) return 'Use at least 12 characters.';
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p)) return 'Mix upper case, lower case and numbers.';
  return '';
}

function startSession() { write(sessionStorage, K.session, { expiresAt: Date.now() + IDLE_MINUTES * 60000 }); }
export const hasSession = () => { const s = read(sessionStorage, K.session, null); return !!s && s.expiresAt > Date.now(); };
export const touchSession = () => { if (hasSession()) startSession(); };   // never revives an expired session
export const signOutAdmin = () => { try { sessionStorage.removeItem(K.session); } catch { /* ignore */ } };

export async function setUpAdmin(email, pass) {
  if (isSetUp()) throw new Error('An administrator already exists.');
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new Error('Enter a valid email.');
  const problem = passphraseProblem(pass);
  if (problem) throw new Error(problem);
  write(localStorage, K.cred, { email: e, ...(await hash(pass)), createdAt: new Date().toISOString() });
  startSession();
}

export async function signInAdmin(email, pass) {
  const t = read(localStorage, K.tries, {});
  if (t.until && t.until > Date.now()) throw new Error(`Locked. Try again in ${Math.ceil((t.until - Date.now()) / 1000)}s.`);
  const c = read(localStorage, K.cred, null);
  const ok = !!c && email.trim().toLowerCase() === c.email && same((await hash(pass, c.salt)).hash, c.hash);
  if (!ok) {
    const n = (t.count || 0) + 1;
    write(localStorage, K.tries, n >= MAX_TRIES ? { count: 0, until: Date.now() + LOCK_SECONDS * 1000 } : { count: n });
    throw new Error('Wrong email or passphrase.');
  }
  localStorage.removeItem(K.tries);
  startSession();
}
