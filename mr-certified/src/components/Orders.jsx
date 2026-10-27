import React from 'react';
import { PRODUCTS, ORDER_STAGES } from '../data.js';

export default function Orders({orders}){
 return (
  <React.Fragment>
   <div className="topbar"><h1>Track orders</h1></div>
   <div className="screen pad">
    {!orders.length && <div className="card" style={{color:'var(--sub)',fontSize:13.5}}>No orders to track yet. Orders you place from your cart appear here.</div>}
    {orders.map(o=>{
     const p=PRODUCTS.find(x=>x.id===o.pid);
     return (
      <div className="card" key={o.id}>
       <div className="row"><div><b>{p.name}</b><div className="pill">{p.seller}</div></div>
        <span style={{color:o.stage>=4?'var(--green)':'var(--gold)',fontSize:12.5}}>{ORDER_STAGES[o.stage]}</span></div>
       <div className="otrack">
        {ORDER_STAGES.map((s,i)=>(
         <div className={'onode '+(i<o.stage?'done':i===o.stage?'now':'')} key={s}>
          <div className="od"></div><span>{s}</span>
         </div>
        ))}
       </div>
      </div>
     );
    })}
    <p style={{color:'var(--sub)',fontSize:13,marginTop:4}}>Payments are held by MR CERTIFIED until you confirm delivery.</p>
   </div>
  </React.Fragment>
 );
}
