/**
 * components/layout/AppBar.jsx
 * Slim top bar that replaces the old bottom tab bar on every inner screen:
 *   back arrow  |  active mode (+ status)  |  account menu
 */
import React from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ROLE_LABEL, STATUS_LABEL } from '../../auth/config.js';
import AccountMenu from './AccountMenu.jsx';
import { ArrowLeftIcon, ReceiptIcon } from '../ui/Icons.jsx';

export default function AppBar({ go, onBack, mode, screen, cartCount, onSwitchMode }) {
  const { user } = useAuth();
  const status = user?.roles?.[mode]?.status;
  const unverified = mode !== 'buyer' && status && status !== 'approved';

  return (
    <div className="appbar">
      <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><ArrowLeftIcon size={19} /></button>
      <div className={'appbar-mode' + (unverified ? ' warn' : '')}>
        <span className="dot" />
        {ROLE_LABEL[mode]} mode{unverified ? ` · ${STATUS_LABEL[status]}` : ''}
      </div>
      {screen === 'cart'
        ? <button type="button" className="icon-btn" onClick={() => go('orders')} aria-label="View order history" title="Order history"><ReceiptIcon size={19} /></button>
        : <AccountMenu go={go} mode={mode} onSwitchMode={onSwitchMode} cartCount={cartCount} />}
    </div>
  );
}
