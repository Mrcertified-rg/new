// MC
/**
 * products/imageTools.js
 * Photo helpers for the "Add product" screen.
 * Part 1 (pure maths, no browser needed): brightness / contrast / colour / warmth /
 * sharpness, auto-enhance and a quick quality check.
 * Part 2 (browser only): load a photo, rotate, crop, resize and export as JPEG.
 * There are deliberately NO black-and-white or "party" filters: the goal is
 * clear, honest, natural-looking product photos.
 */

/* ----------------------------- part 1: maths ----------------------------- */
export const DEFAULT_ADJ = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, sharpness: 0, shadows: 0, highlights: 0, denoise: 0, clarity: 0 };

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const clampN = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Returns a NEW RGBA array with the adjustments applied (input is left untouched). */
export function applyAdjustments(src, width, height, adj) {
  const a = { ...DEFAULT_ADJ, ...adj };
  const out = a.denoise > 0 ? denoisePixels(src, width, height, a.denoise / 100) : new Uint8ClampedArray(src);
  const exposure = 2 ** (a.brightness / 100 * 1.25);
  const contrast = 1 + a.contrast / 100 * 0.55;
  const warm = a.warmth * 0.12;
  const shadowLift = a.shadows / 100 * 0.44;
  const highlightRecovery = a.highlights / 100 * 0.38;
  const saturation = 1 + a.saturation / 100;
  const step = Math.max(1, Math.round(Math.max(width, height) / 1200));
  for (let i = 0; i < out.length; i += 4) {
    const oldLuma = lumaOf(src, i) / 255;
    const lifted = Math.max(0, oldLuma * exposure + shadowLift * (1 - oldLuma) ** 2 - highlightRecovery * oldLuma ** 2);
    const rolled = lifted / (1 + Math.max(0, lifted - 0.78) * 0.8);
    const tone = clampN((rolled - 0.5) * contrast + 0.5, 0, 1);
    const scale = tone / Math.max(oldLuma, 0.015);
    let r = out[i] * scale + warm; let g = out[i + 1] * scale; let b = out[i + 2] * scale - warm;
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    const sat = saturation >= 1 ? 1 + (saturation - 1) * (1 - Math.min(1, chroma)) : saturation;
    r = gray + (r - gray) * sat; g = gray + (g - gray) * sat; b = gray + (b - gray) * sat;
    out[i] = clamp255(r); out[i + 1] = clamp255(g); out[i + 2] = clamp255(b);
  }
  if (a.clarity > 0) addLocalContrast(out, width, height, a.clarity / 100, step);
  if (a.sharpness > 0) sharpenInPlace(out, width, height, a.sharpness / 100, step);
  return out;
}

/** Gentle 3x3 sharpen, blended by "amount" (0..1). */
function sharpenInPlace(data, w, h, amount, step = 1) {
  const copy = new Uint8ClampedArray(data);
  for (let y = step; y < h - step; y += 1) {
    for (let x = step; x < w - step; x += 1) {
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k += 1) {
        const centre = copy[i + k];
        const around = copy[i - step * 4 + k] + copy[i + step * 4 + k] + copy[i - w * step * 4 + k] + copy[i + w * step * 4 + k];
        const detail = 4 * centre - around;
        if (Math.abs(detail) > 4) data[i + k] = clamp255(centre + amount * 0.55 * detail);
      }
    }
  }
}

function denoisePixels(data, w, h, amount) {
  const out = new Uint8ClampedArray(data); const strength = amount * 0.42;
  const step = Math.max(1, Math.round(Math.max(w, h) / 1200));
  for (let y = step; y < h - step; y += 1) for (let x = step; x < w - step; x += 1) {
    const i = (y * w + x) * 4; const centre = lumaOf(data, i); let total = 0; const sum = [0, 0, 0];
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      const ni = ((y + dy * step) * w + x + dx * step) * 4;
      const weight = (dx === 0 && dy === 0 ? 1 : 0.7) * Math.max(0.04, 1 - Math.abs(lumaOf(data, ni) - centre) / (10 + amount * 34));
      total += weight; for (let k = 0; k < 3; k += 1) sum[k] += data[ni + k] * weight;
    }
    for (let k = 0; k < 3; k += 1) out[i + k] = data[i + k] * (1 - strength) + (sum[k] / total) * strength;
  }
  return out;
}

function addLocalContrast(data, w, h, amount, step = 1) {
  const copy = new Uint8ClampedArray(data);
  for (let y = step; y < h - step; y += 1) for (let x = step; x < w - step; x += 1) {
    const i = (y * w + x) * 4;
    const local = (lumaOf(copy, i - step * 4) + lumaOf(copy, i + step * 4) + lumaOf(copy, i - w * step * 4) + lumaOf(copy, i + w * step * 4)) / 4;
    const detail = lumaOf(copy, i) - local; if (Math.abs(detail) < 3) continue;
    const lift = clampN(detail * amount * 0.34, -10, 10);
    for (let k = 0; k < 3; k += 1) data[i + k] = clamp255(copy[i + k] + lift);
  }
}

function lumaOf(data, i) { return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; }

