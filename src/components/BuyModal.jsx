import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function BuyModal({pid,sizeSel,close,go}){
 const [step,setStep]=useState(0);
 const p=PRODUCTS.find(x=>x.id===pid);
 const steps=[
  {label:'Payment held by MR CERTIFIED',done:step>=1},
  {label:'Seller preparing delivery',done:step>=2},
  {label:'Confirm receipt to release payment',done:step>=3},
 ];
 return (
  <div className="modal-wrap" onClick={e=>{if(e.target===e.currentTarget)close();}}>
   <div className="modal">
    <div className="row"><b>Order — {p.name} ({sizeSel})</b><span onClick={close}>✕</span></div>
    <p className="pill" style={{marginTop:4}}>{money(p.price)} · Mock payment, no real transaction</p>
    <div className="step-line">
     {steps.map((s,i)=>(
      <div className="step" key={i}>
       <div className={'dot '+(s.done?'done':'')}>{s.done?'✓':i+1}</div>
       <div><p>{s.label}</p></div>
      </div>
     ))}
    </div>
    {step===0 && <button className="btn green" style={{width:'100%'}} onClick={()=>setStep(1)}>Confirm & pay {money(p.price)}</button>}
    {step===1 && <button className="btn ghost" style={{width:'100%'}} onClick={()=>setStep(2)}>Simulate: seller ships</button>}
    {step===2 && <button className="btn" style={{width:'100%'}} onClick={()=>setStep(3)}>I received my order</button>}
    {step===3 && <React.Fragment>
      <p style={{textAlign:'center',color:'var(--green)',fontWeight:600,margin:'6px 0'}}>Payment released. Thanks — leave the seller a review!</p>
      <button className="btn" style={{width:'100%'}} onClick={()=>{close();go('feed');}}>Done</button>
     </React.Fragment>}
   </div>
  </div>
 );
}
