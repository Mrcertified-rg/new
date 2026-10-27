import React, { useState } from 'react';
import { PRODUCTS, INIT_TX, ORDERS } from './data.js';
import NavBar from './components/NavBar.jsx';
import Feed from './components/Feed.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import SellerProfile from './components/SellerProfile.jsx';
import Orders from './components/Orders.jsx';
import MyOrders from './components/MyOrders.jsx';
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
import Cart from './components/cart.jsx';
import PlaceOrderModal from './components/PlaceOrderModal.jsx';
import Dm from './components/DM.jsx';
import SellerInbox from './components/Sellersindox.jsx';
import { ArrowLeftIcon } from './components/Icons.jsx';

export default function App(){
 const [mode,setModeRaw]=useState('buyer');
 const [screen,setScreen]=useState('feed');
 const [pid,setPid]=useState(null);
 const [tab,setTab]=useState('Products');
 const [catFilter,setCatFilter]=useState('For You');
 const [sizeSel,setSizeSel]=useState(null);
 const [modal,setModal]=useState(null);
 const [sellerAccount,setSellerAccount]=useState(null);
 const [storeTheme,setStoreTheme]=useState('#E7B84E');
 const [transactions,setTransactions]=useState(INIT_TX);
 const [orders,setOrders]=useState(ORDERS);
 const [promotedTag,setPromotedTag]=useState(null);
 const [cart,setCart]=useState([]);
 const [dms,setDms]=useState({});
 const [toast,setToast]=useState(null);

 const go=(scr,extra)=>{
  if(scr==='welcome'||scr==='register'){ setModeRaw('buyer'); setScreen('feed'); return; }
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
 const showToast=m=>{ setToast(m); setTimeout(()=>setToast(null),1500); };
 const addToCart=(productId,size)=>{
 const i=cart.findIndex(c=>c.pid===productId&&c.size===size);
 if(i>=0) setCart(cart.map((c,k)=>k===i?{...c,qty:c.qty+1}:c));
 else setCart([...cart,{pid:productId,size,qty:1}]);
 showToast('Added to cart');
 };
 const setQty=(i,d)=>setCart(cart.map((c,k)=>k===i?{...c,qty:Math.max(1,c.qty+d)}:c));
 const removeItem=i=>setCart(cart.filter((c,k)=>k!==i));
 const placeOrder=sel=>{
  const made=sel.map(s=>{ const c=cart[s.i]; return {id:Date.now()+s.i,pid:c.pid,size:c.size,qty:s.qty,date:'Today',stage:0}; });
  setOrders(current=>[...made,...current]);
  setCart(current=>current.filter((c,k)=>!sel.some(s=>s.i===k)));
 };
 const cartCount=cart.reduce((s,c)=>s+c.qty,0);
 const sendDm=(productId,from,text)=>{
 setDms(d=>({...d,[productId]:[...(d[productId]||[]),{from,text}]}));
 if(from==='buyer') setTimeout(()=>setDms(d=>({...d,[productId]:[...(d[productId]||[]),{from:'seller',text:'Hi! Thanks for your message - yes, this is available. Which size do you need?'}]})),900);
 };
 const threads=Object.keys(dms).filter(k=>dms[k].length).length;
 const openModal=type=>setModal(type);
 const closeModal=()=>setModal(null);

 let body=null;
 if(screen==='sellercreate') body=<React.Fragment>
   <div className="topbar"><button type="button" className="icon-btn" onClick={()=>{setModeRaw('buyer');setScreen('feed');}} aria-label="Back to marketplace"><ArrowLeftIcon size={19}/></button><span className="pill">Back to marketplace</span></div>
   <SellerCreate onCreate={createAccount}/>
  </React.Fragment>;
 else if(screen==='feed') body=<Feed go={go} catFilter={catFilter} setCatFilter={setCatFilter} cartCount={cartCount} addToCart={addToCart} mode={mode} setMode={setMode} hasSellerAccount={!!sellerAccount}/>;
 else if(screen==='mfeed') body=<React.Fragment><MarketerFeed go={go} promotedTag={promotedTag}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='mypromos') body=<React.Fragment><MyPromotions promotedTag={promotedTag} go={go}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='product') body=<ProductDetail pid={pid} go={go} sizeSel={sizeSel} setSizeSel={setSizeSel} mode={mode} promotedTag={promotedTag} onPromote={promote} addToCart={addToCart}/>;
 else if(screen==='cart') body=<React.Fragment><Cart cart={cart} setQty={setQty} removeItem={removeItem} go={go} openModal={openModal}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='dm') body=<Dm pid={pid} dms={dms} send={sendDm} go={go} viewer={mode==='seller'?'seller':'buyer'}/>;
 else if(screen==='inbox') body=<React.Fragment><SellerInbox dms={dms} go={go}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='sellerprofile') body=<React.Fragment><SellerProfile pid={pid} go={go} tab={tab} setTab={setTab}/><NavBar mode={mode} screen={'feed'} go={go}/></React.Fragment>;
 else if(screen==='orders') body=<React.Fragment><Orders orders={orders}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='myorders') body=<React.Fragment><MyOrders orders={orders} go={go}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='buyerprofile') body=<React.Fragment><BuyerProfile setMode={setMode}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='dash') body=<React.Fragment><Dashboard go={go} setMode={setMode} threads={threads}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='sellerproducts') body=<React.Fragment><SellerProducts openModal={openModal}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='records') body=<React.Fragment><Records transactions={transactions} addTx={addTx}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='marketing') body=<React.Fragment><Marketing/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='ai') body=<React.Fragment><CertifiedAI/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;
 else if(screen==='sellerprofilepage') body=<React.Fragment><SellerSettings setMode={setMode} sellerAccount={sellerAccount} go={go} storeTheme={storeTheme} setStoreTheme={setStoreTheme}/><NavBar mode={mode} screen={screen} go={go}/></React.Fragment>;

 return (
  <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
   {body}
   {modal==='buy' && <BuyModal pid={pid} sizeSel={sizeSel||(PRODUCTS.find(p=>p.id===pid)||{}).sizes?.[0]} close={closeModal} go={go}/>}
   {modal==='checkout' && <PlaceOrderModal cart={cart} close={closeModal} go={go} onPlaced={placeOrder}/>}
   {modal==='create' && <CreateModal close={closeModal}/>}
   {toast && <div className="toast">{toast}</div>}
  </div>
 );
}
