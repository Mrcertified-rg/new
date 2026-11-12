import React, { useEffect } from 'react';
import { PRODUCTS, money, initials } from '../data.js';

const SELLER_BIO = {
  'Urban Kicks Kenya': 'Authentic sneakers, boxed and ready. Nairobi delivery same day, countrywide in 2-3 days. 👟',
  'Maré Streetwear': 'Coastal streetwear made for the heat. Heavyweight fits, limited drops every month. 🌴',
  'Amara Beauty': 'Handmade shea and skincare, small batches every week. Gentle on skin, kind to your budget. ✨',
  'Zuri Kids Closet': 'Tough, soft and stylish clothes for kids who never sit still. 🧒',
};

export default function SellerProfile({ pid, go, tab, setTab, following = [], onFollow }) {
  const product = PRODUCTS.find((item) => item.id === pid) || PRODUCTS[0];
  const items = PRODUCTS.filter((item) => item.seller === product.seller);
  const isFollowing = following.includes(product.seller);
  const followers = items.reduce((sum, item) => sum + item.orders, 0) * 6 + 120 + (isFollowing ? 1 : 0);
  const bio = SELLER_BIO[product.seller] || 'Certified seller on MR CERTIFIED.';

  // MC - reset seller tabs when opening a different profile
  useEffect(() => { setTab('Products'); }, [pid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen">
      <div className="sp-head">
        <div className="avatar" style={{ background: 'var(--gold)', marginTop: 6 }}>{initials(product.seller)}</div>
        <h2>{product.seller} <span className="badge">✓</span></h2>
        <p style={{ color: 'var(--sub)', fontSize: 13, marginTop: 2 }}>MR CERTIFIED · {product.city}</p>
        <p style={{ fontSize: 13.5, lineHeight: 1.45, margin: '10px auto 0', maxWidth: 300 }}>{bio}</p>

        <div className="row" style={{ justifyContent: 'center', gap: 20, marginTop: 14 }}>
          <div><div className="stat-num" style={{ fontSize: 17 }}>{followers}</div><div className="stat-label">Followers</div></div>
          <div><div className="stat-num" style={{ fontSize: 17 }}>{product.rating}</div><div className="stat-label">Rating</div></div>
          <div><div className="stat-num" style={{ fontSize: 17 }}>{product.orders}</div><div className="stat-label">Transactions</div></div>
          <div><div className="stat-num" style={{ fontSize: 17 }}>{product.delivery}%</div><div className="stat-label">Delivery</div></div>
        </div>

        <div className="sp-actions">
          <button type="button" className={'btn ' + (isFollowing ? 'ghost' : 'green')} onClick={() => onFollow && onFollow(product.seller)}>
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
          <button type="button" className="btn ghost" onClick={() => go('dm', { pid: product.id })}>✉️ Message</button>
        </div>
      </div>

      <div className="tabs">
        {['Products', 'Videos', 'Reviews', 'About'].map((currentTab) => (
          <span key={currentTab} className={currentTab === tab ? 'on' : ''} onClick={() => setTab(currentTab)}>
            {currentTab}{currentTab === 'Products' ? ' (' + items.length + ')' : ''}
          </span>
        ))}
      </div>

      {tab === 'Products' &&
        <div className="pgrid">
          {items.map((item) => (
            <div className="pcard" key={item.id} onClick={() => go('product', { pid: item.id })}>
              <div className="ph" style={{ background: `linear-gradient(160deg,${item.g[0]},${item.g[1]})` }}></div>
              <div className="pc-body"><b>{item.name}</b><span className="price">{money(item.price)}</span></div>
            </div>
          ))}
        </div>}
      {tab === 'Reviews' &&
        <div className="pad" style={{ paddingTop: 14 }}>
          <div className="card">"Fast delivery, exactly as shown." — Faith N.</div>
          <div className="card">"Second time buying, trust this seller." — Brian O.</div>
        </div>}
      {tab === 'About' &&
        <div className="pad" style={{ paddingTop: 14 }}>
          <div className="card">{bio}</div>
          <div className="card">Certified since 2025. Identity verified, business records maintained, delivery performance tracked continuously by MR CERTIFIED.</div>
        </div>}
      {tab === 'Videos' &&
        <div className="pad" style={{ paddingTop: 14, color: 'var(--sub)', fontSize: 13.5 }}>Styling and demo videos appear here as the seller posts.</div>}
    </div>
  );
}
