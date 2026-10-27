import React from 'react';
import { PRODUCTS, ORDER_STAGES, money } from '../data.js';
import { ArrowLeftIcon } from './ui/Icons.jsx';

export default function MyOrders({orders,go}){
 return (
  <React.Fragment>
   <div className="topbar" style={{justifyContent:'flex-start',gap:12}}>
    <button type="button" className="icon-btn" onClick={()=>go('feed')} aria-label="Back"><ArrowLeftIcon size={19}/></button>
    <h1>My orders</h1>
   </div>
   <div className="screen pad">
    {!orders.length && <div className="card" style={{color:'var(--sub)',fontSize:13.5}}>You haven't ordered anything yet.</div>}
    {orders.map(o=>{
     const p=PRODUCTS.find(x=>x.id===o.pid);
     return (
      <div className="card" key={o.id}>
       <div className="row" style={{gap:12,alignItems:'flex-start'}}>
        <div onClick={()=>go('product',{pid:p.id})} style={{width:60,height:60,borderRadius:12,flex:'0 0 auto',background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
        <div style={{flex:1}}>
         <b style={{fontSize:14}}>{p.name}</b>
         <div className="pill">Ordered {o.date} · {ORDER_STAGES[o.stage]}</div>
        </div>
       </div>
       <div className="trust-grid" style={{marginTop:12}}>
        <div>Type<span>{p.cat}</span></div>
        <div>Sold by<span>{p.seller}</span></div>
        <div>Size<span>{o.size}</span></div>
        <div>Quantity<span>{o.qty}</span></div>
        <div>Price each<span>{money(p.price)}</span></div>
        <div>Total paid<span>{money(p.price*o.qty)}</span></div>
       </div>
       <button className="btn ghost" style={{width:'100%',marginTop:12}} onClick={()=>go('product',{pid:p.id})}>📷 View photo &amp; review again ›</button>
      </div>
     );
    })}
   </div>
  </React.Fragment>
 );
}
