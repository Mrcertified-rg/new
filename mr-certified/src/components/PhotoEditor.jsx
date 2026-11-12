// MC
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_ADJ, CROPS, applyAdjustments, autoEnhanceParams, fileToCanvas, renderEdit, canvasToBlob, readPixels,
} from '../products/imageTools.js';
import './photo-editor.css';

const TOOLS = [
  { id: 'looks', label: 'Looks', icon: 'FX' },
  { id: 'light', label: 'Light', icon: 'EV' },
  { id: 'color', label: 'Color', icon: 'CLR' },
  { id: 'detail', label: 'Detail', icon: 'HD' },
  { id: 'crop', label: 'Crop', icon: 'CUT' },
];
const SLIDERS = {
  light: [['brightness', 'Exposure', -60, 85], ['shadows', 'Shadows', 0, 70], ['highlights', 'Highlights', 0, 70], ['contrast', 'Contrast', -25, 35]],
  color: [['saturation', 'Color', -25, 35], ['warmth', 'Temperature', -60, 60]],
  detail: [['denoise', 'Noise reduction', 0, 70], ['clarity', 'Clarity', 0, 50], ['sharpness', 'Sharpen', 0, 45]],
};
const looks = [
  { id: 'original', label: 'Original', adj: DEFAULT_ADJ },
  { id: 'light', label: 'Brighten', adj: { ...DEFAULT_ADJ, brightness: 30, shadows: 28, denoise: 18, sharpness: 10 } },
  { id: 'indoor', label: 'Indoor', adj: { ...DEFAULT_ADJ, brightness: 52, shadows: 48, highlights: 14, warmth: 5, denoise: 38, saturation: 4, sharpness: 8 } },
  { id: 'clear', label: 'Clear', adj: { ...DEFAULT_ADJ, contrast: 8, denoise: 12, clarity: 16, sharpness: 18 } },
];

export default function PhotoEditor({ file, onDone, onCancel }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState('');
  const [adj, setAdj] = useState({ ...DEFAULT_ADJ });
  const [turns, setTurns] = useState(0);
  const [cropId, setCropId] = useState('original');
  const [tool, setTool] = useState('looks');
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const ratio = (CROPS.find((c) => c.id === cropId) || CROPS[0]).ratio;

  useEffect(() => {
    let alive = true;
    fileToCanvas(file, 2400).then(({ canvas }) => { if (alive) setSrc(canvas); })
      .catch((e) => { if (alive) setError(e.message || 'Could not open this photo.'); });
    return () => { alive = false; };
  }, [file]);

  const base = useMemo(() => (src ? renderEdit(src, { turns, ratio }, 900) : null), [src, turns, ratio]);
  const thumbnail = useMemo(() => (base ? base.toDataURL('image/jpeg', 0.55) : ''), [base]);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!base || !cv) return;
    cv.width = base.width; cv.height = base.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(base, 0, 0);
    const changed = !compare && Object.keys(DEFAULT_ADJ).some((k) => adj[k] !== 0);
    if (changed) {
      const img = ctx.getImageData(0, 0, base.width, base.height);
      img.data.set(applyAdjustments(img.data, base.width, base.height, adj)); ctx.putImageData(img, 0, 0);
    }
  }, [base, adj, compare]);

  const edited = Object.keys(DEFAULT_ADJ).some((k) => adj[k] !== 0) || turns % 4 !== 0 || cropId !== 'original';
  const auto = () => { if (base) { setAdj(autoEnhanceParams(readPixels(base).data)); setTool('light'); } };
  const finish = async () => {
    if (!src || busy) return;
    setBusy(true);
    try {
      const out = renderEdit(src, { turns, ratio, adj }, 2400);
      await onDone(await canvasToBlob(out, 0.92));
    } catch (e) { setError(e.message || 'Could not save the photo.'); setBusy(false); }
  };
  const hold = {
    onPointerDown: (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setCompare(true); },
    onPointerUp: () => setCompare(false), onPointerLeave: () => setCompare(false), onPointerCancel: () => setCompare(false),
  };

  return (
    <div className="ed" role="dialog" aria-label="Edit product photo">
      <header className="ed-head">
        <button type="button" className="ed-link" onClick={onCancel}>Cancel</button>
        <b>Edit photo</b>
        <button type="button" className="ed-link gold" onClick={finish} disabled={!src || busy}>{busy ? 'Saving...' : 'Save'}</button>
      </header>

      <div className="ed-stage">
        {!src && !error && <p className="ed-wait">Opening photo...</p>}
        {error && <p className="ed-error" role="alert">{error}</p>}
        <canvas ref={canvasRef} className="ed-canvas" />
        {src && edited && <button type="button" className="ed-compare" {...hold} aria-label="Hold to see original">{compare ? 'Original' : 'Hold to compare'}</button>}
        {tool === 'looks' && <span className="ed-device-note">Natural product photo / on-device edits</span>}
      </div>

      <div className="ed-panel">
        <nav className="ed-tools" aria-label="Photo editing tools">
          {TOOLS.map((t) => <button type="button" key={t.id} className={tool === t.id ? 'on' : ''} onClick={() => setTool(t.id)}><span>{t.icon}</span>{t.label}</button>)}
        </nav>

        {tool === 'looks' && <div className="ed-body">
          <div className="ed-actions"><button type="button" className="ed-auto" onClick={auto} disabled={!base}>Auto light</button><button type="button" className="ed-reset" onClick={() => setAdj({ ...DEFAULT_ADJ })}>Reset</button></div>
          <div className="ed-looks">{looks.map((look) => <button type="button" key={look.id} className={'ed-look' + (JSON.stringify(adj) === JSON.stringify(look.adj) ? ' on' : '')} onClick={() => setAdj({ ...look.adj })}><span className={'ed-look-preview ' + look.id} style={{ backgroundImage: thumbnail ? `url("${thumbnail}")` : undefined }} /><small>{look.label}</small></button>)}</div>
          <p className="ed-note">Clean, realistic adjustments. No monochrome or artificial effects.</p>
        </div>}

        {SLIDERS[tool] && <div className="ed-body ed-slider-list">
          {tool === 'light' && <div className="ed-actions"><button type="button" className="ed-auto" onClick={auto} disabled={!base}>Auto light</button><button type="button" className="ed-reset" onClick={() => setAdj({ ...DEFAULT_ADJ })}>Reset</button></div>}
          {SLIDERS[tool].map(([key, label, min, max]) => (
            <label className="ed-slider" key={key}><span>{label}<em>{adj[key] > 0 ? '+' : ''}{adj[key]}</em></span><input type="range" min={min} max={max} value={adj[key]} onChange={(e) => setAdj((a) => ({ ...a, [key]: Number(e.target.value) }))} /></label>
          ))}
        </div>}

        {tool === 'crop' && <div className="ed-body">
          <div className="ed-actions"><button type="button" className="ed-reset" onClick={() => setTurns((t) => t + 3)}>Rotate left</button><button type="button" className="ed-reset" onClick={() => setTurns((t) => t + 1)}>Rotate right</button></div>
          <p className="ed-label">Photo shape</p><div className="ed-chips">{CROPS.map((c) => <button type="button" key={c.id} className={'ed-chip' + (cropId === c.id ? ' on' : '')} onClick={() => setCropId(c.id)}>{c.label}</button>)}</div>
        </div>}
      </div>
    </div>
  );
}
