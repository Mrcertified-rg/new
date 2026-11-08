// MC
/**
 * admin/adminData.js
 * ---------------------------------------------------------------------------
 * Everything the console reads/writes. DEMO: reads the same browser storage the
 * public app uses (same origin, so run the main Vite server at /admin.html).
 * BACKEND LATER: keep these function names, replace the bodies with API calls
 * and enforce every rule on the server. Password data is never returned here.
 * ---------------------------------------------------------------------------
 */
import { PRODUCTS, ORDER_STAGES } from '../../../data.js';
import { adminEmail } from './adminAuth.js';

// Must match the keys used by auth/authService.js and shared/orderStore.js
const K = { users: 'mrc.demo.users', business: 'mrc.demo.business', orders: 'mrc.demo.orders', audit: 'mrc.admin.audit' };
const read = (key, fallback) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* blocked */ } };

export const money = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-KE');
export const when = (v) => (v ? new Date(v).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const mask = (s) => { const v = String(s || ''); return v.length <= 3 ? '•••' : '•'.repeat(v.length - 3) + v.slice(-3); };

const profilesByRole = (e) => (!e ? {} : e.role ? { [e.role]: e } : e);

/* ------------------------------ audit log ------------------------------ */
export function logAudit(action, detail = '') {
  const log = read(K.audit, []);
  log.unshift({ t: new Date().toISOString(), by: adminEmail() || 'unknown', action, detail });
  write(K.audit, log.slice(0, 1000));
}
export const listAudit = () => read(K.audit, []);

/* ------------------------------- accounts ------------------------------- */
export function listAccounts() {
  const biz = read(K.business, {});
  return read(K.users, []).map((u) => ({
    id: u.id,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    email: u.email,
    phone: u.phone,
    county: u.address?.county || '',
    createdAt: u.createdAt || '',
    buyer: u.roles?.buyer?.status || null,
    seller: u.roles?.seller?.status || null,
    sellerReason: u.roles?.seller?.reason || '',
    business: profilesByRole(biz[u.id]).seller || null,
  })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

const STATUSES = ['pending', 'approved', 'rejected', 'suspended'];
export function setSellerStatus(userId, status, reason = '') {
  if (!STATUSES.includes(status)) throw new Error('Unknown status.');
  const users = read(K.users, []);
  const u = users.find((x) => x.id === userId);
  if (!u?.roles?.seller) throw new Error('This account has no seller application.');
  const before = u.roles.seller.status;
  u.roles.seller = { ...u.roles.seller, status, reason, reviewedAt: new Date().toISOString(), reviewedBy: adminEmail() };
  write(K.users, users);
  logAudit('seller.' + status, `${u.email}: ${before} -> ${status}${reason ? ' | ' + reason : ''}`);
}

/* ----------------------------- transactions ----------------------------- */
export function listOrders() {
  return Object.values(read(K.orders, {})).map((o) => {
    const p = PRODUCTS.find((x) => x.id === o.pid);
    return {
      ...o,
      product: p?.name || 'Unknown product',
      seller: p?.seller || '—',
      amount: o.amount ?? (p ? p.price * (o.qty || 1) : 0),
      stageLabel: ORDER_STAGES[o.stage] ?? '—',
      payment: o.stage >= 4 ? 'Released to seller' : 'Held in escrow',
      at: o.placedAt || o.id,
    };
  }).sort((a, b) => b.at - a.at);
}

export function getStats(accounts, orders) {
  return {
    accounts: accounts.length,
    sellersPending: accounts.filter((a) => a.seller === 'pending').length,
    sellersApproved: accounts.filter((a) => a.seller === 'approved').length,
    orders: orders.length,
    volume: orders.reduce((s, o) => s + o.amount, 0),
    escrow: orders.filter((o) => o.stage < 4).reduce((s, o) => s + o.amount, 0),
  };
}
