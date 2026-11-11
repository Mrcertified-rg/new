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
export const DEFAULT_ADJ = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, sharpness: 0 };

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const clampN = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Returns a NEW RGBA array with the adjustments applied (input is left untouched). */
export function applyAdjustments(src, width, height, adj) {
  const a = { ...DEFAULT_ADJ, ...adj };
  const out = new Uint8ClampedArray(src); // copy
  const add = a.brightness * 0.8;
  const c = a.contrast * 1.2;
  const cf = (259 * (c + 255)) / (255 * (259 - c));
  const warm = a.warmth * 0.4;
  const sat = 1 + a.saturation / 100;
  const noColour = sat === 1;

  for (let i = 0; i < out.length; i += 4) {
    let r = out[i] + add;
    let g = out[i + 1] + add;
    let b = out[i + 2] + add;
    r = cf * (r - 128) + 128;
    g = cf * (g - 128) + 128;
    b = cf * (b - 128) + 128;
    r += warm;
    b -= warm;
    if (!noColour) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * sat;
      g = gray + (g - gray) * sat;
      b = gray + (b - gray) * sat;
    }
    out[i] = clamp255(r);
    out[i + 1] = clamp255(g);
    out[i + 2] = clamp255(b);
  }

  if (a.sharpness > 0) sharpenInPlace(out, width, height, a.sharpness / 100);
  return out;
}

/** Gentle 3x3 sharpen, blended by "amount" (0..1). */
function sharpenInPlace(data, w, h, amount) {
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k += 1) {
        const centre = copy[i + k];
        const around = copy[i - 4 + k] + copy[i + 4 + k] + copy[i - w * 4 + k] + copy[i + w * 4 + k];
        const sharp = 5 * centre - around;
        data[i + k] = clamp255(centre + amount * (sharp - centre));
      }
    }
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
  let acc = 0; let p1 = 0; let p99 = 255;
  for (let v = 0; v < 256; v += 1) { acc += hist[v]; if (acc >= count * 0.01) { p1 = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v -= 1) { acc += hist[v]; if (acc >= count * 0.01) { p99 = v; break; } }

  const brightness = Math.round(clampN(((128 - mean) / 0.8) * 0.6, -30, 30));
  const range = p99 - p1;
  const contrast = Math.round(clampN(range < 200 ? ((200 - range) / 200) * 60 : 4, 0, 30));
  const meanSat = satSum / count;
  const saturation = meanSat > 0.55 ? 0 : 12;
  return { brightness, contrast, saturation, warmth: 0, sharpness: 25 };
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
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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
