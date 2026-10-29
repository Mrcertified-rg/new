import React, { useMemo, useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function SellerProducts({ openModal, go, sellerName = 'Urban Kicks Kenya' }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const mine = useMemo(() => PRODUCTS.filter((product) => (
    product.seller === sellerName
    && (category === 'All' || product.cat === category)
    && (!query || `${product.name} ${product.cat}`.toLowerCase().includes(query.toLowerCase()))
  )), [sellerName, category, query]);
  const categories = ['All', ...new Set(PRODUCTS.filter((product) => product.seller === sellerName).map((product) => product.cat))];

  return (
    <React.Fragment>
      <div className="topbar seller-page-topbar">
        <div><span className="seller-eyebrow">CATALOG</span><h1>Products</h1></div>
        <button type="button" className="seller-primary-btn" onClick={() => openModal('create')}>＋ Add product</button>
      </div>
      <div className="screen pad seller-page">
        <div className="seller-list-summary"><b>{mine.length} products</b><span>Published to your store</span></div>
        <label className="seller-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </label>
        {categories.length > 2 && (
          <div className="seller-filter-row" aria-label="Filter products by category">
            {categories.map((item) => (
              <button type="button" key={item} className={category === item ? 'on' : ''} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        )}
        {mine.length ? <div className="seller-product-list">
          {mine.map((product) => (
            <article className="seller-product-card" key={product.id}>
              <button type="button" className="seller-product-image" style={{ background: `linear-gradient(145deg,${product.g[0]},${product.g[1]})` }} onClick={() => go('product', { pid: product.id })} aria-label={`View ${product.name}`} />
              <div className="seller-product-info">
                <div className="seller-product-heading">
                  <div><b>{product.name}</b><span>{product.cat} · {product.colors.join(', ')}</span></div>
                  <span className="seller-published"><i /> Active</span>
                </div>
                <div className="seller-product-metrics">
                  <span><small>Price</small><b>{money(product.price)}</b></span>
                  <span><small>Orders</small><b>{product.orders}</b></span>
                  <span><small>Profit</small><b>{money(product.profit)}</b></span>
                </div>
                <button type="button" className="seller-product-view" onClick={() => go('product', { pid: product.id })}>View listing <span>›</span></button>
              </div>
            </article>
          ))}
        </div> : (
          <div className="seller-empty-state">
            <span>▧</span><h3>{query ? 'No matching products' : 'Your catalog is ready for its first product'}</h3>
            <p>{query ? 'Try another search or category.' : 'Add a listing to start building your store catalog.'}</p>
            {!query && <button type="button" className="seller-primary-btn" onClick={() => openModal('create')}>＋ Add product</button>}
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
