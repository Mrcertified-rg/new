import React, { useEffect, useState } from 'react';
import { PRODUCTS, INIT_TX, ORDERS, money } from './data.js';
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
import CommentsModal from './components/CommentsModal.jsx';
import Friends from './components/Friends.jsx';
import Chat from './components/Chat.jsx';
import ShareSheet from './components/ShareSheet.jsx';
import Cart from './components/cart.jsx';
import Dm from './components/DM.jsx';
import SellerInbox from './components/Sellersindox.jsx';
import AppBar from './components/layout/AppBar.jsx';
import RoleStatusBanner from './components/auth/RoleStatusBanner.jsx';
import { ArrowLeftIcon } from './components/ui/Icons.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { getBusinessProfile, restoreSession, saveBusinessProfile } from './auth/authService.js';
import { ROLE_LABEL } from './auth/config.js';
import { listFollowedSellers, toggleFollowedSeller } from './social/socialService.js';

/* ---------------------------------------------------------------------------
 * Navigation rules (all in one place)
 * -------------------------------------------------------------------------*/

/** First screen of each mode. */
const HOME = { buyer: 'feed', seller: 'dash', marketer: 'mfeed' };

/** Screens that only an UNLOCKED seller / marketer may open. */
const SELLER_SCREENS = ['dash', 'sellerproducts', 'records', 'marketing', 'ai', 'sellerprofilepage', 'inbox'];
const MARKETER_SCREENS = ['mfeed', 'mypromos'];
const roleOfScreen = (s) => (SELLER_SCREENS.includes(s) ? 'seller' : MARKETER_SCREENS.includes(s) ? 'marketer' : null);

/** Buyer screens that need an account (value = wording used in the sign-in popup). */
const ACCOUNT_SCREENS = {
  dm: 'message sellers',
  cart: 'view your cart',
  orders: 'see your orders',
  buyerprofile: 'open your profile',
  friends: 'see your friends',
  chat: 'chat with friends',
};

