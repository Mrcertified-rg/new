import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function SellerProducts({openModal}){
 const mine=PRODUCTS.filter(p=>p.seller==='Urban Kicks Kenya');
 return (
  <React.Fragment>
   <div className="topbar"><h1>Products</h1><button className="btn" style={{padding:'8px 14px',fontSize:13}} onClick={()=>openModal('create')}>+ Create</button></div>
   <div className="screen pad">
    {mine.map(p=>(
     <div className="card row" key={p.id}>
      <div className="row" style={{gap:10}}>
       <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
       <div><b style={{fontSize:13.5}}>{p.name}</b><div className="pill">{money(p.price)} · profit {money(p.profit)}</div></div>
      </div>
      <span className="pill">Edit ›</span>
     </div>
    ))}
   </div>
  </React.Fragment>
 );
}
