import React, { useEffect, useMemo, useRef, useState } from 'react';
import './add-product.css';
import { canvasToBlob, fileToCanvas } from '../products/imageTools.js';
import { MAX_VIDEO_MB } from '../products/mediaService.js';
import { createProduct } from '../products/productservice.js';
import CameraCapture from './CameraCapture.jsx';
import PhotoEditor from './PhotoEditor.jsx';

const MAX_PHOTOS = 6;
const CATEGORIES = ['Women', 'Men', 'Kids', 'Beauty', 'Shoes', 'Accessories', 'Home & Household', 'Services'];
const CONDITIONS = [['new', 'Brand new'], ['like_new', 'Like new'], ['used', 'Used']];
const SIZE_OPTIONS = { Women: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], Men: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], Kids: ['2-3y', '4-5y', '6-7y', '8-9y', '10-12y'], Shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] };

export default function AddProduct({ close, user, sellerAccount, onPublished }) {
  const photosInput = useRef(null);
  const videoInput = useRef(null);
  const objectUrls = useRef([]);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [camera, setCamera] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', category: '', brand: '', condition: 'new', description: '', sizes: [], colors: '', price: '', oldPrice: '', stock: '5', city: user?.address?.county || 'Nairobi' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const sizeOptions = SIZE_OPTIONS[form.category] || [];
  const missing = useMemo(() => {
    const list = [];
    if (!photos.length) list.push('at least one photo');
    if (form.title.trim().length < 3) list.push('a product title');
    if (!form.category) list.push('a category');
    if (!form.price || Number(form.price) <= 0) list.push('a valid price');
    if (Number(form.stock) < 1) list.push('stock of at least one');
    if (sizeOptions.length && !form.sizes.length) list.push('at least one size');
    return list;
  }, [photos.length, form.title, form.category, form.price, form.stock, form.sizes, sizeOptions.length]);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addPhotos = async (files) => {
    setError('');
    const remaining = Math.max(0, MAX_PHOTOS - photos.length);
    for (const file of Array.from(files || []).slice(0, remaining)) {
      if (!file.type.startsWith('image/')) { setError('Choose image files for product photos.'); continue; }
      if (file.size > 15 * 1024 * 1024) { setError('Each photo must be smaller than 15 MB.'); continue; }
      try {
        const { canvas } = await fileToCanvas(file, 1600);
        const blob = await canvasToBlob(canvas, 0.86);
        const url = URL.createObjectURL(blob);
        objectUrls.current.push(url);
        const photo = { id: `${Date.now()}-${Math.random()}`, blob, url };
        setPhotos((current) => current.length < MAX_PHOTOS ? [...current, photo] : current);
      } catch (photoError) { setError(photoError.message || 'Could not open that photo.'); }
    }
  };

  const chooseVideo = (file) => {
    setError('');
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['mp4', 'mov', 'webm'].includes(ext)) { setError('Use an MP4, MOV, or WebM video.'); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`Video must be smaller than ${MAX_VIDEO_MB} MB.`); return; }
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setVideo({ file, ext, url });
  };

  const publish = async (event) => {
    event.preventDefault();
    setError('');
    if (missing.length) { setError(`Please add ${missing.join(', ')}.`); return; }
    if (!sellerAccount?.name) { setError('Your store name is missing. Open Store settings first.'); return; }
    const price = Number(form.price);
    const oldPrice = form.oldPrice ? Number(form.oldPrice) : null;
    if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice <= price)) { setError('Was price must be higher than the selling price.'); return; }

    setBusy(true);
    try {
      setProgress('Uploading photos…');
      const product = await createProduct({
        userId: user?.id,
        sellerName: sellerAccount.name,
        name: form.title.trim(),
        category: form.category,
        price,
        oldPrice,
        stock: Number(form.stock),
        brand: form.brand.trim(),
        condition: form.condition,
        city: form.city.trim(),
        colors: form.colors.split(',').map((color) => color.trim()).filter(Boolean),
        sizes: form.sizes.length ? form.sizes : ['One size'],
        description: form.description.trim(),
        images: photos.map((photo) => photo.blob),
        video: video?.file,
        videoExt: video?.ext,
      });
      onPublished?.(product);
      close();
    } catch (publishError) {
      setError(publishError.message || 'Could not publish this product. Please try again.');
      setBusy(false);
      setProgress('');
    }
  };

  const toggleSize = (size) => setField('sizes', form.sizes.includes(size) ? form.sizes.filter((item) => item !== size) : [...form.sizes, size]);
  const editingPhoto = photos.find((photo) => photo.id === editingId);
  const savePhotoEdit = (blob) => {
    const url = URL.createObjectURL(blob);
    objectUrls.current.push(url);
    setPhotos((list) => list.map((photo) => photo.id === editingId ? { ...photo, blob, url } : photo));
    setEditingId(null);
  };

  return (
    <div className="ap-overlay" role="dialog" aria-modal="true" aria-label="Add product">
      <form className="ap-panel" onSubmit={publish}>
        <header className="ap-head"><button type="button" onClick={close} disabled={busy} aria-label="Close">×</button><div><strong>Add product</strong><small>Build your listing</small></div></header>
        <div className="ap-content">
          <section className="ap-card"><h3>Photos and video</h3><p>Add up to {MAX_PHOTOS} photos. The first photo is the cover.</p>
            <div className="ap-actions"><button type="button" onClick={() => setCamera(true)} disabled={photos.length >= MAX_PHOTOS}>Open camera</button><button type="button" onClick={() => photosInput.current?.click()} disabled={photos.length >= MAX_PHOTOS}>From gallery</button><button type="button" onClick={() => videoInput.current?.click()}>Upload video</button></div>
            <input ref={photosInput} hidden type="file" accept="image/*" multiple onChange={(event) => { addPhotos(event.target.files); event.target.value = ''; }} />
            <input ref={videoInput} hidden type="file" accept="video/mp4,video/webm,video/quicktime,.mov" onChange={(event) => { chooseVideo(event.target.files?.[0]); event.target.value = ''; }} />
            {photos.length > 0 && <div className="ap-photos">{photos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`Product photo ${index + 1}`} />{index === 0 && <figcaption>Cover photo</figcaption>}<button type="button" onClick={() => setEditingId(photo.id)}>Edit</button><button type="button" onClick={() => setPhotos((list) => list.filter((item) => item.id !== photo.id))}>Remove</button>{index > 0 && <button type="button" onClick={() => setPhotos((list) => [photo, ...list.filter((item) => item.id !== photo.id)])}>Make cover</button>}</figure>)}</div>}
            {video && <div className="ap-video"><video src={video.url} controls playsInline /><button type="button" onClick={() => setVideo(null)}>Remove video</button></div>}
          </section>
          <section className="ap-card"><h3>Product details</h3>
            <label>Title<input required maxLength={90} value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. Linen summer dress" /></label>
            <label>Category<select required value={form.category} onChange={(event) => setForm((state) => ({ ...state, category: event.target.value, sizes: [] }))}><option value="">Choose a category</option>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            {sizeOptions.length > 0 && <fieldset><legend>Sizes available</legend><div className="ap-chips">{sizeOptions.map((size) => <button type="button" key={size} className={form.sizes.includes(size) ? 'on' : ''} onClick={() => toggleSize(size)}>{size}</button>)}</div></fieldset>}
            <label>Colors <small>Separate colors with commas</small><input value={form.colors} onChange={(event) => setField('colors', event.target.value)} placeholder="Black, Cream" /></label>
            <label>Condition<select value={form.condition} onChange={(event) => setField('condition', event.target.value)}>{CONDITIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Brand <small>Optional</small><input maxLength={60} value={form.brand} onChange={(event) => setField('brand', event.target.value)} placeholder="e.g. Nike" /></label>
            <label>Description<textarea rows={4} maxLength={1000} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Materials, fit, and what's included" /></label>
          </section>
          <section className="ap-card"><h3>Price and stock</h3><div className="ap-grid"><label>Price (KSh)<input required type="number" min="1" step="1" value={form.price} onChange={(event) => setField('price', event.target.value)} /></label><label>Was price (optional)<input type="number" min="1" step="1" value={form.oldPrice} onChange={(event) => setField('oldPrice', event.target.value)} /></label></div>
            <div className="ap-grid"><label>Stock<input required type="number" min="1" max="9999" step="1" value={form.stock} onChange={(event) => setField('stock', event.target.value)} /></label><label>Ships from<input value={form.city} onChange={(event) => setField('city', event.target.value)} placeholder="County or city" /></label></div>
          </section>
          {error && <p className="ap-error" role="alert">{error}</p>}
        </div>
        <footer className="ap-foot"><button type="button" onClick={close} disabled={busy}>Cancel</button><button type="submit" disabled={busy || missing.length > 0}>{busy ? (progress || 'Publishing…') : 'Publish product'}</button></footer>
      </form>
      {camera && <CameraCapture start="photo" remaining={MAX_PHOTOS - photos.length} onPhoto={(file) => addPhotos([file])} onVideo={chooseVideo} onClose={() => setCamera(false)} />}
      {editingPhoto && <PhotoEditor file={editingPhoto.blob} onDone={savePhotoEdit} onCancel={() => setEditingId(null)} />}
    </div>
  );
}
