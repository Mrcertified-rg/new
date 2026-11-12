// MC
/**
 * Orders now live in Supabase. The database functions calculate prices,
 * reserve stock, and enforce who can move an order to its next stage.
 */
import { supabase } from '../lib/supabase.js';
import { ORDER_STAGES } from '../data.js';

const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export const fromRow = (r) => ({
  id: r.id,
  pid: r.product_id,
  size: r.size,
  qty: r.qty,
  date: dateLabel(r.created_at),
  stage: r.stage,
  stageLabel: ORDER_STAGES[r.stage] || 'Unknown',
  customer: { id: r.buyer_id, name: r.buyer_name, email: r.buyer_email, phone: r.buyer_phone },
  unitPrice: r.unit_price,
  amount: r.amount,
  product: r.product_name,
  seller: r.seller_name,
  at: r.created_at,
  payment: 'Mock / held',
});

/** role "buyer" = orders I placed. role "seller" = orders for my products. */
export async function loadOrders(role, userId) {
  const column = role === 'seller' ? 'seller_id' : 'buyer_id';
  const { data, error } = await supabase
    .from('orders').select('*').eq(column, userId).order('created_at', { ascending: false });
  if (error) throw new Error('Could not load your orders.');
  return data.map(fromRow);
}

/** items = [{ pid, size, qty }] */
export async function placeOrders(items) {
  const payload = items.map((i) => ({ pid: i.pid, size: String(i.size ?? ''), qty: i.qty }));
  const { data, error } = await supabase.rpc('place_orders', { p_items: payload });
  if (error) throw new Error(error.message || 'Could not place your order.');
  return (data || []).map(fromRow);
}

export async function advanceOrder(orderId, stage) {
  const { data, error } = await supabase.rpc('advance_order', { p_order: orderId, p_stage: stage });
  if (error) throw new Error(error.message || 'Could not update the order.');
  return data ? fromRow(data) : null;
}
