import React, { useState } from 'react';
import { PRODUCTS } from '../data.js';

export default function MyPromotions({promotedTag,go}){
 const p=promotedTag&&PRODUCTS.find(x=>x.id===promotedTag.productId);
 return (
  <React.Fragment>
   <div className="topbar"><h1>My promotions</h1></div>
   <div className="screen pad">
    {!p && <div className="card">You haven't promoted anything yet. Go to Discover and tap "Promote this product".</div>}
    {p && <div className="card" onClick={()=>go('product',{pid:p.id})}>
     <div className="row"><b>{p.name}</b><span className="pill">Live ›</span></div>
     <p className="pill" style={{marginTop:4}}>On {p.seller}'s page, tagged "Marketed by @{promotedTag.marketerName}"</p>
     <div className="grid2" style={{marginTop:10}}>
      <div><div className="stat-num" style={{fontSize:16}}>412</div><div className="stat-label">Clicks</div></div>
      <div><div className="stat-num" style={{fontSize:16}}>7</div><div className="stat-label">Orders credited</div></div>
     </div>
    </div>}
   </div>
  </React.Fragment>
 );
}
