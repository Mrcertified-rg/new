// MC
/**
 * products/media.js
 * Small helpers so every screen can show a real product photo when there is one,
 * and fall back to the coloured placeholder when there is not.
 */
import './media.css';

/** First photo of a product, or '' when it has none. */
export const coverOf = (p) => (Array.isArray(p?.images) && p.images[0]) || p?.image || p?.image_url || '';

/** CSS "background" value: photo on top of the placeholder gradient. */
export const mediaBg = (p, angle = 160) => {
  const grad = `linear-gradient(${angle}deg,${p.g[0]},${p.g[1]})`;
  const cover = coverOf(p);
  return cover ? `center / cover no-repeat url("${cover}"), ${grad}` : grad;
};

/** Style for the big feed / reel cards (they use CSS variables). */
export const artStyle = (p) => {
  const cover = coverOf(p);
  return cover
    ? { '--art-a': p.g[0], '--art-b': p.g[1], backgroundImage: `url("${cover}")` }
    : { '--art-a': p.g[0], '--art-b': p.g[1] };
};

/** "-20%" for a product with a was-price, else ''. */
export const offLabel = (p) => (p?.oldPrice && p.oldPrice > p.price
  ? '-' + Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) + '%' : '');
