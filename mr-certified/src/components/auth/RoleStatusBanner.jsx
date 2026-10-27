/**
 * components/auth/RoleStatusBanner.jsx
 * Shown at the top of Seller / Marketer screens until the role is APPROVED,
 * so an unverified seller is never presented as verified.
 */
import React from 'react';
import { ShieldIcon } from '../ui/Icons.jsx';
import { DEMO_MODE, ROLE_LABEL, STATUS_LABEL } from '../../auth/config.js';

export default function RoleStatusBanner({ role, status, onSimulate }) {
  if (!role || !status || status === 'approved') return null;
  const label = ROLE_LABEL[role];
  const copy = {
    pending: `Publishing, promotions and payouts stay locked until an administrator approves your ${label.toLowerCase()} account.`,
    rejected: 'Your application was rejected. Contact support to appeal.',
    suspended: 'Your access is suspended. Contact support.',
  }[status];

  return (
    <div className={'rsb ' + status} role="status">
      <ShieldIcon size={18} />
      <div>
        <b>{label} · {STATUS_LABEL[status]}</b>
        <span>{copy}</span>
        {DEMO_MODE && status === 'pending' && (
          <button type="button" className="rsb-demo" onClick={onSimulate}>Demo only: simulate admin approval</button>
        )}
      </div>
    </div>
  );
}
