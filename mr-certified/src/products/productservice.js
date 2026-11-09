// MC
/**
 * products/productService.js
 * Loads the product catalogue from Supabase.
 *
 * The rest of the app already reads products from the PRODUCTS list in data.js.
 * Instead of changing every screen, we REPLACE the contents of that same list
 * with the rows from the database, once, before the app first draws (see main.jsx).
 * If Supabase cannot be reached, the built-in sample products stay in place.
 */
import { supabase } from '../lib/supabase.js';
import { PRODUCTS } from '../data.js';

const fromRow = (r) => ({
  id: r.id,
  seller: r.seller_name,
  sellerId: r.seller_id,
  rating: Number(r.rating) || 0,
  orders: r.orders || 0,
  delivery: r.delivery || 0,
  repeat: r.repeat_rate || 0,
  city: r.city || '',
  name: r.name,
  colors: Array.isArray(r.colors) ? r.colors : [],
  price: r.price,
  cat: r.category,
  g: Array.isArray(r.g) && r.g.length >= 2 ? r.g : ['#3a3a3a', '#1a1a1a'],
  sizes: Array.isArray(r.sizes) ? r.sizes : [],
  profit: r.profit || 0,
  desc: r.description || '',
});

export async function loadProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('id', { ascending: true });
    if (error) throw error;
    if (data && data.length) PRODUCTS.splice(0, PRODUCTS.length, ...data.map(fromRow));
  } catch (err) {
    console.error('Could not load products from Supabase - showing sample products instead.', err);
  }
  return PRODUCTS;
}
