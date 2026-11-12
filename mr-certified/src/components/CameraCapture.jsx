// MC
import React, { useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 45;

const pickMime = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const options = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return options.find((t) => MediaRecorder.isTypeSupported(t)) || '';
};

/**
 * Full-screen camera.
 *  - Photo tab: take as many photos as you like (they are added one by one), tap Done when finished.
 *  - Video tab: tap the red button to start, tap again to stop (max 45 seconds).
 *  - The flip button switches between the back and the front camera.
 * If the browser blocks the live camera (for example an http:// address on a phone),
 * it falls back to the phone's own camera app.
 */
export default function CameraCapture({ start = 'photo', remaining = 6, onPhoto, onVideo, onClose }) {
  const [tab, setTab] = useState(start);
  const [facing, setFacing] = useState('environment');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [shots, setShots] = useState(0);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  // (re)open the camera when the tab or the camera side changes
  useEffect(() => {
    if (!supported) return undefined;
    let cancelled = false;
    setReady(false);
    setError('');
    (async () => {
      stopStream();
      const video = { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } };
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: tab === 'video' });
        } catch (e) {
          if (tab !== 'video') throw e;
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: false }); // no microphone: still record
        }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e && e.name === 'NotAllowedError'
            ? 'Camera permission is off. Allow camera access for this site in your browser settings, then try again.'
            : 'Could not open the camera on this device.');
        }
      }
    })();
    return () => { cancelled = true; stopStream(); };
  }, [facing, tab, supported]);

  // on close: stop everything, throw away an unfinished recording
  useEffect(() => () => {
    clearInterval(timerRef.current);
    const rec = recRef.current;
    if (rec && rec.state === 'recording') { try { rec.onstop = null; rec.stop(); } catch { /* ignore */ } }
  }, []);

  const takePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      setFlash(true);
      setTimeout(() => setFlash(false), 140);
      const next = shots + 1;
      setShots(next);
      onPhoto(new File([blob], 'camera-' + Date.now() + '.jpg', { type: 'image/jpeg' }));
      if (next >= remaining) onClose();
    }, 'image/jpeg', 0.92);
  };

  const stopRec = () => {
    const rec = recRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  };

  const startRec = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') {
      setError('Video recording is not supported in this browser. Use "Upload video" instead.');
      return;
    }
    const mime = pickMime();
    let rec;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : { videoBitsPerSecond: 2500000 });
    } catch {
      rec = new MediaRecorder(stream);
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      clearInterval(timerRef.current);
      setRecording(false);
      const isMp4 = String(rec.mimeType || mime).includes('mp4');
      const blob = new Blob(chunksRef.current, { type: isMp4 ? 'video/mp4' : 'video/webm' });
      onVideo(new File([blob], 'video-' + Date.now() + (isMp4 ? '.mp4' : '.webm'), { type: blob.type }));
      onClose();
    };
    rec.start(500);
    recRef.current = rec;
    setRecording(true);
    setSeconds(0);
    let n = 0;
    timerRef.current = setInterval(() => {
      n += 1;
      setSeconds(n);
      if (n >= MAX_SECONDS) stopRec();
    }, 1000);
  };

  const pickFile = (kind) => (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (kind === 'photo') onPhoto(file); else onVideo(file);
    onClose();
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  // -------- fallback: this browser/address cannot open a live camera --------
  if (!supported) {
    return (
      <div className="cam" role="dialog" aria-label="Camera">
        <div className="cam-top"><button type="button" className="cam-round" onClick={onClose} aria-label="Close">✕</button></div>
        <div className="cam-msg">
          <h3>Use your phone camera</h3>
          <p>The live camera needs a secure (https) page. These buttons open your phone&apos;s own camera instead.</p>
          <label className="ap-btn gold">📷 Take photo
            <input type="file" accept="image/*" capture="environment" hidden onChange={pickFile('photo')} />
          </label>
          <label className="ap-btn">🎥 Record video
            <input type="file" accept="video/*" capture="environment" hidden onChange={pickFile('video')} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="cam" role="dialog" aria-label="Camera">
      <video ref={videoRef} className={'cam-video' + (facing === 'user' ? ' mirror' : '')} muted playsInline autoPlay />
      {flash && <div className="cam-flash" />}

      <div className="cam-top">
        <button type="button" className="cam-round" onClick={onClose} aria-label="Close camera">✕</button>
        <div className="cam-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'photo'} className={tab === 'photo' ? 'on' : ''} disabled={recording} onClick={() => setTab('photo')}>Photo</button>
          <button type="button" role="tab" aria-selected={tab === 'video'} className={tab === 'video' ? 'on' : ''} disabled={recording} onClick={() => setTab('video')}>Video</button>
        </div>
        <button type="button" className="cam-round" onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))} disabled={recording} aria-label="Switch camera" title="Switch between back and front camera">⟲</button>
      </div>

      {recording && <div className="cam-timer"><i /> {mm}:{ss} <small>/ 00:{MAX_SECONDS}</small></div>}
      {error && <div className="cam-error" role="alert">{error}</div>}
      {!ready && !error && <div className="cam-wait">Opening camera…</div>}

      <div className="cam-hint">
        {tab === 'photo' ? 'Good light, product in the middle, hold steady.' : 'Slowly turn the product. 15–30 seconds is perfect.'}
      </div>

      <div className="cam-bottom">
        <div className="cam-side">{shots > 0 && tab === 'photo' && <span>{shots} taken</span>}</div>
        {tab === 'photo'
          ? <button type="button" className="cam-shutter" onClick={takePhoto} disabled={!ready} aria-label="Take photo" />
          : <button type="button" className={'cam-shutter rec' + (recording ? ' on' : '')} onClick={recording ? stopRec : startRec} disabled={!ready} aria-label={recording ? 'Stop recording' : 'Start recording'} />}
        <div className="cam-side right">{shots > 0 && tab === 'photo' && <button type="button" className="cam-done" onClick={onClose}>Done</button>}</div>
      </div>
    </div>
  );
}
