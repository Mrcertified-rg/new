import React from 'react';
import { PRODUCTS, money } from '../data.js';

export default function Cart({ cart, setQty, removeItem, toggleItem, toggleAll, go, openModal }) {
  // MC - selection-aware cart totals
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const selected = cart.filter((i) => i.checked);
  const selectedCount = selected.reduce((s, i) => s + i.qty, 0);
  const selectedTotal = selected.reduce((s, i) => s + PRODUCTS.find((x) => x.id === i.pid).price * i.qty, 0);
  const allChecked = cart.length > 0 && selected.length === cart.length;

  return (
    <React.Fragment>
      <div className="screen pad">
        {!cart.length && (
          <div className="card" style={{ textAlign: 'center', padding: 26 }}>
            <div style={{ fontSize: 30 }}>🛒</div>
            <p style={{ color: 'var(--sub)', fontSize: 13.5, marginTop: 6 }}>Your cart is empty. Add products from the feed.</p>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => go('feed')}>Browse products</button>
          </div>
        )}

        {cart.length > 0 && (
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="row" style={{ gap: 8, justifyContent: 'flex-start', cursor: 'pointer' }} onClick={() => toggleAll(!allChecked)}>
              <div className={'check ' + (allChecked ? 'on' : '')}>{allChecked ? '✓' : ''}</div>
              <span style={{ fontSize: 13 }}>Select all</span>
            </div>
            <span className="pill">{selected.length} of {cart.length} selected</span>
          </div>
        )}

        {cart.map((i, idx) => {
          const p = PRODUCTS.find((x) => x.id === i.pid);
          return (
            <div className="card" key={idx} style={{ opacity: i.checked ? 1 : 0.6 }}>
              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div className={'check ' + (i.checked ? 'on' : '')} onClick={() => toggleItem(idx)}>{i.checked ? '✓' : ''}</div>
                <div style={{ width: 52, height: 52, borderRadius: 10, flex: '0 0 auto', background: `linear-gradient(160deg,${p.g[0]},${p.g[1]})` }}></div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>{p.name}</b>
                  <div className="pill">{p.seller} · size {i.size}</div>
                  <div className="price" style={{ fontSize: 13.5, marginTop: 2 }}>{money(p.price * i.qty)}</div>
                </div>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <div className="qty big">
                  <button onClick={() => setQty(idx, -1)}>-</button><b>{i.qty}</b><button onClick={() => setQty(idx, 1)}>+</button>
                </div>
                <button className="rm" onClick={() => removeItem(idx)}>🗑 Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="buybar" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="stat-label" style={{ marginTop: 0 }}>{selectedCount} item(s) selected</div>
            <b className="price" style={{ fontSize: 17 }}>{money(selectedTotal)}</b>
          </div>
          <button
            className="btn green"
            style={{ flex: 1.4, opacity: selected.length ? 1 : 0.4 }}
            disabled={!selected.length}
            onClick={() => openModal('checkout')}
          >
            Place order{selected.length ? ' (' + selectedCount + ')' : ''}
          </button>
        </div>
      )}
    </React.Fragment>
  );
}
