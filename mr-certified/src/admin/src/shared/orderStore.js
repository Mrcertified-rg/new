// MC
/**
 * shared/orderStore.js
 * Public app -> admin console bridge (DEMO ONLY, same browser).
 * Real orders placed by signed-in buyers are copied into localStorage so the
 * admin console can oversee them. Orders are only ever added/updated here,
 * never deleted. With a backend this file is replaced by an API call.
 */
const KEY = 'mrc.demo.orders';

export function saveOrdersForAdmin(orders) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    orders.filter((o) => o.customer).forEach((o) => { all[o.id] = { ...all[o.id], ...o }; });
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* storage full/blocked */ }
}
