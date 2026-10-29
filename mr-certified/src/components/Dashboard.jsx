import React from 'react';
import { DASH, PRODUCTS, money, ORDER_STAGES } from '../data.js';

export default function Dashboard({ go, threads, orders = [], openModal, sellerName = 'Urban Kicks Kenya' }) {
  const sellerProducts = PRODUCTS.filter((product) => product.seller === sellerName);
  const recentOrders = orders
    .filter((order) => sellerProducts.some((product) => product.id === order.pid))
    .slice(0, 3);
  const pendingOrders = orders.filter((order) => (
    sellerProducts.some((product) => product.id === order.pid) && order.stage < 2
  )).length;

  return (
    <React.Fragment>
      <div className="topbar seller-page-topbar">
        <div><span className="seller-eyebrow">STORE ADMIN</span><h1>Overview</h1></div>
        <span className="seller-certified"><span>✓</span> Certified</span>
      </div>
      <div className="screen pad seller-dashboard">
        <section className="seller-welcome">
          <div>
            <span className="seller-eyebrow">YOUR STORE AT A GLANCE</span>
            <h2>Good to see you</h2>
            <p>Here’s what’s happening with your store.</p>
          </div>
          <button type="button" className="seller-primary-btn" onClick={() => openModal('create')}>＋ Add product</button>
        </section>

        <section className="seller-stats-grid" aria-label="Store performance">
          <article className="seller-stat seller-stat-featured">
            <span className="seller-stat-label">Total sales</span>
            <strong>{money(DASH.sales)}</strong>
            <span className="seller-stat-note"><i /> This month</span>
          </article>
          <article className="seller-stat">
            <span className="seller-stat-label">Orders</span>
            <strong>{DASH.orders}</strong>
            <button type="button" className="seller-stat-link" onClick={() => go('sellerorders')}>
              {pendingOrders} need attention
            </button>
          </article>
          <article className="seller-stat">
            <span className="seller-stat-label">Products</span>
            <strong>{sellerProducts.length}</strong>
            <button type="button" className="seller-stat-link" onClick={() => go('sellerproducts')}>Manage catalog</button>
          </article>
          <article className="seller-stat">
            <span className="seller-stat-label">Customers</span>
            <strong>{DASH.customers}</strong>
            <button type="button" className="seller-stat-link" onClick={() => go('customers')}>View customers</button>
          </article>
        </section>

        <section className="seller-panel">
          <div className="seller-panel-heading">
            <div><span className="seller-eyebrow">PERFORMANCE</span><h3>Sales over time</h3></div>
            <span className="seller-period">Last 7 days</span>
          </div>
          <div className="seller-chart">
            {DASH.bars.map((bar, index) => (
              <div className="seller-chart-col" key={index}>
                <span className="seller-chart-bar" style={{ height: `${bar}%` }} />
                <small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</small>
              </div>
            ))}
          </div>
          <div className="seller-chart-footer"><span>Estimated profit</span><strong>{money(DASH.profit)}</strong><span>Expenses {money(DASH.expenses)}</span></div>
        </section>

        <section className="seller-panel">
          <div className="seller-panel-heading">
            <div><span className="seller-eyebrow">FULFILLMENT</span><h3>Recent orders</h3></div>
            <button type="button" className="seller-text-link" onClick={() => go('sellerorders')}>View all <span>›</span></button>
          </div>
          {recentOrders.length ? recentOrders.map((order) => {
            const product = PRODUCTS.find((item) => item.id === order.pid);
            return (
              <div className="seller-recent-order" key={order.id}>
                <span className="seller-order-thumb" style={{ background: `linear-gradient(145deg,${product.g[0]},${product.g[1]})` }} />
                <span className="seller-order-copy"><b>{product.name}</b><small>#{String(order.id).slice(-6)} · {order.date}</small></span>
                <span className={'seller-order-status' + (order.stage >= 2 ? ' fulfilled' : '')}>{ORDER_STAGES[order.stage]}</span>
              </div>
            );
          }) : <p className="seller-empty-note">New orders will show here when customers check out.</p>}
        </section>

        <section className="seller-shortcuts" aria-label="Store shortcuts">
          <button type="button" onClick={() => go('inbox')}><span>✉</span><b>Inbox</b><small>{threads} conversations</small><i>›</i></button>
          <button type="button" onClick={() => go('records')}><span>▤</span><b>Finances</b><small>Sales and expenses</small><i>›</i></button>
          <button type="button" onClick={() => go('ai')}><span>✦</span><b>Certified AI</b><small>Store insights</small><i>›</i></button>
        </section>
      </div>
    </React.Fragment>
  );
}
