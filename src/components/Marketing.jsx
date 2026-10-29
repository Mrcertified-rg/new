import React, { useState } from 'react';

export default function Marketing(){
 return (
  <React.Fragment>
   <div className="topbar"><h1>Marketing</h1></div>
   <div className="screen pad">
    <div className="card">
     <b>Promote a product</b>
     <p className="pill" style={{margin:'6px 0 10px'}}>Budget: KSh 500 · Target: Nairobi, 18–30, all genders</p>
     <div className="row" style={{marginBottom:10}}><span className="pill">Estimated reach</span><b>2,400–3,900 people</b></div>
     <button className="btn green" style={{width:'100%'}}>Launch campaign</button>
    </div>
    <div className="card">
     <b style={{fontSize:13.5}}>Last campaign — Nike Air Force 1</b>
     <div className="grid2" style={{marginTop:10}}>
      <div><div className="stat-num" style={{fontSize:16}}>3,120</div><div className="stat-label">Reach</div></div>
      <div><div className="stat-num" style={{fontSize:16}}>890</div><div className="stat-label">Views</div></div>
      <div><div className="stat-num" style={{fontSize:16}}>64</div><div className="stat-label">Enquiries</div></div>
      <div><div className="stat-num" style={{fontSize:16}}>9</div><div className="stat-label">Orders</div></div>
     </div>
    </div>
    <div className="card"><b>Invite a seller</b><p className="pill" style={{margin:'6px 0 10px'}}>Know someone selling clothes or shoes?</p><button className="btn ghost" style={{width:'100%'}}>Send invite</button></div>
   </div>
  </React.Fragment>
 );
}
