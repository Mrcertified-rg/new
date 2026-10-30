import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function ProductDetail({pid,go,onBack,sizeSel,setSizeSel,addToCart,liked,onToggleLike}){
 const p=PRODUCTS.find(x=>x.id===pid);
 if (!p) return null;
 const sel=sizeSel||p.sizes[0];
 return (
  <div className="screen">
   <div className="pd-media" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}} />
   <div className="pd-body">
    <div className="row" onClick={()=>go('sellerprofile',{pid:p.id})}>
     <div style={{fontWeight:600}}>{p.seller} <span className="badge">✓</span></div>
     <span className="product-view-profile">View profile ›</span>
    </div>
    <h2 style={{marginTop:10}}>{p.name}</h2>
    <div className="price" style={{fontSize:19,margin:'4px 0 8px'}}>{money(p.price)}</div>
    <p style={{color:'var(--sub)',fontSize:13.5,lineHeight:1.5}}>{p.desc}</p>
    <div className="trust-box">
     <div className="trust-title">✓ MR CERTIFIED STATUS</div>
     <div className="trust-grid">
      <div>Identity<span>✓ Verified</span></div>
      <div>Transactions<span>{p.orders} completed</span></div>
      <div>Delivery rate<span>{p.delivery}%</span></div>
      <div>Rating<span>⭐ {p.rating}/5</span></div>
      <div>Repeat buyers<span>{p.repeat}%</span></div>
      <div>Business records<span>✓ Maintained</span></div>
     </div>
    </div>
    <button className="btn ghost" style={{width:'100%',marginBottom:14}} onClick={()=>go('dm',{pid:p.id})}>✉️ Message seller about this product</button>
    <p style={{fontSize:13,color:'var(--sub)',marginBottom:6}}>Select size</p>
    <div className="sizes">
     {p.sizes.map(s=>(
      <span key={s} className={'size-chip '+(s===sel?'on':'')} onClick={()=>setSizeSel(s)}>{s}</span>
     ))}
    </div>
   </div>
    <div className="buybar">
     <button type="button" className={'market-like product-detail-like' + (liked ? ' on' : '')} onClick={onToggleLike} aria-pressed={liked} aria-label={liked ? 'Unlike product' : 'Like product'} title={liked ? 'Unlike' : 'Like'}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
     <span>{liked ? 'Liked' : 'Like'}</span>
    </button>
     <button className="btn green product-detail-cart" onClick={()=>addToCart(p.id,sel)}>🛒 Add to cart — {money(p.price)}</button>
    </div>
  </div>
 );
}
