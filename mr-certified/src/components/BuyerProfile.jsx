import React, { useEffect, useRef, useState } from 'react';
import { initials } from '../data.js';
import { PRODUCTS } from '../data.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { KENYA_COUNTIES } from '../auth/config.js';
import { applyThemePreference } from '../themePreference.js';
import { listChats, listFollowedSellers, fullName, personInitials } from '../social/socialService.js';
import { ArrowRightIcon, CameraIcon, MessageIcon, StoreIcon, UserIcon } from './ui/Icons.jsx';

const EMPTY_ADDRESS = {
  county: '',
  town: '',
  area: '',
  landmark: '',
  altPhone: '',
  notes: '',
};

function resizeProfilePicture(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file for your profile picture.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Choose an image smaller than 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image. Please try another file.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Could not open that image. Please try another file.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 320 / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Your browser could not prepare that image.'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function BuyerProfile({ go, openChat }) {
  const { user, saveBuyerProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [connectionsTab, setConnectionsTab] = useState('friends');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const photoInput = useRef(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      profilePicture: user.profilePicture || '',
      theme: user.theme || 'dark',
      currentPassword: '',
      newPassword: '',
      address: { ...EMPTY_ADDRESS, ...(user.address || {}) },
    });
  }, [user]);

  if (!user || !form) return null;

  const memberMark = user.id.slice(-5).toUpperCase();
  const displayName = `${user.firstName}${user.lastName ? ` ${user.lastName[0]}.` : ''}`;
  const edition = user.address?.town || user.address?.county || 'KENYA';
  const friends = listChats(user.id).map((chat) => chat.person);
  const followedShops = listFollowedSellers(user.id);
  const setField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'theme') applyThemePreference(value);
  };
  const setAddressField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, address: { ...current.address, [field]: value } }));
  };
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    try {
      const profilePicture = await resizeProfilePicture(file);
      setForm((current) => ({ ...current, profilePicture }));
    } catch (photoIssue) {
      setPhotoError(photoIssue.message);
    }
  };
  const save = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await saveBuyerProfile(form);
      setForm((current) => ({ ...current, currentPassword: '', newPassword: '' }));
      setEditing(false);
    } catch (saveError) {
      setError(saveError.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const cancelEdit = () => {
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      profilePicture: user.profilePicture || '',
      theme: user.theme || 'dark',
      currentPassword: '',
      newPassword: '',
      address: { ...EMPTY_ADDRESS, ...(user.address || {}) },
    });
    setError('');
    setPhotoError('');
    applyThemePreference(user.theme || 'dark');
    setEditing(false);
  };

  return (
    <React.Fragment>
      <div className="topbar"><h1>Your MERQO card</h1></div>
      <div className="screen buyer-profile-screen">
        <section className="buyer-id-card">
          <div className="buyer-card-top"><span>MERQO / BUYER</span><span>MEMBER {memberMark}</span></div>
          <div className="buyer-card-main">
            <div className={'buyer-glyph' + (user.profilePicture ? ' has-photo' : '')} aria-label={`${displayName}'s profile picture`}>
              {user.profilePicture
                ? <img src={user.profilePicture} alt="" />
                : <span>{initials(user.firstName + ' ' + user.lastName)}</span>}
              <i></i>
            </div>
            <div className="buyer-card-copy">
              <span className="buyer-card-kicker">GOOD FINDS, GOOD PEOPLE</span>
              <h2>{displayName}</h2>
              <p>@{user.username || form.username}</p>
            </div>
            <button type="button" className="buyer-profile-edit-toggle" onClick={() => { setError(''); setEditing((value) => !value); }}>
              {editing ? 'Close' : 'Edit profile'}
            </button>
          </div>
          <div className="buyer-card-bottom"><span>YOUR SPACE, YOUR PACE</span><span>✳ {edition.toUpperCase()} EDITION</span></div>
        </section>

        {!editing && (
        <section className="buyer-circle" aria-label="Friends and followed shops">
          <div className="buyer-circle-heading">
            <div>
              <span className="buyer-card-kicker">YOUR MERQO CIRCLE</span>
              <h2>Your people. Your places.</h2>
            </div>
            <span className="buyer-circle-total">{friends.length + followedShops.length} connected</span>
          </div>
          <div className="buyer-circle-tabs" role="tablist" aria-label="Choose friends or followed shops">
            <button
              type="button"
              role="tab"
              aria-selected={connectionsTab === 'friends'}
              className={connectionsTab === 'friends' ? 'on' : ''}
              onClick={() => setConnectionsTab('friends')}
            >
              <UserIcon size={15} /> Friends <span>{friends.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={connectionsTab === 'shops'}
              className={connectionsTab === 'shops' ? 'on' : ''}
              onClick={() => setConnectionsTab('shops')}
            >
              <StoreIcon size={15} /> Shops <span>{followedShops.length}</span>
            </button>
          </div>

          <div className="buyer-circle-list" role="tabpanel">
            {connectionsTab === 'friends' && (friends.length ? friends.map((friend) => (
              <button type="button" className="buyer-circle-person" key={friend.id} onClick={() => openChat(friend.id)}>
                <span className={'buyer-circle-avatar' + (friend.profilePicture ? ' has-photo' : '')}>
                  {friend.profilePicture ? <img src={friend.profilePicture} alt="" /> : personInitials(friend)}
                </span>
                <span className="buyer-circle-copy"><b>{fullName(friend)}</b><small>@{friend.username || 'MERQO friend'}</small></span>
                <MessageIcon size={17} />
              </button>
            )) : (
              <div className="buyer-circle-empty">
                <span className="buyer-circle-empty-icon"><UserIcon size={19} /></span>
                <div><b>Your people will show up here</b><p>Add friends to keep good finds and chats close.</p></div>
                <button type="button" onClick={() => go('friends')}>Find friends <ArrowRightIcon size={14} /></button>
              </div>
            ))}

            {connectionsTab === 'shops' && (followedShops.length ? followedShops.map((shop) => {
              const product = PRODUCTS.find((item) => item.seller === shop);
              return (
                <button
                  type="button"
                  className="buyer-circle-person"
                  key={shop}
                  onClick={() => product && go('sellerprofile', { pid: product.id })}
                  disabled={!product}
                >
                  <span className="buyer-circle-avatar shop">{product ? initials(shop) : <StoreIcon size={18} />}</span>
                  <span className="buyer-circle-copy"><b>{shop}</b><small>{product ? `${product.city} · Followed shop` : 'Followed shop'}</small></span>
                  <ArrowRightIcon size={17} />
                </button>
              );
            }) : (
              <div className="buyer-circle-empty">
                <span className="buyer-circle-empty-icon shop"><StoreIcon size={19} /></span>
                <div><b>Your favorite shops belong here</b><p>Follow sellers and their latest finds will be easy to find.</p></div>
                <button type="button" onClick={() => go('feed')}>Explore shops <ArrowRightIcon size={14} /></button>
              </div>
            ))}
          </div>
        </section>
        )}

        {editing && (
          <form className="buyer-profile-editor" onSubmit={save}>
            <div className="buyer-editor-heading">
              <h2>Edit your profile</h2>
              <p>Update your account and delivery details. These details stay private.</p>
            </div>

            <div className="buyer-photo-control">
              <div className={'buyer-glyph' + (form.profilePicture ? ' has-photo' : '')}>
                {form.profilePicture ? <img src={form.profilePicture} alt="Profile preview" /> : <span>{initials(`${form.firstName} ${form.lastName}`)}</span>}
              </div>
              <div>
                <b>Profile picture</b>
                <button type="button" onClick={() => photoInput.current?.click()}><CameraIcon size={15} /> Choose photo</button>
                {form.profilePicture && <button type="button" className="buyer-photo-remove" onClick={() => setForm((current) => ({ ...current, profilePicture: '' }))}>Remove photo</button>}
              </div>
              <input ref={photoInput} type="file" accept="image/*" onChange={choosePhoto} hidden />
            </div>
            {photoError && <p className="buyer-editor-error" role="alert">{photoError}</p>}

            <div className="buyer-editor-grid">
              <label>First name<input value={form.firstName} onChange={setField('firstName')} autoComplete="given-name" required /></label>
              <label>Last name<input value={form.lastName} onChange={setField('lastName')} autoComplete="family-name" required /></label>
            </div>
            <label>Username<input value={form.username} onChange={setField('username')} autoComplete="username" minLength={3} maxLength={24} required /></label>
            <label>Email address<input type="email" value={form.email} onChange={setField('email')} autoComplete="email" required /></label>
            <label>Phone number<input type="tel" inputMode="tel" value={form.phone} onChange={setField('phone')} autoComplete="tel" required /></label>

            <label>Preferred theme
              <select value={form.theme} onChange={setField('theme')}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>

            <div className="buyer-editor-section">
              <h3>Change password</h3>
              <p>Leave these blank if you do not want to change your password.</p>
              <label>Current password<input type="password" value={form.currentPassword} onChange={setField('currentPassword')} autoComplete="current-password" /></label>
              <label>New password<input type="password" value={form.newPassword} onChange={setField('newPassword')} autoComplete="new-password" /></label>
            </div>

            <div className="buyer-editor-section">
              <h3>Delivery details</h3>
              <p>Saved privately and used when you place an order.</p>
              <label>County
                <select value={form.address.county} onChange={setAddressField('county')}>
                  <option value="">Select county</option>
                  {KENYA_COUNTIES.map((county) => <option value={county} key={county}>{county}</option>)}
                </select>
              </label>
              <div className="buyer-editor-grid">
                <label>Town / city<input value={form.address.town} onChange={setAddressField('town')} autoComplete="address-level2" /></label>
                <label>Area / estate<input value={form.address.area} onChange={setAddressField('area')} /></label>
              </div>
              <label>Street, building or landmark<input value={form.address.landmark} onChange={setAddressField('landmark')} /></label>
              <label>Alternative phone (optional)<input type="tel" inputMode="tel" value={form.address.altPhone} onChange={setAddressField('altPhone')} /></label>
              <label>Delivery note (optional)<input value={form.address.notes} onChange={setAddressField('notes')} /></label>
            </div>

            {error && <p className="buyer-editor-error" role="alert">{error}</p>}
            <div className="buyer-editor-actions">
              <button type="button" className="buyer-editor-cancel" onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button type="submit" className="buyer-editor-save" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
            </div>
          </form>
        )}
      </div>
    </React.Fragment>
  );
}
