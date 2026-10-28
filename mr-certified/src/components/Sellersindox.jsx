import React from 'react';
import { PRODUCTS } from '../data.js';

export default function SellerInbox({dms,go}){
 const ids=Object.keys(dms).filter(k=>dms[k].length);
 return (
  <React.Fragment>
   <div className="topbar"><h1>Product / seller chats</h1></div>
   <div className="screen pad">
    {!ids.length && <div className="card" style={{color:'var(--sub)',fontSize:13.5}}>No messages yet. When buyers tap DM on your posts, chats appear here.</div>}
    {ids.map(k=>{
     const p=PRODUCTS.find(x=>x.id===Number(k));
     const last=dms[k][dms[k].length-1];
     return (
      <div className="mq-chat-person-row" key={k} onClick={()=>go('dm',{pid:p.id})}>
       <div className="mq-chat-list-avatar product-avatar" style={{background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
       <div className="mq-chat-list-copy"><b>{p.seller}</b><span>{p.name} · {last.text.slice(0,40)}</span></div>
       <span className="mq-chat-type product">Product</span>
      </div>
     );
    })}
   </div>
  </React.Fragment>
 );
}