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
import { removeProductMedia, uploadProductMedia } from './mediaService.js';

const fromRow = (r) => {
  const imageUrls = Array.isArray(r.images) && r.images.length
    ? r.images
    : [r.image_url || r.image].filter(Boolean);
  const videoUrls = Array.isArray(r.videos) && r.videos.length
    ? r.videos
    : [r.video_url || r.video].filter(Boolean);

  return {
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
    oldPrice: r.old_price ?? null,
    cat: r.category,
    g: Array.isArray(r.g) && r.g.length >= 2 ? r.g : ['#3a3a3a', '#1a1a1a'],
    sizes: Array.isArray(r.sizes) ? r.sizes : [],
    profit: r.profit || 0,
    desc: r.description || '',
    image: imageUrls[0] || '',
    image_url: r.image_url || imageUrls[0] || '',
    images: imageUrls,
    video: videoUrls[0] || '',
    video_url: r.video_url || videoUrls[0] || '',
    videos: videoUrls,
    stock: r.stock ?? null,
    brand: r.brand || '',
    condition: r.condition || 'new',
  };
};

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

export async function createProduct({ sellerId, userId, sellerName, name, category, price, oldPrice, city, colors = [], sizes = [], description = '', image, images, video, videoUrl, videoExt, stock, brand = '', condition = 'new', g }) {
  sellerId = sellerId || userId;
  if (!sellerId) throw new Error('Sign in to the approved seller account before publishing a product.');
  const sourceImages = Array.isArray(images) ? images : [image].filter(Boolean);
  if (!sourceImages.length && !(video instanceof Blob) && !videoUrl) throw new Error('Choose a product photo or video before publishing.');
  const stockValue = stock === '' || stock === undefined || stock === null ? null : Number(stock);
  if (stockValue !== null && (!Number.isInteger(stockValue) || stockValue < 0)) {
    throw new Error('Stock must be a whole number greater than or equal to zero.');
  }

  const uploadedMedia = [];
  try {
    const imageUrls = [];
    for (const photo of sourceImages) {
      if (photo instanceof Blob) {
        const url = await uploadProductMedia(sellerId, photo, 'jpg');
        imageUrls.push(url);
        uploadedMedia.push(url);
      } else if (typeof photo === 'string') imageUrls.push(photo);
    }
    let storedVideoUrl = videoUrl || '';
    if (video instanceof Blob) {
      storedVideoUrl = await uploadProductMedia(sellerId, video, videoExt);
      uploadedMedia.push(storedVideoUrl);
    }
    const row = {
      seller_id: sellerId,
      seller_name: sellerName,
      name: String(name || '').trim(),
      category,
      price,
      old_price: oldPrice || null,
      city,
      colors,
      sizes,
      description,
      image_url: imageUrls[0] || null,
      images: imageUrls,
      videos: storedVideoUrl ? [storedVideoUrl] : [],
      video_url: storedVideoUrl || null,
      stock: stockValue,
      brand: String(brand || '').trim(),
      condition: condition || 'new',
      g: Array.isArray(g) && g.length >= 2 ? g : ['#3a3a3a', '#1a1a1a'],
      rating: 0,
      orders: 0,
      delivery: 0,
      repeat_rate: 0,
      profit: 0,
      status: 'active',
    };

    const { data, error } = await supabase.from('products').insert(row).select('*').single();
    if (error) throw new Error(`Could not publish the product: ${error.message}`);
    const product = fromRow(data);
    // Keep repeated submissions/retries from inserting the same returned row twice.
    const existingIndex = PRODUCTS.findIndex((item) => String(item.id) === String(product.id));
    if (existingIndex >= 0) PRODUCTS.splice(existingIndex, 1);
    PRODUCTS.unshift(product);
    return product;
  } catch (error) {
    await Promise.all(uploadedMedia.map(removeProductMedia));
    throw error;
  }
}
