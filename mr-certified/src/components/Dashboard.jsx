import React, { useState } from 'react';
import { DASH, money } from '../data.js';

export default function Dashboard({go,setMode,threads}){
 return (
  <React.Fragment>
   <div className="topbar"><h1>Dashboard</h1><span className="badge">✓ CERTIFIED</span></div>
   <div className="screen pad">
    <div className="grid2">
     <div className="card"><div className="stat-num" style={{color:'var(--green)'}}>{money(DASH.sales)}</div><div className="stat-label">Monthly sales</div></div>
     <div className="card"><div className="stat-num">{money(DASH.profit)}</div><div className="stat-label">Est. profit</div></div>
     <div className="card"><div className="stat-num">{DASH.orders}</div><div className="stat-label">Orders</div></div>
     <div className="card"><div className="stat-num">{DASH.customers}</div><div className="stat-label">Customers</div></div>
    </div>
    <div className="card">
     <div className="row"><b style={{fontSize:13.5}}>Sales, last 7 days</b><span className="pill">Expenses {money(DASH.expenses)}</span></div>
     <div className="bars">{DASH.bars.map((b,i)=><div className="bar" key={i} style={{height:b+'%'}}></div>)}</div>
    </div>
    <div className="card" onClick={()=>go('ai')}>
    <div className="card" onClick={()=>go('inbox')}>
    <div className="row"><b>✉️ Messages</b><span className="pill">{threads} chats ›</span></div>
    <p style={{color:'var(--sub)',fontSize:13,marginTop:4}}>Buyers message you straight from your posts.</p>
    </div>
     <div className="row"><b>✦ Certified AI</b><span className="pill">Ask ›</span></div>
     <p style={{color:'var(--sub)',fontSize:13,marginTop:4}}>"Which product made me the most profit this month?"</p>
    </div>
    <button className="btn ghost" style={{width:'100%'}} onClick={()=>setMode('buyer')}>🛍️ Switch to buyer mode</button>
   </div>
  </React.Fragment>
 );
}
