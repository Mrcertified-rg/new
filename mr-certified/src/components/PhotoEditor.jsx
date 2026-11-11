// MC
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_ADJ, CROPS, applyAdjustments, autoEnhanceParams, fileToCanvas, renderEdit, canvasToBlob, readPixels,
} from '../products/imageTools.js';

const SLIDERS = [
  ['brightness', 'Brightness', -100, 100],
  ['contrast', 'Contrast', -100, 100],
  ['saturation', 'Colour', -100, 100],
  ['warmth', 'Warmth', -100, 100],
  ['sharpness', 'Sharpness', 0, 100],
];

/**
 * Photo editor for product photos. Natural, clear fixes only:
 * Auto-enhance, brightness, contrast, colour, warmth, sharpness, rotate and crop.
 * (No black-and-white or party filters on purpose.)
 */
export default function PhotoEditor({ file, onDone, onCancel }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState('');
  const [adj, setAdj] = useState(DEFAULT_ADJ);
  const [turns, setTurns] = useState(0);
  const [cropId, setCropId] = useState('original');
  const [tab, setTab] = useState('enhance');
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const ratio = (CROPS.find((c) => c.id === cropId) || CROPS[0]).ratio;

  useEffect(() => {
    let alive = true;
    fileToCanvas(file, 1600)
      .then(({ canvas }) => { if (alive) setSrc(canvas); })
      .catch((e) => { if (alive) setError(e.message || 'Could not open this photo.'); });
    return () => { alive = false; };
  }, [file]);

  // rotated + cropped working copy used for the live preview (small = fast sliders)
  const base = useMemo(() => (src ? renderEdit(src, { turns, ratio }, 760) : null), [src, turns, ratio]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!base || !cv) return;
    cv.width = base.width;
    cv.height = base.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(base, 0, 0);
    const changed = !compare && Object.keys(DEFAULT_ADJ).some((k) => adj[k] !== 0);
    if (changed) {
      const img = ctx.getImageData(0, 0, base.width, base.height);
      img.data.set(applyAdjustments(img.data, base.width, base.height, adj));
      ctx.putImageData(img, 0, 0);
    }
  }, [base, adj, compare]);

  const setValue = (key) => (e) => setAdj((a) => ({ ...a, [key]: Number(e.target.value) }));
  const edited = Object.keys(DEFAULT_ADJ).some((k) => adj[k] !== 0) || turns % 4 !== 0 || cropId !== 'original';

  const auto = () => {
    if (!base) return;
    setAdj(autoEnhanceParams(readPixels(base).data));
  };

  const finish = async () => {
    if (!src || busy) return;
    setBusy(true);
    try {
      const out = renderEdit(src, { turns, ratio, adj }, 1600);
      const blob = await canvasToBlob(out, 0.86);
      onDone(blob);
    } catch (e) {
      setError(e.message || 'Could not save the photo.');
      setBusy(false);
    }
  };

  const hold = {
    onPointerDown: () => setCompare(true),
    onPointerUp: () => setCompare(false),
    onPointerLeave: () => setCompare(false),
    onPointerCancel: () => setCompare(false),
  };

  return (
    <div className="ed" role="dialog" aria-label="Edit photo">
      <header className="ed-head">
        <button type="button" className="ed-link" onClick={onCancel}>Cancel</button>
        <b>Edit photo</b>
        <button type="button" className="ed-link gold" onClick={finish} disabled={!src || busy}>{busy ? 'Saving…' : 'Done'}</button>
      </header>

      <div className="ed-stage">
        {!src && !error && <p className="ed-wait">Opening photo…</p>}
        {error && <p className="ed-error" role="alert">{error}</p>}
        <canvas ref={canvasRef} className="ed-canvas" />
        {src && edited && (
          <button type="button" className="ed-compare" {...hold} aria-label="Hold to see the original">Hold to compare</button>
        )}
      </div>

      <div className="ed-panel">
        <div className="ed-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'enhance'} className={tab === 'enhance' ? 'on' : ''} onClick={() => setTab('enhance')}>Enhance</button>
          <button type="button" role="tab" aria-selected={tab === 'crop'} className={tab === 'crop' ? 'on' : ''} onClick={() => setTab('crop')}>Crop &amp; rotate</button>
        </div>

        {tab === 'enhance' && (
          <div className="ed-body">
            <div className="ed-actions">
              <button type="button" className="ap-btn gold" onClick={auto} disabled={!base}>✨ Auto-enhance</button>
              <button type="button" className="ap-btn" onClick={() => setAdj(DEFAULT_ADJ)} disabled={!base}>Reset</button>
            </div>
            {SLIDERS.map(([key, label, min, max]) => (
              <label className="ed-slider" key={key}>
                <span>{label}<em>{adj[key] > 0 ? '+' : ''}{adj[key]}</em></span>
                <input type="range" min={min} max={max} value={adj[key]} onChange={setValue(key)} />
              </label>
            ))}
          </div>
        )}

        {tab === 'crop' && (
          <div className="ed-body">
            <div className="ed-actions">
              <button type="button" className="ap-btn" onClick={() => setTurns((t) => t + 3)}>↺ Rotate left</button>
              <button type="button" className="ap-btn" onClick={() => setTurns((t) => t + 1)}>↻ Rotate right</button>
            </div>
            <p className="ed-label">Shape</p>
            <div className="ed-chips">
              {CROPS.map((c) => (
                <button type="button" key={c.id} className={'ap-chip' + (cropId === c.id ? ' on' : '')} onClick={() => setCropId(c.id)}>
                  {c.label}{c.hint ? <small>{c.hint}</small> : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
