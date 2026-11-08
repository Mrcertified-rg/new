/**
 * components/auth/RoleStatusBanner.jsx
 * Shown at the top of Seller screens until the role is APPROVED.
 * Approval can only be granted from the administrator console.
 */
import React from 'react';
import { ShieldIcon } from '../ui/Icons.jsx';
import { ROLE_LABEL, STATUS_LABEL } from '../../auth/config.js';

export default function RoleStatusBanner({ role, status }) {
  if (!role || !status || status === 'approved') return null;
  const label = ROLE_LABEL[role];
  const copy = {
    pending: `Publishing and payouts stay locked until an administrator approves your ${label.toLowerCase()} account.`,
    rejected: 'Your application was rejected. Contact support to appeal.',
    suspended: 'Your access is suspended. Contact support.',
  }[status];

  return (
    <div className={'rsb ' + status} role="status">
      <ShieldIcon size={18} />
      <div>
        <b>{label} · {STATUS_LABEL[status]}</b>
        <span>{copy}</span>
      </div>
    </div>
  );
}
