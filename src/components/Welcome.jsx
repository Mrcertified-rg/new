import React, { useState } from 'react';

export default function Welcome({setMode}){
 return (
  <div className="onboard">
   <div>
    <div className="brand">MR <span>CERTIFIED</span></div>
    <p className="tag">Turn products and skills into a trusted business — discover, buy, sell, grow.</p>
   </div>
   <div className="choice">
    <button className="choice-card" onClick={()=>setMode('buyer')}>
     <div className="ico">🛍️</div><h3>I'm a buyer</h3>
     <p>Discover products from trusted, certified businesses.</p>
    </button>
    <button className="choice-card" onClick={()=>setMode('seller')}>
     <div className="ico">💼</div><h3>I'm a seller</h3>
     <p>Turn your products into a certified, trusted business.</p>
    </button>
   </div>
   <p style={{color:'var(--sub)',fontSize:'12px',textAlign:'center'}}>You can switch modes anytime from your profile.</p>
  </div>
 );
}
