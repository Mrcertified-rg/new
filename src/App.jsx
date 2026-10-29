import React, { useState } from 'react';
import { PRODUCTS, INIT_TX } from './data.js';
import Welcome from './components/Welcome.jsx';
import NavBar from './components/NavBar.jsx';
import Feed from './components/Feed.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import SellerProfile from './components/SellerProfile.jsx';
import Orders from './components/Orders.jsx';
import BuyerProfile from './components/BuyerProfile.jsx';
import Dashboard from './components/Dashboard.jsx';
import SellerProducts from './components/SellerProducts.jsx';
import Marketing from './components/Marketing.jsx';
import CertifiedAI from './components/CertifiedAI.jsx';
import SellerSettings from './components/SellerSettings.jsx';
import SellerCreate from './components/SellerCreate.jsx';
import Records from './components/Records.jsx';
import MarketerFeed from './components/MarketerFeed.jsx';
import MyPromotions from './components/MyPromotions.jsx';
import BuyModal from './components/BuyModal.jsx';
import CreateModal from './components/CreateModal.jsx';

export default function App(){
 const [mode,setModeRaw]=useState(null);
 const [screen,setScreen]=useState('welcome');
 const [pid,setPid]=useState(null);
 const [tab,setTab]=useState('Products');
 const [catFilter,setCatFilter]=useState('For You');
 const [sizeSel,setSizeSel]=useState(null);
 const [modal,setModal]=useState(null);
 const [sellerAccount,setSellerAccount]=useState(null);
 const [storeTheme,setStoreTheme]=useState('#E7B84E');
 const [transactions,setTransactions]=useState(INIT_TX);
 const [promotedTag,setPromotedTag]=useState(null);

 const go=(scr,extra)=>{
  setScreen(scr);
  if(extra && 'pid' in extra){ setPid(extra.pid); setSizeSel(null); }
 };
 const setMode=m=>{
  if((m==='seller'||m==='marketer') && !sellerAccount){ setScreen('sellercreate'); return; }
  setModeRaw(m);
  setScreen(m==='seller'?'dash':m==='marketer'?'mfeed':'feed');
 };
 const createAccount=acc=>{
  setSellerAccount(acc);
  setModeRaw(acc.role);
  setScreen(acc.role==='seller'?'dash':'mfeed');
 };
 const addTx=t=>setTransactions([t,...transactions]);
 const promote=productId=>{ setPromotedTag({productId,marketerName:sellerAccount?sellerAccount.name:'you'}); go('mypromos'); };
 const openModal=type=>setModal(type);
 const closeModal=()=>setModal(null);

 let body=null;
 if(screen==='welcome') body=<Welcome setMode={setMode}/>;
 else if(screen==='sellercreate') body=<SellerCreate onCreate={createAccount}/>;
 else if(screen==='feed') body=<React.Fragment><Feed go={go} catFilter={catFilter} setCatFilter={setCatFilter}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='mfeed') body=<React.Fragment><MarketerFeed go={go} promotedTag={promotedTag}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='mypromos') body=<React.Fragment><MyPromotions promotedTag={promotedTag} go={go}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='product') body=<ProductDetail pid={pid} go={go} sizeSel={sizeSel} setSizeSel={setSizeSel} openModal={openModal} mode={mode} promotedTag={promotedTag} onPromote={promote}/>;
 else if(screen==='sellerprofile') body=<React.Fragment><SellerProfile pid={pid} go={go} tab={tab} setTab={setTab}/><NavBar mode={mode} screen={'feed'} go={go}/></React.Fragment>;
 else if(screen==='orders') body=<React.Fragment><Orders/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='buyerprofile') body=<React.Fragment><BuyerProfile setMode={setMode}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='dash') body=<React.Fragment><Dashboard go={go} setMode={setMode}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='sellerproducts') body=<React.Fragment><SellerProducts openModal={openModal}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='records') body=<React.Fragment><Records transactions={transactions} addTx={addTx}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='marketing') body=<React.Fragment><Marketing/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='ai') body=<React.Fragment><CertifiedAI/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='sellerprofilepage') body=<React.Fragment><SellerSettings setMode={setMode} sellerAccount={sellerAccount} go={go} storeTheme={storeTheme} setStoreTheme={setStoreTheme}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;

 return (
  <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
   {body}
   {modal==='buy' && <BuyModal pid={pid} sizeSel={sizeSel||(PRODUCTS.find(p=>p.id===pid)||{}).sizes?.[0]} close={closeModal} go={go}/>}
   {modal==='create' && <CreateModal close={closeModal}/>}
  </div>
 );
}
