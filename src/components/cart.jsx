import React from 'react';
import { PRODUCTS, money } from '../data.js';

export default function Cart({cart,setQty,removeItem,go,openModal}){
 const total=cart.reduce((s,i)=>s+PRODUCTS.find(x=>x.id===i.pid).price*i.qty,0);
 return (
  <React.Fragment>
   <div className="topbar"><h1>Cart</h1></div>
   <div className="screen pad">
    {!cart.length && <div className="card" style={{color:'var(--sub)',fontSize:13.5}}>Your cart is empty. Tap "Add to cart" on a product to save it here.</div>}
    {cart.map((i,idx)=>{
     const p=PRODUCTS.find(x=>x.id===i.pid);
     return (
      <div className="card" key={idx}>
       <div className="row" style={{gap:10,alignItems:'flex-start'}}>
        <div style={{width:48,height:48,borderRadius:10,flex:'0 0 auto',background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
        <div style={{flex:1}}>
         <b style={{fontSize:13.5}}>{p.name}</b>
         <div className="pill">{p.seller} · size {i.size}</div>
         <div className="price" style={{fontSize:13.5,marginTop:2}}>{money(p.price*i.qty)}</div>
        </div>
        <span className="pill" onClick={()=>removeItem(idx)}>Remove</span>
       </div>
       <div className="qty" style={{marginTop:10}}>
        <button onClick={()=>setQty(idx,-1)}>-</button><b>{i.qty}</b><button onClick={()=>setQty(idx,1)}>+</button>
       </div>
      </div>
     );
    })}
    {cart.length>0 && <React.Fragment>
     <div className="card row"><b>Total</b><b className="price" style={{fontSize:16}}>{money(total)}</b></div>
     <button className="btn green" style={{width:'100%'}} onClick={()=>openModal('checkout')}>Checkout - {money(total)}</button>
     <p style={{color:'var(--sub)',fontSize:12,marginTop:8}}>Payment is held by MR CERTIFIED until you confirm delivery (mock).</p>
    </React.Fragment>}
   </div>
  </React.Fragment>
 );
}