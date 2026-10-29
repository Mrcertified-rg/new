import React from 'react';
import { HomeIcon, VideoIcon, MessageIcon, CartIcon, UserIcon } from '../ui/Icons.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';

const TABS = [
  { screen: 'feed', label: 'Home', Icon: HomeIcon },
  { screen: 'reels', label: 'Reels', Icon: VideoIcon },
  { screen: 'friends', label: 'Messages', Icon: MessageIcon },
  { screen: 'cart', label: 'Cart', Icon: CartIcon },
  { screen: 'buyerprofile', label: 'Profile', Icon: UserIcon },
];

export default function BuyerNav({ screen, go, goHome, cartCount = 0 }) {
  const { user } = useAuth();
  return (
    <nav className="buyer-nav" aria-label="Main navigation">
      {TABS.map(({ screen: target, label, Icon }) => (
        <button
          type="button"
          key={target}
          className={screen === target ? 'on' : ''}
          aria-current={screen === target ? 'page' : undefined}
          onClick={() => target === 'feed' && goHome ? goHome() : go(target)}
        >
          {target === 'buyerprofile' && user?.profilePicture
            ? <img className="buyer-nav-avatar" src={user.profilePicture} alt="" />
            : <Icon size={20} />}
          {target === 'cart' && cartCount > 0 && <span className="buyer-nav-count">{cartCount}</span>}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
