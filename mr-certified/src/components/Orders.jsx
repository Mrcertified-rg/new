import React, { useState } from 'react';
import { PRODUCTS, ORDER_STAGES, money } from '../data.js';
import { ArrowLeftIcon } from './ui/Icons.jsx';

const STAGE_NOTE = [
  'We received your order and your payment is held safely.',
  'The seller has packed your item.',
  'Your parcel has left the seller and is on its way.',
  'The rider is close - keep your phone nearby.',
  'Delivered. Confirm receipt to release payment to the seller.',
];

const orderNo = (o) => 'MC-' + String(o.id).slice(-6).padStart(4, '0');

export default function Orders({ orders = [], go }) {
  // MC - order tracking and detail views
  const [view, setView] = useState(null);
  const order = view ? orders.find((o) => o.id === view.id) : null;
  const product = order ? PRODUCTS.find((x) => x.id === order.pid) : null;

  if (order && product && view.type === 'track') {
    return (
      <React.Fragment>
        <div className="topbar" style={{ justifyContent: 'flex-start', gap: 12 }}>
          <button type="button" className="icon-btn" onClick={() => setView(null)} aria-label="Back to my orders"><ArrowLeftIcon size={19} /></button>
          <h1>Track order</h1>
        </div>
        <div className="screen pad">
          <div className="card">
            <div className="row" style={{ gap: 12, justifyContent: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, flex: '0 0 auto', background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{product.name}</b>
                <div className="pill">{orderNo(order)} · Qty {order.qty}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: order.stage >= 4 ? 'var(--green)' : 'var(--gold)' }}>
              Status: <b>{ORDER_STAGES[order.stage]}</b>
            </div>
          </div>

          <div className="card">
            {ORDER_STAGES.map((s, i) => (
              <div className={'vstep ' + (i < order.stage ? 'done' : i === order.stage ? 'now' : '')} key={s}>
                <div className="vdot">{i < order.stage ? '✓' : ''}</div>
                <div>
                  <b style={{ fontSize: 13.5 }}>{s}</b>
                  <p style={{ fontSize: 12.5, color: 'var(--sub)', marginTop: 2 }}>{STAGE_NOTE[i]}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="btn ghost" style={{ width: '100%' }} onClick={() => setView({ type: 'details', id: order.id })}>View order details ›</button>
        </div>
      </React.Fragment>
    );
  }

  if (order && product && view.type === 'details') {
    const total = product.price * order.qty;
    return (
      <React.Fragment>
        <div className="topbar" style={{ justifyContent: 'flex-start', gap: 12 }}>
          <button type="button" className="icon-btn" onClick={() => setView(null)} aria-label="Back to my orders"><ArrowLeftIcon size={19} /></button>
          <h1>Order details</h1>
        </div>
        <div className="screen pad">
          <div className="card">
            <div className="row" style={{ gap: 12, alignItems: 'flex-start', justifyContent: 'flex-start' }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, flex: '0 0 auto', background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{product.name}</b>
                <div className="pill">{product.seller} · {product.city}</div>
                <div className="pill">{product.cat}</div>
              </div>
            </div>
            <div className="trust-grid" style={{ marginTop: 12 }}>
              <div>Order number<span>{orderNo(order)}</span></div>
              <div>Order date<span>{order.date}</span></div>
              <div>Status<span>{ORDER_STAGES[order.stage]}</span></div>
              <div>Size<span>{order.size}</span></div>
              <div>Quantity<span>{order.qty}</span></div>
              <div>Price each<span>{money(product.price)}</span></div>
            </div>
          </div>

          <div className="card">
            <div className="row"><span style={{ fontSize: 13 }}>Items ({order.qty})</span><span style={{ fontSize: 13 }}>{money(total)}</span></div>
            <div className="row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
              <b>Total</b><b className="price" style={{ fontSize: 16 }}>{money(total)}</b>
            </div>
            <p className="pill" style={{ marginTop: 10 }}>
              {order.stage >= 4 ? 'Payment released to the seller.' : 'Payment is held by MR CERTIFIED until you confirm delivery.'}
            </p>
          </div>

          <button className="btn green" style={{ width: '100%', marginBottom: 10 }} onClick={() => setView({ type: 'track', id: order.id })}>📍 Track this order</button>
          {go && <button className="btn ghost" style={{ width: '100%' }} onClick={() => go('product', { pid: product.id })}>View product ›</button>}
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="topbar"><h1>My orders</h1></div>
      <div className="screen pad">
        {!orders.length && <div className="card" style={{ color: 'var(--sub)', fontSize: 13.5 }}>No orders yet. Orders you place from your cart appear here.</div>}
        {orders.map((o) => {
          const p = PRODUCTS.find((x) => x.id === o.pid);
          return (
            <div className="card" key={o.id}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flex: '0 0 auto', background: `linear-gradient(160deg,${p.g[0]},${p.g[1]})` }}></div>
                  <div><b style={{ fontSize: 13.5 }}>{p.name}</b><div className="pill">{p.seller} · Qty {o.qty} · {o.date}</div></div>
                </div>
                <span style={{ color: o.stage >= 4 ? 'var(--green)' : 'var(--gold)', fontSize: 12.5, textAlign: 'right' }}>{ORDER_STAGES[o.stage]}</span>
              </div>
              <div className="row" style={{ gap: 10, marginTop: 12 }}>
                <button className="btn green" style={{ flex: 1, padding: 10, fontSize: 13 }} onClick={() => setView({ type: 'track', id: o.id })}>📍 Track order</button>
                <button className="btn ghost" style={{ flex: 1, padding: 10, fontSize: 13 }} onClick={() => setView({ type: 'details', id: o.id })}>Order details</button>
              </div>
            </div>
          );
        })}
        <p style={{ color: 'var(--sub)', fontSize: 13, marginTop: 4 }}>Payments are held by MR CERTIFIED until you confirm delivery.</p>
      </div>
    </React.Fragment>
  );
}
