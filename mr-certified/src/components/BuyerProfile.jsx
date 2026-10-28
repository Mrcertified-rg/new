import React, { useState } from 'react';
import { PRODUCTS, initials } from '../data.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { KENYA_COUNTIES } from '../auth/config.js';
import { listChats, listIncoming } from '../social/socialService.js';
import { ArrowRightIcon, StoreIcon, UserIcon } from './ui/Icons.jsx';

export default function BuyerProfile({ setMode, go, following = [], onFollow }) {
  const { user, signOut, saveBuyerAddress } = useAuth();
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [address, setAddress] = useState(() => ({
    county: user?.address?.county || '',
    town: user?.address?.town || '',
    area: user?.address?.area || '',
    landmark: user?.address?.landmark || '',
    altPhone: user?.address?.altPhone || '',
    notes: user?.address?.notes || '',
  }));
  if (!user) return null;

  const friends = listChats(user.id);
  const requests = listIncoming(user.id).length;
  const memberMark = user.id.slice(-5).toUpperCase();
  const displayName = user.firstName + (user.lastName ? ' ' + user.lastName[0] + '.' : '');
  const edition = user.address.town || user.address.county || 'KENYA';
  const savedAddress = [user.address.area, user.address.town, user.address.county].filter(Boolean).join(', ');
  const updateAddressField = (field) => (event) => setAddress((current) => ({ ...current, [field]: event.target.value }));
  const saveAddress = async (event) => {
    event.preventDefault();
    setAddressError('');
    try {
      await saveBuyerAddress(address);
      setEditingAddress(false);
    } catch (error) {
      setAddressError(error.message);
    }
  };

  return (
    <React.Fragment>
      <div className="topbar"><h1>Your MERQO card</h1></div>
      <div className="screen buyer-profile-screen">
        <section className="buyer-id-card">
          <div className="buyer-card-top"><span>MERQO / BUYER</span><span>MEMBER {memberMark}</span></div>
          <div className="buyer-card-main">
            <div className="buyer-glyph" aria-hidden="true">
              <span>{initials(user.firstName + ' ' + user.lastName)}</span>
              <i></i>
            </div>
            <div className="buyer-card-copy">
              <span className="buyer-card-kicker">GOOD FINDS, GOOD PEOPLE</span>
              <h2>{displayName}</h2>
              <p>Here for the shops and the people behind them.</p>
            </div>
          </div>
          <div className="buyer-card-bottom"><span>YOUR SPACE, YOUR PACE</span><span>✳ {edition.toUpperCase()} EDITION</span></div>
        </section>

        <section className="buyer-connections" aria-label="Your connections">
          <button type="button" className="buyer-connection" onClick={() => go('friends')}>
            <span className="buyer-connection-icon friend"><UserIcon size={17} /></span>
            <span className="buyer-connection-copy"><b>My people</b><small>Friends &amp; chats</small></span>
            <strong>{friends.length}{requests > 0 && <i>{requests} new</i>}</strong>
            <ArrowRightIcon size={15} />
          </button>
          <button type="button" className="buyer-connection" onClick={() => go('friends')}>
            <span className="buyer-connection-icon shops"><StoreIcon size={17} /></span>
            <span className="buyer-connection-copy"><b>Shops I rate</b><small>Seller follows</small></span>
            <strong>{following.length}</strong>
            <ArrowRightIcon size={15} />
          </button>
        </section>

        <section className="buyer-following">
          <div className="buyer-section-head">
            <div><span className="buyer-eyebrow">YOUR LOCAL LINEUP</span><h2>Shops in your orbit</h2></div>
            <button type="button" onClick={() => go('friends')}>Manage <ArrowRightIcon size={13} /></button>
          </div>
          {!following.length ? (
            <div className="buyer-follow-empty">
              <span className="buyer-empty-mark">✳</span>
              <div><b>Your next good shop is out there.</b><p>Follow a seller to keep their finds close.</p></div>
              <button type="button" onClick={() => go('feed')}>Explore</button>
            </div>
          ) : (
            <div className="buyer-follow-list">
              {following.map((name) => {
                const product = PRODUCTS.find((item) => item.seller === name);
                if (!product) return null;
                return (
                  <div className="buyer-follow-shop" key={name}>
                    <button
                      type="button"
                      className="buyer-shop-glyph"
                      style={{ '--shop-a': product.g[0], '--shop-b': product.g[1] }}
                      onClick={() => go('sellerprofile', { pid: product.id })}
                      aria-label={'Open ' + name}
                    >
                      {initials(name)}
                    </button>
                    <button type="button" className="buyer-shop-name" onClick={() => go('sellerprofile', { pid: product.id })}>
                      <b>{name}<span>✓</span></b>
                      <small>{product.city} · {product.name}</small>
                    </button>
                    <button type="button" className="buyer-unfollow" onClick={() => onFollow && onFollow(name)}>Following</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <details className="buyer-private">
          <summary>Private account &amp; delivery details</summary>
          <div className="buyer-private-content">
            <p>{user.email}</p>
            <p>{user.phone}</p>
            {!editingAddress && (
              <React.Fragment>
                <p>{savedAddress || 'No delivery address saved yet.'}</p>
                {user.address.landmark && <p>{user.address.landmark}</p>}
                {user.address.notes && <p>{user.address.notes}</p>}
                <button type="button" className="buyer-edit-address" onClick={() => { setAddressError(''); setEditingAddress(true); }}>Edit delivery details</button>
              </React.Fragment>
            )}
            {editingAddress && (
              <form className="buyer-address-form" onSubmit={saveAddress}>
                <label>County
                  <select value={address.county} onChange={updateAddressField('county')}>
                    <option value="">Select county</option>
                    {KENYA_COUNTIES.map((county) => <option value={county} key={county}>{county}</option>)}
                  </select>
                </label>
                <div className="buyer-address-row">
                  <label>Town / city<input value={address.town} onChange={updateAddressField('town')} /></label>
                  <label>Area / estate<input value={address.area} onChange={updateAddressField('area')} /></label>
                </div>
                <label>Landmark (optional)<input value={address.landmark} onChange={updateAddressField('landmark')} /></label>
                <label>Delivery note (optional)<input value={address.notes} onChange={updateAddressField('notes')} /></label>
                <label>Alternative phone (optional)<input inputMode="tel" value={address.altPhone} onChange={updateAddressField('altPhone')} /></label>
                {addressError && <p className="buyer-address-error" role="alert">{addressError}</p>}
                <div className="buyer-address-actions">
                  <button type="button" onClick={() => { setAddressError(''); setEditingAddress(false); }}>Cancel</button>
                  <button type="submit">Save details</button>
                </div>
              </form>
            )}
            <span>Only shown to you. Friends and sellers cannot see these details.</span>
          </div>
        </details>

        <div className="buyer-profile-actions">
          <button type="button" className="btn ghost" onClick={() => setMode('seller')}>Open seller / marketer access</button>
          <button type="button" className="buyer-signout" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </React.Fragment>
  );
}
