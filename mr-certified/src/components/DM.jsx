import React, { useState } from 'react';
import { PRODUCTS, money } from '../data.js';

const messageTime = (time) => time
 ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 : '';

export default function Dm({pid,dms,send,go,viewer}){
 const p=PRODUCTS.find(x=>x.id===pid)||PRODUCTS[0];
 const [text,setText]=useState('');
 const msgs=dms[p.id]||[];
 const submit=()=>{ if(!text.trim())return; send(p.id,viewer,text.trim()); setText(''); };
 return (
  <div className="mq-chat-screen mq-product-chat">
   <div className="mq-chat-header">
    <button type="button" className="mq-chat-back" onClick={()=>go(viewer==='seller'?'inbox':'feed')} aria-label="Back">←</button>
    <div className="mq-chat-avatar" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
    <div className="mq-chat-head-copy">
     <b>{p.seller} <span className="badge">✓</span></b>
     <span>Product / seller chat</span>
    </div>
    <span className="mq-chat-type product">PRODUCT</span>
   </div>
   <div className="mq-chat-context" onClick={viewer==='buyer'?()=>go('product',{pid:p.id}):undefined}>
    <div className="mq-chat-thumb" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
    <div className="mq-chat-context-info"><b>{p.name}</b><span>{money(p.price)} · Linked product</span></div>
    <span className="mq-chat-context-action">{viewer==='buyer'?'View product ›':'Open listing'}</span>
   </div>
   <div className="mq-chat-messages">
    {!msgs.length && <div className="mq-chat-empty">Ask the seller about size, colour or delivery.</div>}
    {msgs.map((m,i)=><div className={'mq-chat-bubble '+(m.from===viewer?'sent':'received')} key={i}>{m.text}<span className="mq-chat-time">{messageTime(m.time)}</span></div>)}
   </div>
   <div className="mq-chat-compose">
    <input value={text} placeholder="Message seller..." onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();}}/>
    <button type="button" className="mq-chat-send" onClick={submit}>Send</button>
   </div>
  </div>
 );
}