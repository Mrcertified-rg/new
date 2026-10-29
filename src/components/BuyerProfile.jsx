import React, { useState } from 'react';
import { BUYER_STAT } from '../data.js';

export default function BuyerProfile({setMode}){
 const bad=BUYER_STAT.badRatings;
 const status=bad>=6?'Banned':bad>=5?'Warned':'Good standing';
 return (
  <React.Fragment>
   <div className="topbar"><h1>Profile</h1></div>
   <div className="screen pad">
    <div className="card"><b>Buyer account</b><p className="pill" style={{marginTop:4}}>Saved products · Following · Reviews · Payment history · Addresses</p></div>
    <div className="card">
     <div className="row"><b style={{fontSize:13.5}}>Your buyer rating</b><span style={{color:status==='Good standing'?'var(--green)':'var(--red)',fontSize:12.5}}>{status}</span></div>
     <div className="row" style={{marginTop:8}}>
      <span className="pill">⭐ {BUYER_STAT.rating}/5 from sellers</span>
      <span className="pill">{bad}/5 low ratings</span>
     </div>
     <p style={{color:'var(--sub)',fontSize:11.5,marginTop:8}}>Sellers rate buyers after each order. 5 low ratings gets a warning, 6 gets the account banned.</p>
    </div>
    <div className="card row"><span>Notifications</span><span className="pill">3 new ›</span></div>
    <div className="card row"><span>Saved products</span><span className="pill">12 ›</span></div>
    <button className="btn" style={{width:'100%',marginTop:6}} onClick={()=>setMode('seller')}>💼 Switch to seller / marketer mode</button>
   </div>
  </React.Fragment>
 );
}
