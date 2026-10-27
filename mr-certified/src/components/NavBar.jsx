import React, { useState } from 'react';

export default function NavBar({mode,screen,go}){
 const buyer=[['feed','🏠','Home'],['orders','🚚','Track orders'],['buyerprofile','👤','Profile']];
 const seller=[['dash','📊','Dashboard'],['sellerproducts','🏷️','Products'],['records','📒','Records'],['marketing','📢','Marketing'],['ai','✦','AI'],['sellerprofilepage','👤','Profile']];
 const marketer=[['mfeed','🧭','Discover'],['mypromos','🔗','Promotions'],['sellerprofilepage','👤','Profile']];
 const items=mode==='seller'?seller:(mode==='marketer'?marketer:buyer);
 return (
  <div className="navbar">
   {items.map(([scr,ic,label])=>(
    <button key={scr} className={screen===scr?'on':''} onClick={()=>go(scr)}>
     <span className="ic">{ic}</span>{label}
    </button>
   ))}
  </div>
 );
}
