import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTS } from '../data.js';
import ProductPreview from './ProductPreview.jsx';

const messageTime = (time) => time
 ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 : '';
const dateLabel = (time) => {
 const date = new Date(time);
 const today = new Date();
 const yesterday = new Date(today);
 yesterday.setDate(today.getDate() - 1);
 if (date.toDateString() === today.toDateString()) return 'Today';
 if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
 return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Dm({pid,dms,send,go,onBack,viewer,user}){
 const p=PRODUCTS.find(x=>x.id===pid)||PRODUCTS[0];
 const [text,setText]=useState('');
 const [sending,setSending]=useState(false);
 const endRef=useRef(null);
 const msgs=dms[p.id]||[];
 const visibleMsgs=msgs;
 useEffect(()=>{ endRef.current?.scrollIntoView({block:'end'}); },[msgs.length]);
 const submit=()=>{
  const content=text.trim();
  if(!content||sending)return;
  setSending(true);
  send(p.id,viewer,content);
  setText('');
  setTimeout(()=>setSending(false),150);
 };
 return (
  <div className="mq-chat-screen mq-product-chat">
   <div className="mq-chat-header">
    <button type="button" className="mq-chat-back" onClick={onBack || (()=>go(viewer==='seller'?'inbox':'friends'))} aria-label="Go back" title="Go back">←</button>
    <div className="mq-chat-avatar" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
    <div className="mq-chat-head-copy">
     <b>{p.seller} <span className="badge">✓</span></b>
     <span>Product conversation</span>
    </div>
    <span className={'mq-chat-header-profile' + (user?.profilePicture ? ' has-photo' : '')} aria-label="Your profile picture">
      {user?.profilePicture ? <img src={user.profilePicture} alt="" /> : (user?.firstName?.[0] || user?.name?.[0] || 'U')}
    </span>
   </div>
   <ProductPreview product={p} onView={()=>go('product',{pid:p.id})} />
   <div className="mq-chat-messages">
    {!msgs.length && <div className="mq-chat-empty"><b>Start the conversation</b><span>Ask about size, colour, availability, or delivery.</span></div>}
    {visibleMsgs.map((m,i)=><React.Fragment key={i}>
      {(i===0||dateLabel(m.time)!==dateLabel(visibleMsgs[i-1].time))&&<div className="mq-chat-date">{dateLabel(m.time)}</div>}
      <div className={'mq-chat-bubble '+(m.from===viewer?'sent':'received')}>{m.text}<span className="mq-chat-time">{messageTime(m.time)}</span>{m.from===viewer&&<span className="mq-chat-status">✓</span>}</div>
    </React.Fragment>)}
    <div ref={endRef}/>
   </div>
   <div className="mq-chat-compose">
    <button type="button" className="mq-chat-emoji" onClick={()=>setText((value)=>value+'🙂')} aria-label="Add emoji">☺</button>
    <textarea value={text} placeholder="Write a message..." rows="1" onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();}}}/>
    <button type="button" className="mq-chat-send" onClick={submit} disabled={sending||!text.trim()}>{sending?'…':'Send'}</button>
   </div>
  </div>
 );
}