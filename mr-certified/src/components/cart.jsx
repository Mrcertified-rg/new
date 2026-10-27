import React from 'react';
import { PRODUCTS, money } from '../data.js';

export default function Cart({cart,setQty,removeItem,go,openModal}){
 const total=cart.reduce((s,i)=>s+PRODUCTS.find(x=>x.id===i.pid).price*i.qty,0);
 const count=cart.reduce((s,i)=>s+i.qty,0);
 return (
  <React.Fragment>
   <div className="topbar"><h1>Cart{count>0?' ('+count+')':''}</h1></div>
   <div className="screen pad">
    {!cart.length && <div className="card" style={{textAlign:'center',padding:26}}>
     <div style={{fontSize:30}}>🛒</div>
     <p style={{color:'var(--sub)',fontSize:13.5,marginTop:6}}>Your cart is empty. Add products from the feed.</p>
     <button className="btn" style={{marginTop:14}} onClick={()=>go('feed')}>Browse products</button>
    </div>}
    {cart.map((i,idx)=>{
     const p=PRODUCTS.find(x=>x.id===i.pid);
     return (
      <div className="card" key={idx}>
       <div className="row" style={{gap:10,alignItems:'flex-start'}}>
        <div style={{width:52,height:52,borderRadius:10,flex:'0 0 auto',background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
        <div style={{flex:1}}>
         <b style={{fontSize:13.5}}>{p.name}</b>
         <div className="pill">{p.seller} · size {i.size}</div>
         <div className="price" style={{fontSize:13.5,marginTop:2}}>{money(p.price*i.qty)}</div>
        </div>
       </div>
       <div className="row" style={{marginTop:12}}>
        <div className="qty big">
         <button onClick={()=>setQty(idx,-1)}>-</button><b>{i.qty}</b><button onClick={()=>setQty(idx,1)}>+</button>
        </div>
        <button className="rm" onClick={()=>removeItem(idx)}>🗑 Remove</button>
       </div>
      </div>
     );
    })}
   </div>
   {cart.length>0 && <div className="buybar" style={{alignItems:'center'}}>
    <div style={{flex:1}}><div className="stat-label" style={{marginTop:0}}>Cart total</div><b className="price" style={{fontSize:17}}>{money(total)}</b></div>
    <button className="btn green" style={{flex:1.4}} onClick={()=>openModal('checkout')}>Place order</button>
   </div>}
  </React.Fragment>
 );
}
