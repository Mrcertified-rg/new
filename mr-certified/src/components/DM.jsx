import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

export default function Dm({pid,dms,send,go,viewer}){
 const p=PRODUCTS.find(x=>x.id===pid)||PRODUCTS[0];
 const [text,setText]=useState('');
 const msgs=dms[p.id]||[];
 const submit=()=>{ if(!text.trim())return; send(p.id,viewer,text.trim()); setText(''); };
 return (
  <React.Fragment>
   <div className="topbar">
    <button className="back" onClick={()=>go(viewer==='seller'?'inbox':'feed')}>←</button>
    <b style={{fontSize:15}}>{p.seller} <span className="badge">✓</span></b>
    <span style={{width:20}}></span>
   </div>
   <div className="linked-post" onClick={viewer==='buyer'?()=>go('product',{pid:p.id}):undefined}>
    <div className="lp-thumb" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
    <div className="lp-info"><b>{p.name}</b><div className="price" style={{fontSize:13}}>{money(p.price)}</div></div>
    <span className="pill">{viewer==='buyer'?'View post ›':'Linked post'}</span>
   </div>
   <div className="screen pad" style={{paddingTop:12}}>
    {!msgs.length && <p style={{color:'var(--sub)',fontSize:13}}>Ask about size, colour or delivery. This chat stays linked to the post above.</p>}
    {msgs.map((m,i)=><div className={'ai-msg '+(m.from===viewer?'me':'')} key={i}>{m.text}</div>)}
   </div>
   <div className="ai-input">
    <input value={text} placeholder="Write a message..." onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();}}/>
    <button className="btn" style={{padding:'10px 16px'}} onClick={submit}>Send</button>
   </div>
  </React.Fragment>
 );
}