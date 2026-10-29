/**
 * auth/validators.js
 * Pure form-validation helpers (no React, no storage). Each validate* function
 * returns an object of { fieldName: 'message' }. An empty object means "valid".
 * NOTE: the server must repeat these checks - never trust the browser alone.
 */
import { KENYA_COUNTIES } from './config.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\s'.-]{1,39}$/u;

export const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

/** Accepts 07xx, 01xx, +2547xx, 2547xx. Returns "+2547XXXXXXXX" or null. */
export const normalizePhone = (raw) => {
  const s = String(raw || '').replace(/[\s\-()]/g, '');
  const m = s.match(/^(?:\+?254|0)([17]\d{8})$/);
  return m ? '+254' + m[1] : null;
};

/** Sign-in box accepts an email OR a phone number. */
export function parseIdentifier(input) {
  const v = String(input || '').trim();
  if (!v) return null;
  if (v.includes('@')) {
    const email = normalizeEmail(v);
    return EMAIL_RE.test(email) ? { type: 'email', value: email } : null;
  }
  const phone = normalizePhone(v);
  return phone ? { type: 'phone', value: phone } : null;
}

/** Returns '' when the password is acceptable, otherwise a friendly message. */
export function passwordProblem(pw) {
  if (!pw || pw.length < 8) return 'Use at least 8 characters.';
  if (pw.length > 128) return 'Password is too long (max 128).';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return '';
}

/** Step 1 of sign-up: who you are + password. */
export function validateAccountStep(f) {
  const e = {};
  if (!NAME_RE.test(f.firstName.trim())) e.firstName = 'Enter your first name.';
  if (!NAME_RE.test(f.lastName.trim())) e.lastName = 'Enter your last name.';
  if (!normalizePhone(f.phone)) e.phone = 'Use a Kenyan number, e.g. 0712 345 678.';
  if (!EMAIL_RE.test(normalizeEmail(f.email))) e.email = 'Enter a valid email address.';
  const pw = passwordProblem(f.password);
  if (pw) e.password = pw;
  return e;
}

/** Step 2 of sign-up: where we deliver. */
export function validateDeliveryStep(f) {
  const e = {};
  if (!KENYA_COUNTIES.includes(f.county)) e.county = 'Choose your county.';
  if (f.town.trim().length < 2) e.town = 'Enter your city or town.';
  if (f.area.trim().length < 2) e.area = 'Enter your area or estate.';
  if (f.altPhone.trim() && !normalizePhone(f.altPhone)) e.altPhone = 'Use a Kenyan number or leave blank.';
  return e;
}

/** Step 3: checks the separate-login password and the verification details of every ticked role. */
export function validateRoleChoices(choices) {
  const e = {};
  Object.entries(choices).forEach(([role, c]) => {
    if (!c.on) return;
    if (c.mode === 'separate') {
      const p = passwordProblem(c.password);
      if (p) e[role] = p;
    }
    const b = c.biz || {};
    const biz = {};
    if (String(b.name || '').trim().length < 2) biz.name = role === 'marketer' ? 'Enter your marketer name.' : 'Enter your business name.';
    if (String(b.id || '').trim().length < 5) biz.id = 'Enter your National ID number.';
    if (String(b.kra || '').trim().length < 8) biz.kra = 'Enter your KRA PIN, e.g. A012345678B.';
    if (!normalizePhone(b.phone)) biz.phone = 'Use a Kenyan number, e.g. 0712 345 678.';
    if (Object.keys(biz).length) e[role + 'Biz'] = biz;
  });
  return e;
}