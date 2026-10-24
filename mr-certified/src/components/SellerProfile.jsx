import React, { useState } from 'react';
import { PRODUCTS, money, initials } from '../data.js';

export default function SellerProfile({pid,go,tab,setTab}){
 const p=PRODUCTS.find(x=>x.id===pid)||PRODUCTS[0];
 const items=PRODUCTS.filter(x=>x.seller===p.seller);
 return (
  <div className="screen">
   <div className="sp-head">
    <button className="back" style={{float:'left'}} onClick={()=>go('product',{pid:p.id})}>←</button>
    <div className="avatar" style={{background:'var(--gold)',marginTop:6}}>{initials(p.seller)}</div>
    <h2>{p.seller} <span className="badge">✓</span></h2>
    <p style={{color:'var(--sub)',fontSize:13,marginTop:2}}>MR CERTIFIED · {p.city}</p>
    <div className="row" style={{justifyContent:'center',gap:22,marginTop:14}}>
     <div><div className="stat-num" style={{fontSize:17}}>{p.rating}</div><div className="stat-label">Rating</div></div>
     <div><div className="stat-num" style={{fontSize:17}}>{p.orders}</div><div className="stat-label">Transactions</div></div>
     <div><div className="stat-num" style={{fontSize:17}}>{p.delivery}%</div><div className="stat-label">Delivery</div></div>
     <div><div className="stat-num" style={{fontSize:17}}>{p.repeat}%</div><div className="stat-label">Repeat</div></div>
    </div>
   </div>
   <div className="tabs">
    {['Products','Videos','Reviews','About'].map(t=>(
     <span key={t} className={t===tab?'on':''} onClick={()=>setTab(t)}>{t}</span>
    ))}
   </div>
   {tab==='Products' &&
    <div className="pgrid">
     {items.map(i=>(
      <div className="pcard" key={i.id} onClick={()=>go('product',{pid:i.id})}>
       <div className="ph" style={{background:`linear-gradient(160deg,${i.g[0]},${i.g[1]})`}}></div>
       <div className="pc-body"><b>{i.name}</b><span className="price">{money(i.price)}</span></div>
      </div>
     ))}
    </div>}
   {tab==='Reviews' &&
    <div className="pad" style={{paddingTop:14}}>
     <div className="card">"Fast delivery, exactly as shown." — Faith N.</div>
     <div className="card">"Second time buying, trust this seller." — Brian O.</div>
    </div>}
   {tab==='About' &&
    <div className="pad" style={{paddingTop:14}}>
     <div className="card">Certified since 2025. Identity verified, business records maintained, delivery performance tracked continuously by MR CERTIFIED.</div>
    </div>}
   {tab==='Videos' &&
    <div className="pad" style={{paddingTop:14,color:'var(--sub)',fontSize:13.5}}>Styling and demo videos appear here as the seller posts.</div>}
  </div>
 );
}
