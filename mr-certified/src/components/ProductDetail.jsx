import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function ProductDetail({pid,go,sizeSel,setSizeSel,openModal,mode,promotedTag,onPromote}){
 const p=PRODUCTS.find(x=>x.id===pid);
 const sel=sizeSel||p.sizes[0];
 const tagged=promotedTag&&promotedTag.productId===pid;
 return (
  <div className="screen">
   <div className="pd-media" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}>
    <button className="back" style={{position:'absolute',top:16,left:14,background:'rgba(0,0,0,.4)',borderRadius:'50%',padding:'6px 11px'}} onClick={()=>go(mode==='marketer'?'mfeed':'feed')}>←</button>
   </div>
   <div className="pd-body">
    <div className="row" onClick={()=>go('sellerprofile',{pid:p.id})}>
     <div style={{fontWeight:600}}>{p.seller} <span className="badge">✓</span></div>
     <span className="pill">View profile ›</span>
    </div>
    {tagged && <div className="tag-marketer">🔗 Marketed by @{promotedTag.marketerName}</div>}
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
    <p style={{fontSize:13,color:'var(--sub)',marginBottom:6}}>Select size</p>
    <div className="sizes">
     {p.sizes.map(s=>(
      <span key={s} className={'size-chip '+(s===sel?'on':'')} onClick={()=>setSizeSel(s)}>{s}</span>
     ))}
    </div>
   </div>
   {mode==='marketer' ? (
    <div className="buybar">
     <button className="btn green" style={{flex:1}} onClick={()=>onPromote(p.id)}>🔗 Promote this product</button>
    </div>
   ) : (
    <div className="buybar">
     <button className="btn ghost" style={{flex:1}} onClick={()=>go('feed')}>❤️ Save</button>
     <button className="btn green" style={{flex:2}} onClick={()=>openModal('buy')}>Buy — {money(p.price)}</button>
    </div>
   )}
  </div>
 );
}
