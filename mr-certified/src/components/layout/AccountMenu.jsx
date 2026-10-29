/**
 * components/layout/AccountMenu.jsx
 * The person icon dropdown used on every screen (feed + AppBar).
 *   - Visitors: "Sign in" / "Create account".
 *   - Signed in: pages for the ACTIVE mode, a "Switch mode" list, Sign out.
 * Switching to Seller is handled by App (it asks for the role login).
 */
import React, { useEffect, useState } from 'react';
import Popover from '../ui/Popover.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ROLE_LABEL, STATUS_LABEL } from '../../auth/config.js';
import { MENU_BY_MODE, MODE_OPTIONS } from './menuConfig.js';
import { countIncoming, unreadTotal } from '../../social/socialService.js';
import {
  UserIcon, CheckIcon, LockIcon, LogOutIcon, HomeIcon, PackageIcon, CartIcon, GridIcon,
  ReceiptIcon, MegaphoneIcon, MessageIcon, SparkIcon, SettingsIcon, StoreIcon, BagIcon,
} from '../ui/Icons.jsx';

const ICONS = {
  home: HomeIcon, user: UserIcon, orders: PackageIcon, cart: CartIcon, grid: GridIcon, box: PackageIcon,
  records: ReceiptIcon, megaphone: MegaphoneIcon, inbox: MessageIcon, ai: SparkIcon, settings: SettingsIcon,
  store: StoreIcon, bag: BagIcon,
};

function useSocialBadge(user) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) { setCount(0); return undefined; }
    const refresh = () => setCount(countIncoming(user.id) + unreadTotal(user.id));
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [user && user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return count;
}

/** Small grey line under each mode in the switch list. */
function modeSub(role, user) {
  if (role === 'buyer') return 'Browse and shop';
  const status = user.roles[role]?.status;
  if (!status) return 'Apply to join';
  if (status === 'approved') return 'Log in to enter';
  if (status === 'pending') return 'Pending review · log in to enter';
  return STATUS_LABEL[status]; // rejected / suspended
}

export default function AccountMenu({ go, mode = 'buyer', onSwitchMode, cartCount = 0 }) {
  const { user, signOut, promptAuth } = useAuth();
  const socialCount = useSocialBadge(user);
  const initials = user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : '';
  const roleStatus = user?.roles?.[mode]?.status;

  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button type="button" className={'icon-btn avatar-btn' + (open ? ' on' : '') + (user?.profilePicture ? ' has-photo' : '')} onClick={toggle} aria-label="Account menu" aria-expanded={open}>
          {user?.profilePicture
            ? <img className="account-profile-picture" src={user.profilePicture} alt="" />
            : user ? <span className="avatar-initials">{initials}</span> : <UserIcon size={19} />}
        </button>
      )}
    >
      {({ close }) => (
        <React.Fragment>
          {!user ? (
            /* ---------- visitor ---------- */
            <React.Fragment>
              <div className="menu-head">
                <span className="menu-avatar"><UserIcon size={18} /></span>
                <div><b>Browsing as guest</b><span>Create an account to save, message and buy</span></div>
              </div>
              <div className="menu-sep" />
              <button type="button" className="menu-item" onClick={() => { close(); promptAuth('', null, 'signin'); }}>
                <LockIcon size={17} /><span>Sign in</span>
              </button>
              <button type="button" className="menu-item" onClick={() => { close(); promptAuth('', null, 'signup'); }}>
                <UserIcon size={17} /><span>Create account<small className="mi-sub">Buyer or seller</small></span>
              </button>
            </React.Fragment>
          ) : (
            /* ---------- signed in ---------- */
            <React.Fragment>
              <div className="menu-head">
                <span className={'menu-avatar' + (user.profilePicture ? ' has-photo' : '')}>
                  {user.profilePicture ? <img src={user.profilePicture} alt="" /> : initials}
                </span>
                <div>
                  <b>{user.firstName} {user.lastName}</b>
                  <span>{ROLE_LABEL[mode]} mode{mode !== 'buyer' && roleStatus && roleStatus !== 'approved' ? ' · ' + STATUS_LABEL[roleStatus] : ''}</span>
                </div>
              </div>
              <div className="menu-sep" />
              {MENU_BY_MODE[mode].map((item) => {
                const Ico = ICONS[item.icon];
                return (
                  <button type="button" key={item.screen} className="menu-item" onClick={() => { close(); go(item.screen); }}>
                    <Ico size={17} /><span>{item.label}</span>
                    {item.badge === 'cart' && cartCount > 0 && <span className="menu-count">{cartCount}</span>}
                    {item.badge === 'social' && socialCount > 0 && <span className="menu-count">{socialCount}</span>}
                  </button>
                );
              })}
              <div className="menu-sep" />
              <div className="menu-label">SWITCH MODE</div>
              {MODE_OPTIONS.map((m) => {
                const Ico = ICONS[m.icon];
                const status = user.roles[m.id]?.status;
                const blocked = status === 'rejected' || status === 'suspended';
                return (
                  <button
                    type="button"
                    key={m.id}
                    disabled={blocked}
                    className={'menu-item' + (m.id === mode ? ' on' : '')}
                    onClick={() => { close(); if (m.id !== mode) onSwitchMode(m.id); }}
                  >
                    <Ico size={17} />
                    <span>{m.label}<small className="mi-sub">{modeSub(m.id, user)}</small></span>
                    {m.id === mode ? <CheckIcon size={16} className="mi-check" /> : m.id !== 'buyer' && <LockIcon size={14} className="mi-check dim" />}
                  </button>
                );
              })}
              <div className="menu-sep" />
              <button type="button" className="menu-item" onClick={async () => { close(); await signOut(); }}>
                <LogOutIcon size={17} /><span>Sign out</span>
              </button>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </Popover>
  );
}
