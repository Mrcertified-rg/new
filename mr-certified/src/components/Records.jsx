import React, { useState } from 'react';
import { money } from '../data.js';

export default function Records({transactions,addTx}){
 const [period,setPeriod]=useState('Monthly');
 const [type,setType]=useState('sale');
 const [channel,setChannel]=useState('online');
 const [amount,setAmount]=useState('');
 const [note,setNote]=useState('');
 const mult=period==='Yearly'?12:1;
 const sales=transactions.filter(t=>t.type==='sale').reduce((s,t)=>s+t.amount,0)*mult;
 const expenses=transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)*mult;
 const cash=sales-expenses;
 const inventory=18600*mult;
 const submit=()=>{
  const n=Number(amount);
  if(!n||!note)return;
  addTx({id:Date.now(),type,channel,amount:n,note,date:'Today'});
  setAmount('');setNote('');
 };
 return (
  <React.Fragment>
   <div className="topbar"><h1>Records</h1></div>
   <div className="screen pad">
    <div className="toggle-pill">
     {['Monthly','Yearly'].map(p=><span key={p} className={period===p?'on':''} onClick={()=>setPeriod(p)}>{p}</span>)}
    </div>
    <div className="card">
     <b style={{fontSize:13.5}}>Balance sheet — {period.toLowerCase()}</b>
     <div className="ledger-row"><span>Cash (sales − expenses)</span><b className={cash>=0?'pos':'neg'}>{money(cash)}</b></div>
     <div className="ledger-row"><span>Inventory value (est.)</span><b>{money(inventory)}</b></div>
     <div className="ledger-row"><span>Assets</span><b>{money(cash+inventory)}</b></div>
     <div className="ledger-row"><span>Liabilities (unpaid expenses, est.)</span><b className="neg">{money(Math.round(expenses*0.15))}</b></div>
     <div className="ledger-row"><span><b>Owner's equity</b></span><b>{money(cash+inventory-Math.round(expenses*0.15))}</b></div>
    </div>
    <div className="card">
     <b style={{fontSize:13.5}}>Add a transaction (online or offline)</b>
     <div className="field" style={{marginTop:10}}><label>Type</label>
      <select value={type} onChange={e=>setType(e.target.value)}><option value="sale">Sale</option><option value="expense">Expense</option></select>
     </div>
     <div className="field"><label>Channel</label>
      <select value={channel} onChange={e=>setChannel(e.target.value)}><option value="online">Online (MR CERTIFIED)</option><option value="offline">Offline / cash</option></select>
     </div>
     <div className="field"><label>Amount (KSh)</label><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></div>
     <div className="field"><label>Note</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="What was this for?"/></div>
     <button className="btn" style={{width:'100%'}} onClick={submit}>Record transaction</button>
    </div>
    <div className="card">
     <b style={{fontSize:13.5}}>Recent transactions</b>
     {transactions.slice(0,8).map(t=>(
      <div className="ledger-row" key={t.id}>
       <span>{t.note}<span className="pill" style={{marginLeft:6}}>{t.channel}</span></span>
       <b className={t.type==='sale'?'pos':'neg'}>{t.type==='sale'?'+':'-'}{money(t.amount)}</b>
      </div>
     ))}
    </div>
    <p style={{color:'var(--sub)',fontSize:12}}>Certified AI can read these records — try asking it "how much profit did I make?" on the AI tab.</p>
   </div>
  </React.Fragment>
 );
}
