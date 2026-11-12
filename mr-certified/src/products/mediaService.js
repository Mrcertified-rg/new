// MC
/**
 * products/mediaService.js
 * Uploads a photo or video to the Supabase "product-media" bucket and returns its public link.
 * Files go into a folder named after the seller's id (the database rules require that).
 */
import { supabase } from '../lib/supabase.js';

const TYPES = {
  jpg: 'image/jpeg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

export const MAX_VIDEO_MB = 50;

export async function uploadProductMedia(userId, blob, ext) {
  const type = TYPES[ext];
  if (!type) throw new Error('This file type is not supported.');
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('product-media')
    .upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) {
    if (/row-level security|not authorized|policy/i.test(error.message)) {
      throw new Error('Your seller account is not approved yet, so uploads are locked.');
    }
    throw new Error('Upload failed. Check your internet and try again.');
  }
  return supabase.storage.from('product-media').getPublicUrl(path).data.publicUrl;
}

export async function removeProductMedia(publicUrl) {
  try {
    const marker = '/object/public/product-media/';
    const pathName = new URL(publicUrl).pathname;
    const markerAt = pathName.indexOf(marker);
    if (markerAt < 0) return;
    const path = decodeURIComponent(pathName.slice(markerAt + marker.length));
    await supabase.storage.from('product-media').remove([path]);
  } catch {
    // A failed listing insert should not hide its original error if cleanup also fails.
  }
}
