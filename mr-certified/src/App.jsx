import React, { useEffect, useState } from 'react';
import { PRODUCTS, INIT_TX, ORDERS, money } from './data.js';
import Feed from './components/Feed.jsx';
import Reels from './components/Reels.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import SellerProfile from './components/SellerProfile.jsx';
import Orders from './components/Orders.jsx';
import BuyerProfile from './components/BuyerProfile.jsx';
import Dashboard from './components/Dashboard.jsx';
import SellerProducts from './components/SellerProducts.jsx';
import SellerOrders from './components/SellerOrders.jsx';
import Customers from './components/Customers.jsx';
import Marketing from './components/Marketing.jsx';
import CertifiedAI from './components/CertifiedAI.jsx';
import SellerSettings from './components/SellerSettings.jsx';
import SellerCreate from './components/SellerCreate.jsx';
import Records from './components/Records.jsx';
import BuyModal from './components/BuyModal.jsx';
import CreateModal from './components/CreateModal.jsx';
import CommentsModal from './components/CommentsModal.jsx';
import Friends from './components/Friends.jsx';
import Chat from './components/Chat.jsx';
import ShareSheet from './components/ShareSheet.jsx';
import Cart from './components/cart.jsx';
import Dm from './components/DM.jsx';
import SellerInbox from './components/Sellersindox.jsx';
import WelcomePage from './components/WelcomePage.jsx';
import AppBar from './components/layout/AppBar.jsx';
import BuyerNav from './components/layout/BuyerNav.jsx';
import SellerNav from './components/layout/SellerNav.jsx';
import RoleStatusBanner from './components/auth/RoleStatusBanner.jsx';
import { ArrowLeftIcon } from './components/ui/Icons.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { getBusinessProfile, getPerson, restoreSession, saveBusinessProfile } from './auth/authService.js';
import { ROLE_LABEL } from './auth/config.js';
import { listFollowedSellers, toggleFollowedSeller } from './social/socialService.js';

/* ---------------------------------------------------------------------------
 * Navigation rules (all in one place)
 * -------------------------------------------------------------------------*/

/** First screen of each mode. */
const HOME = { buyer: 'feed', seller: 'dash' };

