// MC
import React, { useState } from 'react';
import { money } from '../data.js';
import { coverOf, mediaBg } from '../products/media.js';

export default function ProductPreview({ product, onView, compact = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = coverOf(product);
  const details = [
    product.colors?.length ? product.colors.join(', ') : '',
    product.sizes?.length ? `${product.sizes.length} sizes` : '',
    product.availability || product.stockStatus || '',
  ].filter(Boolean).join(' · ');

  return (
    <button type="button" className={`mq-product-preview${compact ? ' compact' : ''}`} onClick={onView}>
      <span className="mq-product-preview-image" style={{ background: mediaBg(product) }}>
        {image && !imageFailed
          ? <img src={image} alt="" onError={() => setImageFailed(true)} />
          : <span aria-hidden="true">{product.name.slice(0, 1)}</span>}
      </span>
      <span className="mq-product-preview-copy">
        <strong title={product.name}>{product.name}</strong>
        <b>{money(product.price)}</b>
        {details && <small>{details}</small>}
        <span className="mq-product-preview-action">View product <span aria-hidden="true">›</span></span>
      </span>
    </button>
  );
}
