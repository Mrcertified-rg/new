import React, { useState } from 'react';
import { ORDER_STAGES, ORDERS } from '../data.js';

export default function Orders(){
 return (
  <React.Fragment>
   <div className="topbar"><h1>Orders</h1></div>
   <div className="screen pad">
    {ORDERS.map(o=>(
     <div className="card" key={o.id}>
      <div className="row"><div><b>{o.name}</b><div className="pill">{o.seller}</div></div>
       <span style={{color:o.stage>=4?'var(--green)':'var(--gold)',fontSize:12.5}}>{ORDER_STAGES[o.stage]}</span></div>
      <div className="otrack">
       {ORDER_STAGES.map((s,i)=>(
        <div className={'onode '+(i<o.stage?'done':i===o.stage?'now':'')} key={s}>
         <div className="od"></div><span>{s}</span>
        </div>
       ))}
      </div>
     </div>
    ))}
    <p style={{color:'var(--sub)',fontSize:13,marginTop:4}}>Payments are held by MR CERTIFIED until you confirm delivery.</p>
   </div>
  </React.Fragment>
 );
}
