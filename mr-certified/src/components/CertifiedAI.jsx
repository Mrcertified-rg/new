import React, { useState } from 'react';
import { DASH, AI_PRESETS, money } from '../data.js';

export default function CertifiedAI(){
 const [log,setLog]=useState([]);
 const [input,setInput]=useState('');
 const ask=text=>{
  if(!text)return;
  let reply=`Based on your records: revenue ${money(DASH.sales)}, expenses ${money(DASH.expenses)}, profit ${money(DASH.profit)}. Ask me about a specific product for more detail.`;
  const t=text.toLowerCase();
  for(const k in AI_PRESETS){ if(t.includes(k)){ reply=AI_PRESETS[k]; break; } }
  setLog([...log,{me:true,text},{me:false,text:reply}]);
  setInput('');
 };
 const shown=log.length?log:[{me:false,text:"Hi, I'm Certified AI — your business assistant. Ask me about your sales, stock, or marketing."}];
 return (
  <React.Fragment>
   <div className="topbar"><h1>✦ Certified AI</h1></div>
   <div className="screen pad">
    {shown.map((m,i)=><div className={'ai-msg '+(m.me?'me':'')} key={i}>{m.text}</div>)}
    {!log.length &&
     <div>
      <span className="ai-suggest" onClick={()=>ask('Which product made me the most profit this month?')}>Which product made the most profit?</span>
      <span className="ai-suggest" onClick={()=>ask('Why are my sales falling?')}>Why are my sales falling?</span>
      <span className="ai-suggest" onClick={()=>ask('Which product should I advertise?')}>What should I advertise?</span>
      <span className="ai-suggest" onClick={()=>ask('Teach me how to manage stock.')}>Help me manage stock</span>
      <span className="ai-suggest" onClick={()=>ask('How much do I need to sell to make KSh 50,000 profit?')}>Reach KSh 50,000 profit</span>
     </div>}
   </div>
   <div className="ai-input">
    <input value={input} placeholder="Ask Certified AI..." onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')ask(input);}} />
    <button className="btn" style={{padding:'10px 16px'}} onClick={()=>ask(input)}>Send</button>
   </div>
  </React.Fragment>
 );
}
