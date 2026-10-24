import React, { useState } from 'react';

export default function CreateModal({close}){
 return (
  <div className="modal-wrap" onClick={e=>{if(e.target===e.currentTarget)close();}}>
   <div className="modal">
    <div className="row"><b>Create</b><span onClick={close}>✕</span></div>
    <div className="step-line" style={{marginTop:12}}>
     <div className="choice-card" style={{padding:14}}>📹 Product video</div>
     <div className="choice-card" style={{padding:14}}>📷 Product photo</div>
     <div className="choice-card" style={{padding:14}}>🏷️ Product listing</div>
     <div className="choice-card" style={{padding:14}}>📢 Promotion</div>
    </div>
    <p style={{color:'var(--sub)',fontSize:12}}>Posts appear in the MR CERTIFIED discovery feed once published.</p>
   </div>
  </div>
 );
}
