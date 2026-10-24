import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function MarketerFeed({go,promotedTag}){
 return (
  <React.Fragment>
   <div className="topbar"><h1>Discover to promote</h1></div>
   <div className="screen pad">
    <p style={{color:'var(--sub)',fontSize:13,marginBottom:10}}>Open a product and tap "Promote" — it stays on the original seller's page, credited to you.</p>
    {PRODUCTS.map(p=>(
     <div className="card row" key={p.id} onClick={()=>go('product',{pid:p.id})}>
      <div className="row" style={{gap:10}}>
       <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
       <div><b style={{fontSize:13.5}}>{p.name}</b><div className="pill">{p.seller} · {money(p.price)}</div></div>
      </div>
      <span className="pill">{promotedTag&&promotedTag.productId===p.id?'Promoted ✓':'Open ›'}</span>
     </div>
    ))}
   </div>
  </React.Fragment>
 );
}
