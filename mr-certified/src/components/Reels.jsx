import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTS, money } from '../data.js';
import { BagIcon, MessageIcon, StarIcon } from './ui/Icons.jsx';

export default function Reels({ go, addToCart, liked = [], onToggleLike, onComment, commentCount = () => 0, onShare, following = [], onFollow }) {
  const lastTap = useRef({});
  const burstTimer = useRef(null);
  const [burstProductId, setBurstProductId] = useState(null);
  const isLiked = (productId) => liked.includes(productId);
  const isFollowing = (seller) => following.includes(seller);
  const likeCount = (product) => product.orders * 4 + product.id * 13 + (isLiked(product.id) ? 1 : 0);
  const formatCount = (count) => (count >= 1000 ? (count / 1000).toFixed(1).replace('.0', '') + 'k' : String(count));
  const sellerInitials = (seller) => seller.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  useEffect(() => () => window.clearTimeout(burstTimer.current), []);

  const handleReelTap = (event, productId) => {
    if (event.target.closest('button, a')) return;
    const now = Date.now();
    if (now - (lastTap.current[productId] || 0) <= 300) {
      lastTap.current[productId] = 0;
      if (!isLiked(productId)) onToggleLike(productId);
      setBurstProductId(productId);
      window.clearTimeout(burstTimer.current);
      burstTimer.current = window.setTimeout(() => setBurstProductId(null), 750);
      return;
    }
    lastTap.current[productId] = now;
  };

  return (
    <main className="reels-screen" aria-label="Product reels">
      {PRODUCTS.map((product, index) => (
        <article className="reel-card" key={product.id} onClick={(event) => handleReelTap(event, product.id)}>
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
          {burstProductId === product.id && (
            <div className="reel-heart-burst" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
            </div>
          )}
          <div className="reel-actions" aria-label={`${product.name} actions`}>
            <div className="reel-seller-follow">
              <button
                type="button"
                className="reel-seller-profile"
                onClick={() => go('sellerprofile', { pid: product.id })}
                aria-label={`View ${product.seller}'s profile`}
                title={`View ${product.seller}'s profile`}
              >
                <span className="reel-seller-avatar" style={{ background: `linear-gradient(145deg, ${product.g[0]}, ${product.g[1]})` }}>
                  {sellerInitials(product.seller)}
                </span>
              </button>
              <button
                type="button"
                className={'reel-follow-badge' + (isFollowing(product.seller) ? ' on' : '')}
                onClick={() => onFollow?.(product.seller)}
                aria-pressed={isFollowing(product.seller)}
                aria-label={isFollowing(product.seller) ? `Unfollow ${product.seller}` : `Follow ${product.seller}`}
                title={isFollowing(product.seller) ? 'Following seller' : `Follow ${product.seller}`}
              >
                {isFollowing(product.seller) ? '✓' : '+'}
              </button>
            </div>
            <button
              type="button"
              className={'reel-action reel-like' + (isLiked(product.id) ? ' on' : '')}
              onClick={() => onToggleLike(product.id)}
              aria-pressed={isLiked(product.id)}
              aria-label={isLiked(product.id) ? 'Unlike product' : 'Like product'}
            >
              <span className="reel-like-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg></span>
              <span>{formatCount(likeCount(product))}</span>
            </button>
            <button type="button" className="reel-action" onClick={() => onComment(product.id)} aria-label="View comments">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
              <span>{formatCount(commentCount(product.id))}</span>
            </button>
            <button type="button" className="reel-action" onClick={() => onShare(product.id)} aria-label="Share product">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" /></svg>
              <span>Share</span>
            </button>
            <button type="button" className="reel-action" onClick={() => go('dm', { pid: product.id })} aria-label="Message seller">
              <MessageIcon size={22} />
              <span>DM</span>
            </button>
          </div>
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
