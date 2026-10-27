import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';
import BuyModal from './BuyModal.jsx';

export default function PlaceOrderModal({cart,close,go,onPlaced}){
 const [rows,setRows]=useState(cart.map(c=>({checked:true,qty:c.qty})));
 const [phase,setPhase]=useState('select');
 const chosen=rows.map((r,i)=>({...r,i,item:cart[i]})).filter(r=>r.checked);
 const total=chosen.reduce((s,r)=>s+PRODUCTS.find(x=>x.id===r.item.pid).price*r.qty,0);
 const count=chosen.reduce((s,r)=>s+r.qty,0);
 const toggle=i=>setRows(rows.map((r,k)=>k===i?{...r,checked:!r.checked}:r));
 const step=(i,d)=>setRows(rows.map((r,k)=>k===i?{...r,qty:Math.max(1,r.qty+d)}:r));
 if(phase==='pay') return <BuyModal pid={null} sizeSel={null} label={count+' item(s) from your cart'} amount={total} onDone={()=>onPlaced(chosen.map(r=>({i:r.i,qty:r.qty})))} close={close} go={go}/>;
 return (
  <div className="modal-wrap" onClick={e=>{if(e.target===e.currentTarget)close();}}>
   <div className="modal">
    <div className="row"><b>Place order</b><span onClick={close}>✕</span></div>
    <p className="pill" style={{marginTop:4}}>Tick the items you want to order now and set how many of each.</p>
    <div style={{margin:'8px 0 12px'}}>
     {cart.map((c,i)=>{
      const p=PRODUCTS.find(x=>x.id===c.pid); const r=rows[i];
      return (
       <div className={'sel-row '+(r.checked?'':'off')} key={i}>
        <div className={'check '+(r.checked?'on':'')} onClick={()=>toggle(i)}>{r.checked?'✓':''}</div>
        <div style={{width:40,height:40,borderRadius:9,flex:'0 0 auto',background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
        <div style={{flex:1}}><b style={{fontSize:13}}>{p.name}</b><div className="pill">size {c.size} · {money(p.price)} each</div></div>
        <div className="qty"><button onClick={()=>step(i,-1)}>-</button><b>{r.qty}</b><button onClick={()=>step(i,1)}>+</button></div>
       </div>
      );
     })}
    </div>
    <div className="row" style={{marginBottom:12}}><span className="pill">{count} item(s) selected</span><b className="price" style={{fontSize:16}}>{money(total)}</b></div>
    <button className="btn green" style={{width:'100%',opacity:count?1:.4}} onClick={()=>{if(count)setPhase('pay');}}>Continue to payment</button>
   </div>
  </div>
 );
}
