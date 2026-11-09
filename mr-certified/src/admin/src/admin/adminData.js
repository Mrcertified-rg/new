// MC
/**
 * admin/adminData.js
 * ---------------------------------------------------------------------------
 * Everything the console reads/writes, now from Supabase.
 * The database only answers these calls when the signed-in person is listed in
 * the "admins" table, and the rules for approving a seller live in the
 * database function admin_set_seller_status (not in the browser).
 * All functions are async.
 * ---------------------------------------------------------------------------
 */
import { supabase } from '../../../lib/supabase.js';

export const money = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-KE');
export const when = (v) => (v ? new Date(v).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const mask = (s) => { const v = String(s || ''); return v.length <= 3 ? '•••' : '•'.repeat(v.length - 3) + v.slice(-3); };

/* ------------------------------ audit log ------------------------------ */
/** Records an admin action. Never blocks or breaks the screen if it fails. */
export async function logAudit(action, detail = '') {
  try {
    await supabase.rpc('admin_log', { p_action: action, p_detail: detail });
  } catch (err) {
    console.error('audit log failed', err);
  }
}

export async function listAudit() {
  const { data, error } = await supabase
    .from('admin_audit').select('*').order('at', { ascending: false }).limit(500);
  if (error) throw new Error('Could not load the audit log.');
  return data.map((l) => ({ t: l.at, by: l.by_email, action: l.action, detail: l.detail }));
}

/* ------------------------------- accounts ------------------------------- */
export async function listAccounts() {
  const [profiles, roles, biz] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('*'),
    supabase.from('seller_businesses').select('*'),
  ]);
  if (profiles.error || roles.error || biz.error) {
    throw new Error('Could not load accounts. Is this login listed as an administrator?');
  }
  const roleOf = (id, role) => roles.data.find((r) => r.user_id === id && r.role === role);
  return profiles.data.map((p) => {
    const seller = roleOf(p.id, 'seller');
    const b = biz.data.find((x) => x.user_id === p.id);
    return {
      id: p.id,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      email: p.email,
      phone: p.phone || '',
      county: p.address?.county || '',
      createdAt: p.created_at || '',
      buyer: roleOf(p.id, 'buyer')?.status || null,
      seller: seller?.status || null,
      sellerReason: seller?.reason || '',
      business: b ? { name: b.business_name, id: b.business_id, kra: b.kra_pin, phone: b.phone || '' } : null,
    };
  });
}

const STATUSES = ['pending', 'approved', 'rejected', 'suspended'];
export async function setSellerStatus(userId, status, reason = '') {
  if (!STATUSES.includes(status)) throw new Error('Unknown status.');
  const { error } = await supabase.rpc('admin_set_seller_status', { p_user: userId, p_status: status, p_reason: reason });
  if (error) throw new Error(error.message || 'Could not change the status.');
}

/* ----------------------------- transactions ----------------------------- */
// Orders move to Supabase in a later step. Until then there is nothing to list.
export async function listOrders() {
  return [];
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
