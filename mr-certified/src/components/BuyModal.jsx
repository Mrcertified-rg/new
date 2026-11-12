// MC
import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function BuyModal({ pid, sizeSel, close, go, label, amount, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const product = PRODUCTS.find((item) => item.id === pid);
  const title = label || (product ? `${product.name} (${sizeSel})` : 'Order');
  const total = amount != null ? amount : (product?.price || 0);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (onDone) await onDone();
      close();
      go(onDone ? 'orders' : 'feed');
    } catch (err) {
      setError(err.message || 'Could not place your order.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-wrap" onClick={(event) => { if (event.target === event.currentTarget && !busy) close(); }}>
      <div className="modal">
        <div className="row"><b>Place order — {title}</b><button type="button" onClick={close} disabled={busy} aria-label="Close">×</button></div>
        <p className="pill" style={{ marginTop: 4 }}>{money(total)} · Payment is not processed in this demo.</p>
        <p className="pill">The seller will see the order after you confirm. Prices and available stock are checked by the server.</p>
        {error && <p role="alert" style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        <button className="btn green" style={{ width: '100%' }} onClick={submit} disabled={busy || !onDone}>
          {busy ? 'Saving order…' : 'Confirm order'}
        </button>
      </div>
    </div>
  );
}
