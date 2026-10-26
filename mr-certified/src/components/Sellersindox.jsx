import React from 'react';
import { PRODUCTS } from '../data.js';

export default function SellerInbox({dms,go}){
 const ids=Object.keys(dms).filter(k=>dms[k].length);
 return (
  <React.Fragment>
   <div className="topbar"><h1>Messages</h1></div>
   <div className="screen pad">
    {!ids.length && <div className="card" style={{color:'var(--sub)',fontSize:13.5}}>No messages yet. When buyers tap DM on your posts, chats appear here.</div>}
    {ids.map(k=>{
     const p=PRODUCTS.find(x=>x.id===Number(k));
     const last=dms[k][dms[k].length-1];
     return (
      <div className="card row" key={k} onClick={()=>go('dm',{pid:p.id})}>
       <div className="row" style={{gap:10}}>
        <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(160deg,${p.g[0]},${p.g[1]})`}}></div>
        <div><b style={{fontSize:13.5}}>{p.name}</b><div className="pill">{last.text.slice(0,40)}</div></div>
       </div>
       <span className="pill">Open ›</span>
      </div>
     );
    })}
   </div>
  </React.Fragment>
 );
}