import React, { useState } from 'react';

export default function SellerCreate({onCreate}){
 const [role,setRole]=useState('seller');
 const [name,setName]=useState('');
 const [id,setId]=useState('');
 const [kra,setKra]=useState('');
 const [busy,setBusy]=useState(false);
 const submit=()=>{
  if(!name||!id||!kra)return;
  setBusy(true);
  setTimeout(()=>{ onCreate({role,name,id,kra}); },700);
 };
 return (
  <div className="screen pad" style={{paddingTop:20}}>
   <h2 style={{marginBottom:4}}>Create your {role==='marketer'?'marketer':'seller'} account</h2>
   <p style={{color:'var(--sub)',fontSize:13,marginBottom:14}}>Every account is verified before it goes live on MR CERTIFIED.</p>
   <div className="role-pick">
    <div className={'choice-card '+(role==='seller'?'on':'')} onClick={()=>setRole('seller')}><b>💼 Seller</b><p style={{fontSize:12,color:'var(--sub)',marginTop:4}}>I have products to sell.</p></div>
    <div className={'choice-card '+(role==='marketer'?'on':'')} onClick={()=>setRole('marketer')}><b>🔗 Marketer</b><p style={{fontSize:12,color:'var(--sub)',marginTop:4}}>I promote other sellers' products.</p></div>
   </div>
   <div className="field"><label>{role==='marketer'?'Marketer name':'Business name'}</label><input value={name} onChange={e=>setName(e.target.value)} placeholder={role==='marketer'?'e.g. Brian_K':'e.g. Urban Kicks Kenya'}/></div>
   <div className="field"><label>National ID number</label><input value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. 34567890"/></div>
   <div className="field"><label>KRA PIN</label><input value={kra} onChange={e=>setKra(e.target.value)} placeholder="e.g. A012345678B"/></div>
   <button className="btn green" style={{width:'100%'}} onClick={submit}>{busy?'Verifying…':'Submit for verification'}</button>
   <p style={{color:'var(--sub)',fontSize:11.5,marginTop:10}}>ID and KRA PIN are used only to verify identity and tax status — this is a prototype, no documents are actually checked.</p>
  </div>
 );
}