function AppInner() {
  const { user, elevatedRole, promptAuth, requireAuth, openRoleAccess, lockRole, simulateApproval } = useAuth();

  const [mode, setModeRaw] = useState('buyer');
  const [screen, setScreen] = useState('feed');
  const [hist, setHist] = useState([]); // back-button history
  const [pid, setPid] = useState(null);
  const [tab, setTab] = useState('Products');
  const [catFilter, setCatFilter] = useState('For You');
  const [sizeSel, setSizeSel] = useState(null);
  const [modal, setModal] = useState(null);
  const [sellerAccount, setSellerAccount] = useState(() => (user ? getBusinessProfile(user.id, 'seller') : null));
  const [storeTheme, setStoreTheme] = useState('#E7B84E');
  const [transactions, setTransactions] = useState(INIT_TX);
  const [promotedTag, setPromotedTag] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(ORDERS);
  // MC - keep seller follows attached to the signed-in buyer across sessions
  const [following, setFollowing] = useState(() => (user ? listFollowedSellers(user.id) : []));
  // MC - active friend chat and product share sheet
  const [chatUid, setChatUid] = useState(null);
  const [shareFor, setShareFor] = useState(null);
  // MC - per-product comment state and active comments sheet
  const [comments, setComments] = useState({});
  const [commentPid, setCommentPid] = useState(null);
  const [dms, setDms] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (m, ms = 1800) => { setToast(m); setTimeout(() => setToast(null), ms); };

  /* ----------------------------- navigation ----------------------------- */
  /** Moves to a screen and remembers where we came from (for the back arrow). */
  const navigate = (scr, extra) => {
    setHist((h) => [...h, { screen, pid }].slice(-20));
    setScreen(scr);
    if (extra && 'pid' in extra) { setPid(extra.pid); setSizeSel(null); }
  };

  /** Leaves Seller/Marketer mode: re-locks it and returns to the marketplace. */
  const leaveRole = () => { lockRole(); setModeRaw('buyer'); setScreen('feed'); setHist([]); };

  const goBack = () => {
    const prev = hist[hist.length - 1];
    if (prev) { setHist((h) => h.slice(0, -1)); setScreen(prev.screen); setPid(prev.pid); return; }
    setScreen(HOME[mode]);
  };

  /**
   * Switch into Seller / Marketer mode. ALWAYS asks for that role's login,
   * even though the buyer is already signed in.
   */
  const enterRole = (role, target) => {
    if (!user) { promptAuth(`switch to ${ROLE_LABEL[role]} mode`, () => enterRole(role, target)); return; }
    const status = user.roles[role]?.status;
    if (status === 'rejected' || status === 'suspended') {
      showToast(`${ROLE_LABEL[role]} access is ${status}.`, 2600);
      return;
    }
    openRoleAccess(role, () => {
      setModeRaw(role);
      // First time in as THIS role: collect that role's own business details.
      const profile = getBusinessProfile(user.id, role);
      setSellerAccount(profile);
      if (!profile) navigate('sellercreate');
      else navigate(target || HOME[role]);
    });
  };

  /** Used by the menu and by older screens that call setMode('buyer' | 'seller' | 'marketer'). */
  const switchMode = (m) => {
    if (m === 'buyer') {
      if (mode !== 'buyer' || elevatedRole) leaveRole();
      else if (screen !== 'feed') navigate('feed');
      return;
    }
    if (m === mode && elevatedRole === m) { navigate(HOME[m]); return; }
    enterRole(m);
  };

  /** Central navigation function handed to every screen. */
  const go = (scr, extra) => {
    if (scr === 'welcome' || scr === 'register') { leaveRole(); return; } // old links -> marketplace
    const needRole = roleOfScreen(scr);
    if (needRole && elevatedRole !== needRole) { enterRole(needRole, scr); return; }
    if (ACCOUNT_SCREENS[scr] && !user) { promptAuth(ACCOUNT_SCREENS[scr], () => navigate(scr, extra)); return; }
    navigate(scr, extra);
  };

  /** Seller/Marketer setup form finished (business details saved for this user). */
  const createAccount = (acc) => {
    if (user) saveBusinessProfile(user.id, acc);
    setSellerAccount(acc);
    const role = acc.role === 'marketer' ? 'marketer' : 'seller';
    if (elevatedRole === role) { setModeRaw(role); navigate(HOME[role]); } else enterRole(role);
  };

  /* ------------------------------ safety nets ------------------------------ */
  // If a privileged mode gets locked (idle timeout) while open, send them to the marketplace.
  useEffect(() => {
    const inPrivateArea = mode !== 'buyer' || roleOfScreen(screen) || screen === 'sellercreate';
    if (inPrivateArea && !elevatedRole) {
      setModeRaw('buyer'); setScreen('feed'); setHist([]);
      if (user) showToast('Seller/Marketer mode locked. Log in again to continue.', 2800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevatedRole]);

  // Signing out (or switching account) clears everything that belonged to the old user.
  useEffect(() => {
    if (!user) {
      setModeRaw('buyer'); setScreen('feed'); setHist([]); setCart([]); setDms({}); setFollowing([]); setChatUid(null); setShareFor(null); setSellerAccount(null);
    } else {
      setSellerAccount(getBusinessProfile(user.id, 'seller'));
      setFollowing(listFollowedSellers(user.id));
    }
  }, [user?.id]);

  // MC - open product links shared from the feed
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('product'));
    if (id && PRODUCTS.some((product) => product.id === id)) { setPid(id); setScreen('product'); }
  }, []);

  /* ------------------------------ shop actions ------------------------------ */
  const addTx = (t) => setTransactions([t, ...transactions]);

  const promote = (productId) => {
    if (user?.roles?.marketer?.status !== 'approved') { showToast('Promotions unlock once your marketer account is approved.', 2800); return; }
    setPromotedTag({ productId, marketerName: sellerAccount ? sellerAccount.name : user.firstName });
    go('mypromos');
  };

  /* MC - share links and manage product comments */
  const shareProduct = async (productId) => {
    const product = PRODUCTS.find((item) => item.id === productId);
    if (!product) return;
    const url = window.location.origin + window.location.pathname + '?product=' + productId;
    const shareData = { title: product.name, text: product.name + ' - ' + money(product.price) + ' on MR CERTIFIED', url };
    try {
      if (navigator.share) { await navigator.share(shareData); return; }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      document.body.removeChild(textarea);
      if (copied) showToast('Link copied');
      else window.prompt('Copy this link', url);
    }
  };

  const addComment = (productId, text) => setComments((current) => ({
    ...current,
    [productId]: [...(current[productId] || []), { id: Date.now(), uid: user.id, name: user.firstName, text, time: Date.now() }],
  }));
  const deleteComment = (productId, commentId) => setComments((current) => ({
    ...current,
    [productId]: (current[productId] || []).filter((comment) => comment.id !== commentId),
  }));
  const commentCount = (productId) => (comments[productId] || []).length;

  // MC - open a friend chat after passing account access checks
  const openChat = (userId) => { setChatUid(userId); go('chat'); };

  // MC - authenticate and persist seller follow actions per buyer account
  const toggleFollow = (seller) => requireAuth('follow sellers', () => {
    const activeUser = user || restoreSession();
    if (!activeUser) throw new Error('Sign in before following a seller.');
    setFollowing(toggleFollowedSeller(activeUser.id, seller));
  });

  const addToCart = (productId, size) => requireAuth('add items to your cart', () => {
    setCart((c) => {
      const i = c.findIndex((x) => x.pid === productId && x.size === size);
      if (i >= 0) return c.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { pid: productId, size, qty: 1, checked: true }];
    });
    showToast('Added to cart');
  });
  const setQty = (i, d) => setCart(cart.map((c, k) => (k === i ? { ...c, qty: Math.max(1, c.qty + d) } : c)));
  const removeItem = (i) => setCart(cart.filter((c, k) => k !== i));
  // MC - selected cart items and order placement
  const toggleItem = (i) => setCart(cart.map((c, k) => (k === i ? { ...c, checked: !c.checked } : c)));
  const toggleAll = (checked) => setCart(cart.map((c) => ({ ...c, checked })));
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const selectedItems = cart.filter((c) => c.checked);
  const selectedCount = selectedItems.reduce((s, c) => s + c.qty, 0);
  const selectedTotal = selectedItems.reduce((s, c) => s + PRODUCTS.find((x) => x.id === c.pid).price * c.qty, 0);
  const placeSelectedOrders = () => {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const newOrders = selectedItems.map((c, n) => ({ id: Date.now() + n, pid: c.pid, size: c.size, qty: c.qty, date, stage: 0 }));
    setOrders((o) => [...newOrders, ...o]);
    setCart((c) => c.filter((x) => !x.checked));
  };

  const sendDm = (productId, from, text) => {
    setDms((d) => ({ ...d, [productId]: [...(d[productId] || []), { from, text, time: Date.now() }] }));
    if (from === 'buyer') setTimeout(() => setDms((d) => ({ ...d, [productId]: [...(d[productId] || []), { from: 'seller', text: 'Hi! Thanks for your message - yes, this is available. Which size do you need?', time: Date.now() }] })), 900);
  };
  const threads = Object.keys(dms).filter((k) => dms[k].length).length;

  const openModal = (type) => {
    if (type === 'buy' || type === 'checkout') { requireAuth('place an order', () => setModal(type)); return; }
    if (type === 'create') {
      if (user?.roles?.seller?.status === 'approved') setModal(type);
      else showToast('Listing is locked until your seller account is approved.', 2800);
      return;
    }
    setModal(type);
  };
  const closeModal = () => setModal(null);

  /* --------------------------------- render --------------------------------- */
  const bar = <AppBar go={go} onBack={goBack} mode={mode} cartCount={cartCount} onSwitchMode={switchMode} />;
  const bannerRole = mode === 'seller' || mode === 'marketer' ? mode : null;
  /** Inner screens get the slim top bar (replaces the old bottom tab bar). */
  const withBar = (el) => (
    <React.Fragment>
      {bar}
      {bannerRole && <RoleStatusBanner role={bannerRole} status={user?.roles?.[bannerRole]?.status} onSimulate={() => simulateApproval(bannerRole)} />}
      {el}
    </React.Fragment>
  );

  // Never render a private screen unless that role is unlocked right now.
  const needed = roleOfScreen(screen);
  const blocked = (needed && elevatedRole !== needed) || (screen === 'sellercreate' && !elevatedRole);

  let body = null;
  if (blocked) body = null;
  else if (screen === 'sellercreate') body = (
    <React.Fragment>
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={leaveRole} aria-label="Back to marketplace"><ArrowLeftIcon size={19} /></button>
        <span className="pill">Back to marketplace</span>
      </div>
      <SellerCreate key={elevatedRole || 'seller'} role={elevatedRole === 'marketer' ? 'marketer' : 'seller'} onCreate={createAccount} />
    </React.Fragment>
  );
  // MC - cart actions and order tracking
  else if (screen === 'feed') body = <Feed go={go} catFilter={catFilter} setCatFilter={setCatFilter} cartCount={cartCount} mode={mode} onSwitchMode={switchMode} addToCart={addToCart} onShare={setShareFor} onComment={setCommentPid} commentCount={commentCount} following={following} onFollow={toggleFollow} />;
  else if (screen === 'mfeed') body = withBar(<MarketerFeed go={go} promotedTag={promotedTag} />);
  else if (screen === 'mypromos') body = withBar(<MyPromotions promotedTag={promotedTag} go={go} />);
  else if (screen === 'product') body = <ProductDetail pid={pid} go={go} sizeSel={sizeSel} setSizeSel={setSizeSel} openModal={openModal} mode={mode} promotedTag={promotedTag} onPromote={promote} addToCart={addToCart} />;
  else if (screen === 'cart') body = withBar(<Cart cart={cart} setQty={setQty} removeItem={removeItem} toggleItem={toggleItem} toggleAll={toggleAll} go={go} openModal={openModal} />);
  else if (screen === 'dm') body = <Dm pid={pid} dms={dms} send={sendDm} go={go} viewer={mode === 'seller' ? 'seller' : 'buyer'} />;
  else if (screen === 'friends' && user) body = withBar(<Friends me={user} go={go} openChat={openChat} following={following} onFollow={toggleFollow} showToast={showToast} dms={dms} />);
  else if (screen === 'chat' && user && chatUid) body = withBar(<Chat me={user} otherId={chatUid} go={go} />);
  else if (screen === 'inbox') body = withBar(<SellerInbox dms={dms} go={go} />);
  else if (screen === 'sellerprofile') body = withBar(<SellerProfile pid={pid} go={go} tab={tab} setTab={setTab} following={following} onFollow={toggleFollow} />);
  // MC - provide order history and product navigation to tracking
  else if (screen === 'orders') body = withBar(<Orders orders={orders} go={go} />);
  else if (screen === 'buyerprofile') body = withBar(<BuyerProfile setMode={switchMode} go={go} following={following} onFollow={toggleFollow} />);
  else if (screen === 'dash') body = withBar(<Dashboard go={go} setMode={switchMode} threads={threads} />);
  else if (screen === 'sellerproducts') body = withBar(<SellerProducts openModal={openModal} />);
  else if (screen === 'records') body = withBar(<Records transactions={transactions} addTx={addTx} />);
  else if (screen === 'marketing') body = withBar(<Marketing />);
  else if (screen === 'ai') body = withBar(<CertifiedAI />);
  else if (screen === 'sellerprofilepage') body = withBar(<SellerSettings setMode={switchMode} sellerAccount={sellerAccount} go={go} storeTheme={storeTheme} setStoreTheme={setStoreTheme} />);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {body}
      {modal === 'buy' && <BuyModal pid={pid} sizeSel={sizeSel || (PRODUCTS.find((p) => p.id === pid) || {}).sizes?.[0]} close={closeModal} go={go} />}
      {/* MC - checkout uses selected cart total and saves the placed order */}
      {modal === 'checkout' && <BuyModal pid={null} sizeSel={null} label={'Cart - ' + selectedCount + ' item(s)'} amount={selectedTotal} onDone={placeSelectedOrders} close={closeModal} go={go} />}
      {shareFor != null && <ShareSheet pid={shareFor} close={() => setShareFor(null)} onExternal={shareProduct} go={go} showToast={showToast} />}
      {commentPid != null && <CommentsModal pid={commentPid} comments={comments[commentPid] || []} onAdd={addComment} onDelete={deleteComment} close={() => setCommentPid(null)} />}
      {modal === 'create' && <CreateModal close={closeModal} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/** App = account provider (sign-in popups, session) wrapped around the screens. */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
