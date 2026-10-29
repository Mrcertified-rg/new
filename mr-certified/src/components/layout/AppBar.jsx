/**
 * components/layout/AppBar.jsx
 * Slim top bar that replaces the old bottom tab bar on every inner screen:
 *   back arrow  |  active mode (+ status)  |  account menu
 */
import React from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import AccountMenu from './AccountMenu.jsx';
import { ArrowLeftIcon, ReceiptIcon } from '../ui/Icons.jsx';

const PAGE_TITLES = {
  feed: 'Home',
  reels: 'Reels',
  cart: 'Cart',
  orders: 'Orders',
  friends: 'Messages',
  chat: 'Chat',
  dm: 'Product chat',
  buyerprofile: 'Profile',
  sellerprofile: 'Store',
  dash: 'Dashboard',
  sellerproducts: 'Products',
  sellerorders: 'Orders',
  customers: 'Customers',
  records: 'Records',
  marketing: 'Marketing',
  ai: 'Certified AI',
  sellerprofilepage: 'Profile',
  inbox: 'Inbox',
  mfeed: 'Discover',
  mypromos: 'My promotions',
};

export default function AppBar({ go, onBack, mode, screen, cartCount, onSwitchMode }) {
  const { user } = useAuth();
  const initials = user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : '';

  return (
    <div className={'appbar' + (screen === 'friends' ? ' friends-appbar' : '')}>
      <button type="button" className="icon-btn appbar-back" onClick={onBack} aria-label="Go back" title="Go back"><ArrowLeftIcon size={21} /></button>
      <div className="appbar-mode">{PAGE_TITLES[screen] || 'Home'}</div>
      {screen === 'cart'
        ? <button type="button" className="icon-btn" onClick={() => go('orders')} aria-label="View order history" title="Order history"><ReceiptIcon size={19} /></button>
        : screen === 'friends'
          ? <span className={'icon-btn avatar-btn' + (user?.profilePicture ? ' has-photo' : '')} aria-label="Profile picture">
            {user?.profilePicture
              ? <img className="account-profile-picture" src={user.profilePicture} alt="" />
              : <span className="avatar-initials">{initials}</span>}
          </span>
        : <AccountMenu go={go} mode={mode} onSwitchMode={onSwitchMode} cartCount={cartCount} />}
    </div>
  );
}
