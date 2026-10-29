import React, { useState } from 'react';
import { normalizePhone, validateSellerDocuments } from '../auth/validators.js';
import SellerDocumentFields from './auth/SellerDocumentFields.jsx';

export default function SellerCreate({onCreate}){
 const [name,setName]=useState('');
 const [id,setId]=useState('');
 const [kra,setKra]=useState('');
 const [phone,setPhone]=useState('');
 const [phoneErr,setPhoneErr]=useState('');
 const [documents,setDocuments]=useState({});
 const [documentErrors,setDocumentErrors]=useState({});
 const [busy,setBusy]=useState(false);
 const submit=()=>{
  const nextDocumentErrors=validateSellerDocuments(documents);
  setDocumentErrors(nextDocumentErrors);
  if(Object.keys(nextDocumentErrors).some((key)=>nextDocumentErrors[key]))return;
  if(!name||!id||!kra||!phone)return;
  const normalized=normalizePhone(phone);
  if(!normalized){ setPhoneErr('Use a Kenyan number, e.g. 0712 345 678.'); return; }
  setPhoneErr('');
  setBusy(true);
  setTimeout(()=>{ onCreate({role:'seller',name,id,kra,phone:normalized}); },700);
 };
 return (
  <div className="screen pad" style={{paddingTop:20}}>
   <h2 style={{marginBottom:4}}>Create your seller account</h2>
   <p style={{color:'var(--sub)',fontSize:13,marginBottom:14}}>Every account is verified before it goes live on MR CERTIFIED.</p>
   <div className="field"><label>Business name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Urban Kicks Kenya"/></div>
   <div className="field"><label>National ID number</label><input value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. 34567890"/></div>
   <div className="field"><label>KRA PIN</label><input value={kra} onChange={e=>setKra(e.target.value)} placeholder="e.g. A012345678B"/></div>
   <div className="field"><label>Phone number</label><input value={phone} onChange={e=>{setPhone(e.target.value);setPhoneErr('');}} placeholder="e.g. 0712 345 678" inputMode="tel" autoComplete="tel"/>{phoneErr&&<p className="af-error" style={{marginTop:5}}>{phoneErr}</p>}</div>
   <SellerDocumentFields
    value={documents}
    errors={documentErrors}
    onChange={(key,file)=>{setDocuments((current)=>({...current,[key]:file}));setDocumentErrors((current)=>({...current,[key]:''}));}}
   />
   <button className="btn green" style={{width:'100%'}} onClick={submit}>{busy?'Verifying…':'Submit for verification'}</button>
   <p style={{color:'var(--sub)',fontSize:11.5,marginTop:10}}>Your ID number and KRA PIN are collected for seller verification.</p>
  </div>
 );
}
