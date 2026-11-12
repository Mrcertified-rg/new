import React, { useEffect, useRef, useState } from 'react';
import { CROPS, DEFAULT_ADJ, analyzePhoto, autoEnhanceParams, canvasToBlob, fileToCanvas, readPixels, renderEdit } from '../products/imageTools.js';
import { MAX_VIDEO_MB } from '../products/mediaService.js';
import { createProduct } from '../products/productservice.js';

const CATEGORIES = ['Women', 'Men', 'Kids', 'Beauty', 'Shoes', 'Accessories', 'Home & Household', 'Services'];
const ADJUSTMENTS = [
  ['brightness', 'Exposure', -60, 60],
  ['shadows', 'Shadows', 0, 70],
  ['highlights', 'Highlights', 0, 70],
  ['contrast', 'Contrast', -25, 35],
  ['saturation', 'Color', -25, 35],
  ['warmth', 'Temperature', -60, 60],
  ['denoise', 'Noise reduction', 0, 70],
  ['clarity', 'Clarity', 0, 50],
  ['sharpness', 'Sharpen', 0, 45],
];

export default function AddProductModal({ close, seller, sellerName, onCreated }) {
  const inputRef = useRef(null);
  const [form, setForm] = useState({ name: '', category: 'Women', price: '', oldPrice: '', stock: '', brand: '', condition: 'new', city: '', colors: '', sizes: '', description: '' });
  const [source, setSource] = useState(null);
  const [preview, setPreview] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [crop, setCrop] = useState('original');
  const [turns, setTurns] = useState(0);
  const [adjustments, setAdjustments] = useState({ ...DEFAULT_ADJ });
  const [qualityTips, setQualityTips] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!source) { setPreview(''); setQualityTips([]); return; }
    try {
      const output = renderEdit(source, {
        turns,
        ratio: CROPS.find((option) => option.id === crop)?.ratio || null,
        adj: adjustments,
      });
      setPreview(output.toDataURL('image/jpeg', 0.92));
      const pixels = readPixels(output);
      setQualityTips(analyzePhoto(pixels.data, pixels.width, pixels.height).tips);
    } catch (photoError) {
      setError(photoError.message || 'Could not preview this photo.');
    }
  }, [source, crop, turns, adjustments]);

  useEffect(() => () => { if (videoPreview) URL.revokeObjectURL(videoPreview); }, [videoPreview]);

  const chooseMedia = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) {
      if (!['mp4', 'webm', 'mov'].includes(ext)) { setError('Choose an MP4, WebM, or MOV video.'); return; }
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`Choose a video smaller than ${MAX_VIDEO_MB} MB.`); return; }
      setSource(null);
      setPreview('');
      setVideoFile(file);
      setVideoPreview((oldUrl) => { if (oldUrl) URL.revokeObjectURL(oldUrl); return URL.createObjectURL(file); });
      return;
    }
    if (!file.type.startsWith('image/')) { setError('Choose a photo or a supported video.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Choose an image smaller than 15 MB.'); return; }
    try {
      const loaded = await fileToCanvas(file, 2400);
      setVideoFile(null);
      setVideoPreview((oldUrl) => { if (oldUrl) URL.revokeObjectURL(oldUrl); return ''; });
      setSource(loaded.canvas);
      setCrop('original');
      setTurns(0);
      setAdjustments({ ...DEFAULT_ADJ });
    } catch (photoError) {
      setError(photoError.message || 'Could not open that photo. Please try another one.');
    }
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!source && !videoFile) { setError('Add a product photo or video before publishing.'); return; }
    if (!form.name.trim()) { setError('Enter a product name.'); return; }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) { setError('Enter a valid price greater than zero.'); return; }
    const oldPrice = form.oldPrice ? Number(form.oldPrice) : null;
    if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice <= price)) { setError('The original price must be higher than the selling price.'); return; }
    const stock = form.stock === '' ? null : Number(form.stock);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) { setError('Stock must be a whole number greater than or equal to zero.'); return; }

    setBusy(true);
    try {
      const image = source ? await canvasToBlob(renderEdit(source, {
        turns,
        ratio: CROPS.find((option) => option.id === crop)?.ratio || null,
        adj: adjustments,
      }), 0.92) : null;
      const product = await createProduct({
        sellerId: seller?.id,
        sellerName,
        name: form.name.trim(),
        category: form.category,
        price,
        oldPrice,
        stock,
        brand: form.brand.trim(),
        condition: form.condition,
        city: form.city.trim(),
        colors: form.colors.split(',').map((value) => value.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map((value) => value.trim()).filter(Boolean),
        description: form.description.trim(),
        image,
        video: videoFile,
        videoExt: videoFile?.name.split('.').pop()?.toLowerCase(),
      });
      onCreated(product);
    } catch (submitError) {
      setError(submitError.message || 'Could not publish this product. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-wrap apm-wrap" onClick={(event) => { if (event.target === event.currentTarget && !busy) close(); }}>
      <section className="modal apm-modal" role="dialog" aria-modal="true" aria-labelledby="apm-title">
        <div className="row apm-heading">
          <div><span className="seller-eyebrow">YOUR CATALOG</span><h2 id="apm-title">Add product</h2></div>
          <button type="button" className="apm-close" onClick={close} disabled={busy} aria-label="Close">×</button>
        </div>
        <form className="apm-form" onSubmit={submit}>
          <div className="apm-photo-block">
            {preview ? <img className="apm-preview" src={preview} alt="Edited product preview" /> : videoPreview ? (
              <video className="apm-preview" src={videoPreview} controls playsInline />
            ) : (
              <button type="button" className="apm-photo-placeholder" onClick={() => inputRef.current?.click()}>
                <span aria-hidden="true">＋</span><b>Add a product photo or video</b><small>Photos up to 15 MB · MP4, WebM, or MOV video up to {MAX_VIDEO_MB} MB</small>
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,.mov" hidden onChange={chooseMedia} />
            {(preview || videoPreview) && <button type="button" className="btn ghost apm-change-photo" onClick={() => inputRef.current?.click()}>Change media</button>}
          </div>

          {source && <div className="apm-editor">
            <div className="apm-toolbar">
              <button type="button" className="btn ghost" onClick={() => setTurns((value) => value + 1)}>↻ Rotate</button>
              <button type="button" className="btn ghost" onClick={() => { setAdjustments(autoEnhanceParams(readPixels(source).data)); }}>Auto light</button>
            </div>
            <label className="apm-field"><span>Crop</span><select value={crop} onChange={(event) => setCrop(event.target.value)}>{CROPS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <details className="apm-adjustments">
              <summary>Fine tune photo</summary>
              {ADJUSTMENTS.map(([key, label, min, max]) => (
                <label className="apm-slider" key={key}>
                  <span>{label}<b>{adjustments[key]}</b></span>
                  <input type="range" min={min} max={max} value={adjustments[key]} onChange={(event) => setAdjustments((current) => ({ ...current, [key]: Number(event.target.value) }))} />
                </label>
              ))}
            </details>
            {qualityTips.length > 0 && <ul className="apm-quality">{qualityTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}
          </div>}

          <label className="apm-field"><span>Product name</span><input required maxLength={90} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Linen summer dress" /></label>
          <div className="apm-grid">
            <label className="apm-field"><span>Category</span><select value={form.category} onChange={(event) => setField('category', event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="apm-field"><span>Price (KSh)</span><input required type="number" min="1" step="1" value={form.price} onChange={(event) => setField('price', event.target.value)} placeholder="3500" /></label>
          </div>
          <label className="apm-field"><span>Original price <small>optional sale price</small></span><input type="number" min="1" step="1" value={form.oldPrice} onChange={(event) => setField('oldPrice', event.target.value)} placeholder="Leave blank when not on sale" /></label>
          <div className="apm-grid">
            <label className="apm-field"><span>Brand <small>optional</small></span><input maxLength={80} value={form.brand} onChange={(event) => setField('brand', event.target.value)} placeholder="Brand name" /></label>
            <label className="apm-field"><span>Condition</span><select value={form.condition} onChange={(event) => setField('condition', event.target.value)}><option value="new">New</option><option value="like_new">Like new</option><option value="used">Used</option></select></label>
          </div>
          <label className="apm-field"><span>Stock <small>optional</small></span><input type="number" min="0" step="1" value={form.stock} onChange={(event) => setField('stock', event.target.value)} placeholder="Leave blank if not tracked" /></label>
          <label className="apm-field"><span>City</span><input value={form.city} onChange={(event) => setField('city', event.target.value)} placeholder="Nairobi" /></label>
          <div className="apm-grid">
            <label className="apm-field"><span>Colors <small>comma separated</small></span><input value={form.colors} onChange={(event) => setField('colors', event.target.value)} placeholder="Black, Cream" /></label>
            <label className="apm-field"><span>Sizes <small>comma separated</small></span><input value={form.sizes} onChange={(event) => setField('sizes', event.target.value)} placeholder="S, M, L" /></label>
          </div>
          <label className="apm-field"><span>Description</span><textarea maxLength={700} rows={3} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Describe the product for buyers" /></label>
          {error && <p className="apm-error" role="alert">{error}</p>}
          <div className="apm-actions"><button type="button" className="btn ghost" onClick={close} disabled={busy}>Cancel</button><button type="submit" className="btn green" disabled={busy}>{busy ? 'Publishing…' : 'Publish listing'}</button></div>
        </form>
      </section>
    </div>
  );
}
