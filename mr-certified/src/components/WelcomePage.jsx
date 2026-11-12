// M.C
import React, { useEffect, useState } from 'react';
import {
  ArrowRightIcon, BagIcon, CartIcon, CloseIcon, LockIcon, PinIcon, SearchIcon,
  ShieldIcon, StarIcon, StoreIcon,
} from './ui/Icons.jsx';
import { PRODUCTS, money } from '../data.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { STATUS_LABEL } from '../auth/config.js';
import { mediaBg } from '../products/media.js';
import '../welcome.css';

function LogoMark() {
  return (
    <svg className="wl-logo" viewBox="0 0 48 52" aria-hidden="true">
      <path d="M15 17V13a9 9 0 0 1 18 0v4" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M6 17h36l-2.6 28a4 4 0 0 1-4 3.6H12.6a4 4 0 0 1-4-3.6L6 17Z" fill="currentColor" />
      <path d="M16 41V27l8 9 8-9v14" fill="none" stroke="#0b0b0c" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhonePreview() {
  const items = PRODUCTS.slice(0, 3);
  return (
    <div className="wl-phone" aria-hidden="true">
      <div className="wl-screen">
        <div className="wl-status"><span>9:41</span><span className="wl-status-icons"><i /><i /><b /></span></div>
        <span className="wl-notch" />
        <div className="wl-app-logo">MERQO<i>.</i></div>
        <div className="wl-search"><SearchIcon size={13} /> Search products…</div>
        <div className="wl-promo"><small>Today’s picks</small><b>Big Deals,<br />Bigger Smiles</b><span>Shop now →</span></div>
        <div className="wl-trend-title">Trending now</div>
        <div className="wl-tiles">
          {items.map((product) => (
            <div key={product.id}>
              <i style={{ background: mediaBg(product) }} />
              <span>{product.name}</span>
              <b>{money(product.price)}</b>
            </div>
          ))}
        </div>
        <div className="wl-enterprise">
          <span className="wl-enterprise-mark"><StoreIcon size={15} /></span>
          <span className="wl-enterprise-copy"><b>CERTIFIED ENTERPRISES</b><small>Verified business</small></span>
          <span className="wl-certified-seal"><ShieldIcon size={15} /><small>CERTIFIED</small></span>
        </div>
        <div className="wl-phone-nav"><span>⌂<small>Home</small></span><span>⌕<small>Search</small></span><span>▢<small>Bag</small></span><span>◯<small>Profile</small></span></div>
      </div>
    </div>
  );
}

export default function WelcomePage({ onBrowse, onBuyerSignUp, onSellerSignUp, onWorkspace, onBrowseAsBuyer, onSwitchMode }) {
  const { user, promptAuth, signOut } = useAuth();
  const [accountChoiceOpen, setAccountChoiceOpen] = useState(false);
  const [bgOk, setBgOk] = useState(true); // false if the photo files are missing

  useEffect(() => {
    if (!accountChoiceOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAccountChoiceOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [accountChoiceOpen]);

  if (user) {
    return (
      <main className="entry-screen entry-screen-returning">
        <header className="entry-header">
          <div className="entry-brand">MERQO<span>.</span></div>
          <span className="entry-header-tag">MADE FOR YOUR NEXT MOVE</span>
        </header>
        <section className="entry-layout entry-layout-returning">
          <div className="entry-hero">
            <div className="entry-art" aria-hidden="true">
              <span className="entry-art-ring" />
              <span className="entry-art-core">M<span>.</span></span>
              <span className="entry-art-tag entry-art-tag-top">SHOP WITH INTENT</span>
              <span className="entry-art-tag entry-art-tag-bottom">BUILD WITH PURPOSE</span>
            </div>
            <span className="entry-kicker">WELCOME BACK, {user.firstName.toUpperCase()}</span>
            <h1>Good things grow<br />from <em>here.</em></h1>
            <p>Your spaces, your pace. Pick up where you want to make your mark.</p>
          </div>
          <section className="entry-card entry-workspaces">
            <div className="entry-card-heading">
              <span className="entry-kicker">YOUR MERQO</span>
              <h2>Choose a workspace</h2>
            </div>
            {user.roles.buyer && (
              <button type="button" className="entry-workspace-option" onClick={onBrowseAsBuyer}>
                <span className="entry-workspace-icon"><BagIcon size={20} /></span>
                <span><b>Buyer</b><small>Discover considered finds and track orders</small></span>
                <span className="entry-chevron">↗</span>
              </button>
            )}
            <button type="button" className="entry-workspace-option" onClick={() => onSwitchMode('seller')}>
              <span className="entry-workspace-icon"><StoreIcon size={20} /></span>
              <span>
                <b>Seller</b>
                <small>{user.roles.seller ? STATUS_LABEL[user.roles.seller.status] : 'Open your store workspace'}</small>
              </span>
              <span className="entry-chevron">↗</span>
            </button>
            <div className="entry-account-foot"><span>Signed in as {user.firstName} {user.lastName}</span><button type="button" onClick={signOut}>Sign out</button></div>
          </section>
        </section>
        <footer className="entry-footer"><span>KENYA, WITH AMBITION.</span><span>SHOP · SELL · GROW</span></footer>
      </main>
    );
  }

  return (
    <main className={'wl' + (bgOk ? ' has-bg' : '')}>
      {bgOk && (
        <div className="wl-cover" aria-hidden="true">
          <picture>
            <source media="(min-aspect-ratio: 5/4)" srcSet="/images/welcome-bg-wide.jpg" />
            <img className="wl-cover-img" src="/images/welcome-bg.jpg" alt="" decoding="async" onError={() => setBgOk(false)} />
          </picture>
        </div>
      )}
      <div className="wl-scroll">
      <header className="wl-head">
        <div className="wl-brand">
          <LogoMark />
          <div><b>MERQO<i>.</i></b><span>Shop · Sell · Grow</span></div>
        </div>
        <button type="button" className="wl-login" onClick={() => promptAuth('sign in', onWorkspace, 'signin')}>Log in</button>
      </header>
      <section className="wl-hero">
        <div className="wl-copy">
          <h1><span>Welcome to</span><em>MERQO</em></h1>
          <p className="wl-tag">Shop smarter. Sell <b>easier.</b> <b>Grow</b> together.</p>
          <p className="wl-sub">Discover amazing products, support local sellers, and experience secure, seamless shopping.</p>
          <div className="wl-cta">
            <button type="button" className="wl-btn gold" onClick={onBrowse}><CartIcon size={19} /> Start Shopping <ArrowRightIcon size={18} /></button>
            <button type="button" className="wl-btn" onClick={() => promptAuth('', onSellerSignUp, 'signup', 'seller')}><StoreIcon size={19} /> Become a Seller</button>
          </div>
          <button type="button" className="wl-link" onClick={() => setAccountChoiceOpen(true)}>New here? Create an account</button>
        </div>
        {!bgOk && <PhonePreview />}
      </section>
      <ul className="wl-trust">
        <li><ShieldIcon size={21} /><span>Verified<br />sellers</span></li>
        <li><LockIcon size={21} /><span>Secure<br />payments</span></li>
        <li><PinIcon size={21} /><span>Local<br />sellers</span></li>
        <li><StarIcon size={21} /><span>A growing<br />community</span></li>
      </ul>
      </div>
      {accountChoiceOpen && (
        <div className="modal-wrap auth-wrap" onClick={(event) => { if (event.target === event.currentTarget) setAccountChoiceOpen(false); }}>
          <section className="modal auth-sheet" role="dialog" aria-modal="true" aria-labelledby="account-choice-title">
            <div className="auth-head">
              <div>
                <h2 id="account-choice-title">Choose your account</h2>
                <p>What would you like to do on MERQO?</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setAccountChoiceOpen(false)} aria-label="Close"><CloseIcon size={18} /></button>
            </div>
            <button type="button" className="entry-workspace-option" onClick={() => { setAccountChoiceOpen(false); promptAuth('', onBuyerSignUp, 'signup'); }}>
              <span className="entry-workspace-icon"><BagIcon size={20} /></span>
              <span><b>Buyer</b><small>Discover finds and shop on MERQO</small></span>
              <span className="entry-chevron">↗</span>
            </button>
            <button type="button" className="entry-workspace-option" onClick={() => { setAccountChoiceOpen(false); promptAuth('', onSellerSignUp, 'signup', 'seller'); }}>
              <span className="entry-workspace-icon"><StoreIcon size={20} /></span>
              <span><b>Seller</b><small>Open a store and sell on MERQO</small></span>
              <span className="entry-chevron">↗</span>
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
