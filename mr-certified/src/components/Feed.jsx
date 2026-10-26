import React, { useMemo, useState } from 'react';
import { PRODUCTS, money } from '../data.js';

const SEARCH_STOP_WORDS = new Set(['a', 'an', 'the', 'for', 'and', 'with', 'in', 'on', 'by']);

function normalize(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchTerms(query) {
  return normalize(query)
    .split(' ')
    .filter(term => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
}

function scoreProduct(product, terms, query) {
  if (!terms.length) return 0;

  const fields = {
    name: normalize(product.name),
    category: normalize(product.cat),
    seller: normalize(product.seller),
    description: normalize(product.desc),
    city: normalize(product.city),
  };

  const fullText = Object.values(fields).join(' ');
  let score = 0;

  terms.forEach(term => {
    if (fields.name === term) score += 100;
    else if (fields.name.startsWith(term)) score += 75;
    else if (fields.name.includes(term)) score += 55;
    else if (fields.category.includes(term)) score += 35;
    else if (fields.seller.includes(term)) score += 25;
    else if (fields.description.includes(term) || fields.city.includes(term)) score += 15;
    else if (fullText.includes(term)) score += 5;
  });

  const normalizedQuery = normalize(query);
  if (normalizedQuery && fields.name.includes(normalizedQuery)) score += 100;

  return score;
}

export default function Feed({ go, catFilter, setCatFilter, cartCount }) {
  const [query, setQuery] = useState('');
  const cats = ['For You', 'Shoes', 'Men', 'Women', 'Kids', 'Beauty', 'Accessories', 'Services'];
  const terms = useMemo(() => getSearchTerms(query), [query]);

  const list = useMemo(() => {
    return PRODUCTS
      .filter(product => catFilter === 'For You' || product.cat === catFilter)
      .map(product => ({ product, score: scoreProduct(product, terms, query) }))
      .filter(({ score }) => !terms.length || score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  }, [catFilter, query, terms]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];

    const normalizedQuery = normalize(query);
    return PRODUCTS
      .filter(product => normalize(product.name).includes(normalizedQuery) || normalize(product.cat).includes(normalizedQuery))
      .slice(0, 5);
  }, [query]);

  return (
    <React.Fragment>
      <div className="topbar"><h1>MR CERTIFIED</h1><span style={{ fontSize: '18px' }}>🔔</span></div>

      <div className="searchbar" style={{ position: 'relative' }}>
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <span aria-hidden="true">🔍</span>
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={'Search e.g. "black size 42 sneakers"'}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>
        )}
        {suggestions.length > 0 && (
          <div className="search-suggestions" role="listbox">
            {suggestions.map(product => (
              <button
                type="button"
                key={product.id}
                role="option"
                onClick={() => setQuery(product.name)}
              >
                <strong>{product.name}</strong>
                <span>{product.cat} · {money(product.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="cats">
        {cats.map(category => (
          <span key={category} className={category === catFilter ? 'on' : ''} onClick={() => setCatFilter(category)}>
            {category}
          </span>
        ))}
      </div>

      <div className="screen feed">
        {list.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try a shorter search such as “Nike”, “sneakers”, or “beauty”.</p>
          </div>
        ) : list.map(product => (
          <div className="post" key={product.id} onClick={() => go('product', { pid: product.id })}>
            <div className="vid" style={{ background: `linear-gradient(160deg,${product.g[0]},${product.g[1]})` }}></div>
            <div className="shade"></div>
            <div className="post-info">
              <div className="seller-row">{product.seller}<span className="badge">✓ CERTIFIED</span></div>
              <h3>{product.name}</h3>
              <div className="price">{money(product.price)}</div>
              <div className="meta-line">⭐ {product.rating} · {product.orders} completed orders</div>
            </div>
            <div className="side-actions" onClick={event => event.stopPropagation()}>
              <button><span className="ic">❤️</span>Like</button>
              <button><span className="ic">💬</span>Comment</button>
              <button><span className="ic">🔗</span>Share</button>
              <button onClick={() => go('dm', { pid: product.id })}><span className="ic">✉️</span>DM</button>
              <button onClick={() => go('product', { pid: product.id })}><span className="ic">🛒</span>Buy</button>
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
