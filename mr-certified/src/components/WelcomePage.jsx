import React, { useEffect, useState } from 'react';
import { BagIcon, CloseIcon, PackageIcon, ShieldIcon, StarIcon, StoreIcon } from './ui/Icons.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { STATUS_LABEL } from '../auth/config.js';

export default function WelcomePage({ onBrowse, onBuyerSignUp, onSellerSignUp, onWorkspace, onBrowseAsBuyer, onSwitchMode }) {
  const { user, promptAuth, signOut } = useAuth();
  const [accountChoiceOpen, setAccountChoiceOpen] = useState(false);

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
    <main className="entry-screen entry-screen-inspo">
      <section className="entry-welcome">
        <div className="entry-welcome-brand">
          <div className="entry-crest" aria-hidden="true">
            <svg viewBox="0 0 64 64"><path d="M12 25 8 10l14 9L32 5l10 14 14-9-4 15H12Z" /><path d="M13 29h38l-4 27H17l-4-27Z" /><path d="M23 37v11m18-11v11M24 37l8-6 8 6M28 37v11m8-11v11" /></svg>
          </div>
          <div className="entry-welcome-wordmark">MERQO<span>.</span></div>
          <span className="entry-welcome-subbrand">CERTIFIED MARKETPLACE</span>
        </div>
        <div className="entry-welcome-copy">
          <span className="entry-kicker">SHOP · SELL · GROW</span>
          <h1>Your next great<br />move starts <em>here.</em></h1>
          <p>Discover standout finds. Build your business. Make room for what’s next—with one login for your separate spaces.</p>
        </div>
        <div className="entry-benefits" aria-label="Marketplace highlights">
          <div><span><ShieldIcon size={18} /></span><b>Seller<br />discovery</b></div>
          <div><span><PackageIcon size={18} /></span><b>Fresh<br />finds</b></div>
          <div><span><StoreIcon size={18} /></span><b>Store<br />tools</b></div>
          <div><span><StarIcon size={18} /></span><b>Room to<br />grow</b></div>
        </div>
        <div className="entry-welcome-actions">
          <button type="button" className="entry-get-started" onClick={() => setAccountChoiceOpen(true)}>
            Get started <span>→</span>
          </button>
          <p className="entry-login-prompt">Already have an account? <button type="button" onClick={() => promptAuth('sign in', onWorkspace, 'signin')}>Log in</button></p>
        </div>
        <button type="button" className="entry-guest-link" onClick={onBrowse}>Explore as a guest</button>
        <div className="entry-welcome-bottom"><span>MADE FOR LOCAL AMBITION</span><i /> <span>ONE LOGIN · SEPARATE SPACES</span></div>
      </section>
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