/** Looks at the photo and suggests natural-looking settings. */
export function autoEnhanceParams(data) {
  const hist = new Uint32Array(256);
  let sum = 0;
  let count = 0;
  let satSum = 0;
  for (let i = 0; i < data.length; i += 16) { // every 4th pixel is plenty
    const l = Math.round(lumaOf(data, i));
    hist[l] += 1;
    sum += l;
    count += 1;
    const mx = Math.max(data[i], data[i + 1], data[i + 2]);
    const mn = Math.min(data[i], data[i + 1], data[i + 2]);
    satSum += mx === 0 ? 0 : (mx - mn) / mx;
  }
  if (!count) return { ...DEFAULT_ADJ };
  const mean = sum / count;
  const percentile = (target) => { let total = 0; for (let v = 0; v < 256; v += 1) { total += hist[v]; if (total >= count * target) return v; } return 255; };
  const p10 = percentile(0.10); const p15 = percentile(0.15); const p50 = percentile(0.50); const p95 = percentile(0.95); const p98 = percentile(0.98);
  const meanSat = satSum / count;
  return {
    ...DEFAULT_ADJ,
    brightness: Math.round(clampN(Math.log2(110 / Math.max(18, p50)) * 64, -22, 85)),
    shadows: Math.round(clampN((92 - p10) * 0.66, 0, 58)),
    highlights: Math.round(clampN((p98 - 222) * 0.65, 0, 32)),
    contrast: Math.round(clampN((190 - (p95 - p15)) * 0.10, 0, 12)),
    saturation: meanSat > 0.60 ? 0 : 5,
    denoise: mean < 75 ? 48 : mean < 120 ? 30 : mean < 160 ? 14 : 0,
    clarity: 8,
    sharpness: 14,
  };
}

/** Average colour (used for the card background while the photo loads). */
export function averageColor(data) {
  let r = 0; let g = 0; let b = 0; let n = 0;
  for (let i = 0; i < data.length; i += 16) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n += 1; }
  return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [58, 58, 58];
}
const hex = (n) => n.toString(16).padStart(2, '0');
export const rgbToHex = ([r, g, b]) => '#' + hex(r) + hex(g) + hex(b);
export const darker = ([r, g, b], f = 0.45) => [Math.round(r * f), Math.round(g * f), Math.round(b * f)];

/**
 * Quick quality check. Returns { mean, sharpness, tips[] }.
 * "sharpness" is the variance of a Laplacian edge filter on a grey copy
 * (low = blurry). Thresholds are rules of thumb, shown only as friendly tips.
 */
export function analyzePhoto(data, width, height) {
  const grey = new Float32Array(width * height);
  let sum = 0;
  for (let p = 0, i = 0; p < grey.length; p += 1, i += 4) { grey[p] = lumaOf(data, i); sum += grey[p]; }
  const mean = sum / grey.length;

  let n = 0; let s = 0; let s2 = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p = y * width + x;
      const lap = 4 * grey[p] - grey[p - 1] - grey[p + 1] - grey[p - width] - grey[p + width];
      s += lap; s2 += lap * lap; n += 1;
    }
  }
  const sharpness = n ? s2 / n - (s / n) * (s / n) : 0;

  const tips = [];
  if (mean < 70) tips.push('A bit dark. Try Auto-enhance, or move near a window.');
  else if (mean > 200) tips.push('Very bright. Try lowering Brightness.');
  if (sharpness < 25) tips.push('Looks blurry. Hold steady and tap the screen to focus, then retake.');
  return { mean, sharpness, tips };
}

/* ----------------------- part 2: browser helpers ----------------------- */
/** Loads a photo file. The phone's rotation flag (EXIF) is respected. */
export async function fileToCanvas(file, maxSide = 1600) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file could not be opened as a photo.')); };
      img.src = url;
    });
  }
  const w = bitmap.width || bitmap.naturalWidth;
  const h = bitmap.height || bitmap.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (bitmap.close) bitmap.close();
  return { canvas, originalWidth: w, originalHeight: h };
}

export const CROPS = [
  { id: 'original', label: 'Original', ratio: null },
  { id: 'portrait', label: 'Portrait 4:5', ratio: 4 / 5, hint: 'Best for shop feeds' },
  { id: 'square', label: 'Square', ratio: 1 },
];

/** Rotate (quarter turns) + centre-crop + scale down, then apply the adjustments. */
export function renderEdit(source, { turns = 0, ratio = null, adj = DEFAULT_ADJ }, maxSide = 1600) {
  const t = ((turns % 4) + 4) % 4;
  const sw = t % 2 ? source.height : source.width;
  const sh = t % 2 ? source.width : source.height;

  // 1) rotate
  const rot = document.createElement('canvas');
  rot.width = sw; rot.height = sh;
  const rc = rot.getContext('2d');
  rc.translate(sw / 2, sh / 2);
  rc.rotate((t * Math.PI) / 2);
  rc.drawImage(source, -source.width / 2, -source.height / 2);

  // 2) centre crop to the chosen ratio
  let cx = 0; let cy = 0; let cw = sw; let ch = sh;
  if (ratio) {
    if (sw / sh > ratio) { cw = Math.round(sh * ratio); cx = Math.round((sw - cw) / 2); }
    else { ch = Math.round(sw / ratio); cy = Math.round((sh - ch) / 2); }
  }

  // 3) scale down if needed
  const scale = Math.min(1, maxSide / Math.max(cw, ch));
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(cw * scale));
  out.height = Math.max(1, Math.round(ch * scale));
  const oc = out.getContext('2d');
  oc.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in oc) oc.imageSmoothingQuality = 'high';
  oc.drawImage(rot, cx, cy, cw, ch, 0, 0, out.width, out.height);

  // 4) colour / light adjustments
  const changed = Object.keys(DEFAULT_ADJ).some((k) => (adj[k] || 0) !== 0);
  if (changed) {
    const img = oc.getImageData(0, 0, out.width, out.height);
    img.data.set(applyAdjustments(img.data, out.width, out.height, adj));
    oc.putImageData(img, 0, 0);
  }
  return out;
}

export const canvasToBlob = (canvas, quality = 0.86) => new Promise((resolve, reject) => {
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the photo.'))), 'image/jpeg', quality);
});

export function readPixels(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, width: canvas.width, height: canvas.height };
}
