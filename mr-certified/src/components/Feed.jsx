import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function Feed({go,catFilter,setCatFilter,cartCount}){
 const cats=['For You','Shoes','Men','Women','Kids','Beauty','Accessories','Services'];
 const list=PRODUCTS.filter(p=>catFilter==='For You'||p.cat===catFilter);
 return (
  <React.Fragment>
   <div className="topbar"><h1>MR CERTIFIED</h1><span style={{fontSize:'18px'}}>🔔</span></div>
   <div className="searchbar">🔍 Search e.g. "black size 42 sneakers"</div>
   <div className="cats">
    {cats.map(c=>(
     <span key={c} className={c===catFilter?'on':''} onClick={()=>setCatFilter(c)}>{c}</span>
    ))}
   </div>
   <div className="screen feed">
    {list.map(p=>(
     <div className="post" key={p.id} onClick={()=>go('product',{pid:p.id})}>
      <div className="vid" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
      <div className="shade"></div>
      <div className="post-info">
       <div className="seller-row">{p.seller}<span className="badge">✓ CERTIFIED</span></div>
       <h3>{p.name}</h3>
       <div className="price">{money(p.price)}</div>
       <div className="meta-line">⭐ {p.rating} · {p.orders} completed orders</div>
      </div>
      <div className="side-actions" onClick={e=>e.stopPropagation()}>
       <button><span className="ic">❤️</span>Like</button>
       <button><span className="ic">💬</span>Comment</button>
       <button><span className="ic">🔗</span>Share</button>
       <button><span className="ic">🔗</span>Share</button>
        <button onClick={()=>go('dm',{pid:p.id})}><span className="ic">✉️</span>DM</button>
       <button onClick={()=>go('product',{pid:p.id})}><span className="ic">🛒</span>Buy</button>
      </div>
     </div>
    ))}
   </div>
  </React.Fragment>
 );
}
