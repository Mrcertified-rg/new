import React from 'react';
import { HomeIcon, VideoIcon, MessageIcon, UserIcon } from '../ui/Icons.jsx';

const TABS = [
  { screen: 'feed', label: 'Home', Icon: HomeIcon },
  { screen: 'reels', label: 'Reels', Icon: VideoIcon },
  { screen: 'friends', label: 'Messages', Icon: MessageIcon },
  { screen: 'buyerprofile', label: 'Profile', Icon: UserIcon },
];

export default function BuyerNav({ screen, go }) {
  return (
    <nav className="buyer-nav" aria-label="Main navigation">
      {TABS.map(({ screen: target, label, Icon }) => (
        <button
          type="button"
          key={target}
          className={screen === target ? 'on' : ''}
          aria-current={screen === target ? 'page' : undefined}
          onClick={() => go(target)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
