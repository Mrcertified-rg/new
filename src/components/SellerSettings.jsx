import React, { useState } from 'react';
import { THEMES } from '../data.js';

export default function SellerSettings({setMode,sellerAccount,go,storeTheme,setStoreTheme}){
 return (
  <React.Fragment>
   <div className="topbar"><h1>Profile</h1></div>
   <div className="screen pad">
    <div className="card" style={{textAlign:'center'}}>
     <div className="avatar" style={{background:storeTheme,margin:'0 auto 8px'}}>UK</div>
     <b>{sellerAccount?sellerAccount.name:'Urban Kicks Kenya'}</b>
     <div className="badge" style={{marginTop:6}}>✓ CERTIFIED</div>
    </div>
    <div className="card">
     <b style={{fontSize:13.5}}>Verification</b>
     <div className="verify-row">✓ National ID {sellerAccount?('· '+sellerAccount.id):'verified'}</div>
     <div className="verify-row">✓ KRA PIN {sellerAccount?('· '+sellerAccount.kra):'verified'}</div>
     <div className="verify-row">✓ Business records maintained</div>
    </div>
    <div className="card">
     <b style={{fontSize:13.5}}>Customize your store</b>
     <p className="pill" style={{margin:'4px 0 4px'}}>Pick an accent colour for your storefront, like a Shopify theme.</p>
     <div className="swatches">
      {THEMES.map(t=>(
       <div key={t.n} className={'swatch '+(storeTheme===t.c?'on':'')} style={{background:t.c}} title={t.n} onClick={()=>setStoreTheme(t.c)}></div>
      ))}
     </div>
    </div>
    <div className="card row" onClick={()=>go('records')}><span>Business records & balance sheet</span><span className="pill">Manage ›</span></div>
    <button className="btn ghost" style={{width:'100%'}} onClick={()=>setMode('buyer')}>🛍️ Switch to buyer mode</button>
   </div>
  </React.Fragment>
 );
}
