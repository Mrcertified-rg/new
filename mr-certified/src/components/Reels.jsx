import React from 'react';
import { PRODUCTS, money } from '../data.js';
import { BagIcon, StarIcon } from './ui/Icons.jsx';

export default function Reels({ go, addToCart }) {
  return (
    <main className="reels-screen" aria-label="Product reels">
      {PRODUCTS.map((product, index) => (
        <article className="reel-card" key={product.id}>
          <div
            className="reel-art"
            style={{ '--art-a': product.g[0], '--art-b': product.g[1] }}
            aria-hidden="true"
          >
            <span className="reel-edition">MERQO FINDS · {String(index + 1).padStart(2, '0')}</span>
            <span className="reel-orbit"></span>
            <span className="reel-category">{product.cat}</span>
          </div>
          <div className="reel-shade" aria-hidden="true" />
          <div className="reel-copy">
            <span className="reel-seller">{product.seller} · {product.city}</span>
            <h1>{product.name}</h1>
            <p><StarIcon size={14} /> {product.rating} · {product.orders} completed orders</p>
            <div className="reel-bottom">
              <strong>{money(product.price)}</strong>
              <button type="button" className="reel-view" onClick={() => go('product', { pid: product.id })}>
                View product
              </button>
              <button
                type="button"
                className="reel-add"
                onClick={() => addToCart(product.id, product.sizes[0])}
                aria-label={`Add ${product.name} to cart`}
              >
                <BagIcon size={17} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </main>
  );
}