/** Screens that only an unlocked seller may open. */
const SELLER_SCREENS = ['dash', 'sellerproducts', 'sellerorders', 'customers', 'records', 'marketing', 'ai', 'sellerprofilepage', 'inbox'];
const roleOfScreen = (s) => (SELLER_SCREENS.includes(s) ? 'seller' : null);

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
  const [screen, setScreen] = useState(() => (user?.roles?.buyer ? 'feed' : 'welcome'));
  const [hist, setHist] = useState([]); // back-button history
  const [pid, setPid] = useState(null);
  const [tab, setTab] = useState('Products');
  const [catFilter, setCatFilter] = useState('For You');
  const [sizeSel, setSizeSel] = useState(null);
  const [modal, setModal] = useState(null);
  const [sellerAccount, setSellerAccount] = useState(() => (user ? getBusinessProfile(user.id, 'seller') : null));
  const [storeTheme, setStoreTheme] = useState('#E7B84E');
  const [transactions, setTransactions] = useState(INIT_TX);
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
  const [liked, setLiked] = useState([]);

  const showToast = (m, ms = 1800) => { setToast(m); setTimeout(() => setToast(null), ms); };

  /* ----------------------------- navigation ----------------------------- */
  /** Moves to a screen and remembers where we came from (for the back arrow). */
  const navigate = (scr, extra) => {
    setHist((h) => [...h, { screen, pid }].slice(-20));
    setScreen(scr);
    if (extra && 'pid' in extra) setPid(extra.pid);
    else setPid(null);
    setSizeSel(null);
  };

  /** Leaves Seller mode: re-locks it and returns to the marketplace. */
  const leaveRole = () => { lockRole(); setModeRaw('buyer'); setScreen(user?.roles?.buyer ? 'feed' : 'welcome'); setHist([]); };

  const goBack = () => {
    const prev = hist[hist.length - 1];
    if (prev) { setHist((h) => h.slice(0, -1)); setScreen(prev.screen); setPid(prev.pid); return; }
  };
  const goHome = () => {
    setHist([]);
    setScreen(HOME[mode]);
    setPid(null);
  };

  /**
   * Switch into Seller mode. ALWAYS asks for that role's login,
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
      const profile = getBusinessProfile(user.id, role);
      const destination = profile ? target || HOME[role] : 'sellercreate';
      setModeRaw(role);
      setSellerAccount(profile);
      setPid(null);
      setSizeSel(null);
      setScreen(destination);
      setHist(profile && destination !== HOME[role] ? [{ screen: HOME[role], pid: null }] : []);
    });
  };

  /** Used by the menu and by older screens that call setMode('buyer' | 'seller'). */
  const switchMode = (m) => {
    if (m === 'buyer') {
      if (user && !user.roles?.buyer) { leaveRole(); return; }
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

  /** Seller setup form finished (business details saved for this user). */
  const createAccount = (acc) => {
    if (user) saveBusinessProfile(user.id, acc);
    setSellerAccount(acc);
    if (elevatedRole === 'seller') {
      setModeRaw('seller');
      setScreen(HOME.seller);
      setPid(null);
      setHist([]);
    } else enterRole('seller');
  };

  /* ------------------------------ safety nets ------------------------------ */
  // If a privileged mode gets locked (idle timeout) while open, send them to the marketplace.
  useEffect(() => {
    const inPrivateArea = mode !== 'buyer' || roleOfScreen(screen) || screen === 'sellercreate';
    if (inPrivateArea && !elevatedRole) {
      setModeRaw('buyer'); setScreen('feed'); setHist([]);
      if (user) showToast('Seller mode locked. Log in again to continue.', 2800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevatedRole]);

  // Signing out (or switching account) clears everything that belonged to the old user.
  useEffect(() => {
    if (!user) {
      setModeRaw('buyer'); setScreen('welcome'); setHist([]); setCart([]); setDms({}); setFollowing([]); setChatUid(null); setShareFor(null); setSellerAccount(null);
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
  const toggleLike = (productId) => requireAuth('like products', () => {
    setLiked((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
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
    const customer = user ? {
      id: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email || '',
      phone: user.phone || '',
    } : null;
    const newOrders = selectedItems.map((c, n) => ({ id: Date.now() + n, pid: c.pid, size: c.size, qty: c.qty, date, stage: 0, customer }));
    setOrders((o) => [...newOrders, ...o]);
    setCart((c) => c.filter((x) => !x.checked));
  };
  const advanceSellerOrder = (orderId, stage) => {
    setOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, stage: Math.max(order.stage, stage) } : order
    )));
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
  const bar = <AppBar go={go} onBack={goBack} showBack={mode === 'buyer' || hist.length > 0 || screen !== HOME[mode]} mode={mode} screen={screen} cartCount={cartCount} onSwitchMode={switchMode} />;
  const bannerRole = mode === 'seller' ? mode : null;
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
  else if (screen === 'welcome') body = (
    <WelcomePage
      onBrowse={() => { setModeRaw('buyer'); setScreen('feed'); }}
      onBuyerSignUp={() => { setModeRaw('buyer'); setScreen('feed'); }}
      onSellerSignUp={() => { setModeRaw('seller'); setScreen('dash'); setHist([]); }}
      onWorkspace={() => { setModeRaw('buyer'); setScreen('welcome'); }}
      onBrowseAsBuyer={() => { setModeRaw('buyer'); setScreen('feed'); }}
      onSwitchMode={switchMode}
    />
  );
  else if (screen === 'sellercreate') body = (
    <React.Fragment>
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={leaveRole} aria-label="Back to marketplace"><ArrowLeftIcon size={19} /></button>
        <span className="pill">Back to marketplace</span>
      </div>
      <SellerCreate key={elevatedRole || 'seller'} onCreate={createAccount} />
    </React.Fragment>
  );
  // MC - cart actions and order tracking
  else if (screen === 'feed') body = <Feed go={go} catFilter={catFilter} setCatFilter={setCatFilter} cartCount={cartCount} mode={mode} onSwitchMode={switchMode} addToCart={addToCart} onShare={setShareFor} onComment={setCommentPid} commentCount={commentCount} following={following} onFollow={toggleFollow} liked={liked} onToggleLike={toggleLike} />;
  else if (screen === 'reels') body = <Reels go={go} addToCart={addToCart} liked={liked} onToggleLike={toggleLike} onComment={setCommentPid} commentCount={commentCount} onShare={setShareFor} following={following} onFollow={toggleFollow} />;
  else if (screen === 'product') body = withBar(<ProductDetail pid={pid} go={go} onBack={goBack} sizeSel={sizeSel} setSizeSel={setSizeSel} openModal={openModal} addToCart={addToCart} liked={liked.includes(pid)} onToggleLike={() => toggleLike(pid)} />);
  else if (screen === 'cart') body = withBar(<Cart cart={cart} setQty={setQty} removeItem={removeItem} toggleItem={toggleItem} toggleAll={toggleAll} go={go} openModal={openModal} />);
  else if (screen === 'dm') body = <Dm pid={pid} dms={dms} send={sendDm} go={go} onBack={goBack} viewer={mode === 'seller' ? 'seller' : 'buyer'} user={user} />;
  else if (screen === 'friends' && user) body = withBar(<Friends me={user} go={go} openChat={openChat} following={following} onFollow={toggleFollow} showToast={showToast} dms={dms} />);
  else if (screen === 'chat' && user && chatUid) body = <Chat me={user} otherId={chatUid} go={go} onBack={goBack} />;
  else if (screen === 'inbox') body = withBar(<SellerInbox dms={dms} go={go} />);
  else if (screen === 'sellerprofile') body = withBar(<SellerProfile pid={pid} go={go} tab={tab} setTab={setTab} following={following} onFollow={toggleFollow} />);
  // MC - provide order history and product navigation to tracking
  else if (screen === 'orders') body = withBar(<Orders orders={orders} go={go} />);
  else if (screen === 'buyerprofile') body = withBar(<BuyerProfile go={go} openChat={openChat} profileId={pid} profile={pid ? getPerson(pid) : null} />);
  else if (screen === 'dash') body = withBar(<Dashboard go={go} threads={threads} orders={orders} openModal={openModal} sellerName={sellerAccount?.name} />);
  else if (screen === 'sellerproducts') body = withBar(<SellerProducts openModal={openModal} go={go} sellerName={sellerAccount?.name} />);
  else if (screen === 'sellerorders') body = withBar(<SellerOrders orders={orders} onAdvanceOrder={advanceSellerOrder} sellerName={sellerAccount?.name} />);
  else if (screen === 'customers') body = withBar(<Customers orders={orders} sellerName={sellerAccount?.name} />);
  else if (screen === 'records') body = withBar(<Records transactions={transactions} addTx={addTx} />);
  else if (screen === 'marketing') body = withBar(<Marketing />);
  else if (screen === 'ai') body = withBar(<CertifiedAI />);
  else if (screen === 'sellerprofilepage') body = withBar(<SellerSettings setMode={switchMode} sellerAccount={sellerAccount} go={go} storeTheme={storeTheme} setStoreTheme={setStoreTheme} />);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {body}
      {mode === 'buyer' && ['feed', 'reels', 'friends', 'cart', 'buyerprofile', 'product', 'sellerprofile'].includes(screen) && <BuyerNav screen={screen} go={go} goHome={goHome} cartCount={cartCount} />}
      {mode === 'seller' && elevatedRole === 'seller' && ['dash', 'sellerproducts', 'sellerorders', 'customers', 'records', 'marketing', 'ai', 'sellerprofilepage', 'inbox'].includes(screen) && <SellerNav screen={screen} go={go} />}
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
