import React, { useMemo, useState } from 'react';
import { ORDER_STAGES, PRODUCTS, money } from '../data.js';

const TABS = ['All', 'Needs packing', 'In progress', 'Complete'];

export default function SellerOrders({ orders = [], onAdvanceOrder, sellerName = 'Urban Kicks Kenya' }) {
  const [filter, setFilter] = useState('All');
  const sellerOrders = useMemo(() => orders
    .map((order) => ({ ...order, product: PRODUCTS.find((product) => product.id === order.pid) }))
    .filter((order) => order.product?.seller === sellerName)
    .filter((order) => {
      if (filter === 'Needs packing') return order.stage === 0;
      if (filter === 'In progress') return order.stage > 0 && order.stage < 4;
      if (filter === 'Complete') return order.stage >= 4;
      return true;
    }), [orders, filter]);
  const needingFulfillment = orders.filter((order) => (
    PRODUCTS.find((product) => product.id === order.pid)?.seller === sellerName && order.stage < 2
  )).length;

  return (
    <React.Fragment>
      <div className="topbar seller-page-topbar">
        <div><span className="seller-eyebrow">FULFILLMENT</span><h1>Orders</h1></div>
        <span className="seller-certified">{needingFulfillment} to fulfill</span>
      </div>
      <div className="screen pad seller-page">
        <div className="seller-order-summary">
          <div><span>Needs packing</span><b>{orders.filter((order) => PRODUCTS.find((product) => product.id === order.pid)?.seller === sellerName && order.stage === 0).length}</b></div>
          <div><span>In progress</span><b>{orders.filter((order) => PRODUCTS.find((product) => product.id === order.pid)?.seller === sellerName && order.stage > 0 && order.stage < 4).length}</b></div>
          <div><span>Completed</span><b>{orders.filter((order) => PRODUCTS.find((product) => product.id === order.pid)?.seller === sellerName && order.stage >= 4).length}</b></div>
        </div>
        <div className="seller-filter-row seller-order-tabs" role="tablist" aria-label="Filter orders">
          {TABS.map((tab) => (
            <button type="button" role="tab" aria-selected={filter === tab} className={filter === tab ? 'on' : ''} key={tab} onClick={() => setFilter(tab)}>{tab}</button>
          ))}
        </div>
        {sellerOrders.length ? <div className="seller-order-list">
          {sellerOrders.map((order) => (
            <article className="seller-order-card" key={order.id}>
              <div className="seller-order-card-head">
                <div><b>#{String(order.id).slice(-6)}</b><span>{order.date}</span></div>
                <span className={'seller-order-status' + (order.stage >= 2 ? ' fulfilled' : '')}>{ORDER_STAGES[order.stage]}</span>
              </div>
              <div className="seller-order-item">
                <span className="seller-order-thumb" style={{ background: `linear-gradient(145deg,${order.product.g[0]},${order.product.g[1]})` }} />
                <span className="seller-order-copy"><b>{order.product.name}</b><small>Size {order.size} · Qty {order.qty}</small></span>
                <strong>{money(order.product.price * order.qty)}</strong>
              </div>
              <div className="seller-order-card-foot">
                <span>{order.customer?.name || 'Marketplace customer'}</span>
                {order.stage === 0 && <button type="button" onClick={() => onAdvanceOrder(order.id, 1)}>Mark packed <span>›</span></button>}
                {order.stage === 1 && <button type="button" onClick={() => onAdvanceOrder(order.id, 2)}>Mark shipped <span>›</span></button>}
              </div>
            </article>
          ))}
        </div> : (
          <div className="seller-empty-state">
            <span>▤</span><h3>{filter === 'All' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}</h3>
            <p>Orders for your products will appear here as soon as customers check out.</p>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
