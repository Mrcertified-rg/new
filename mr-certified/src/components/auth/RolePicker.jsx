/**
 * components/auth/RolePicker.jsx
 * Role setup step: choose a seller workspace on the shared login.
 * Delivery details are independent from workspace selection.
 */
import React from 'react';
import { BagIcon, StoreIcon, CheckIcon } from '../ui/Icons.jsx';
import RoleCredentialChoice from './RoleCredentialChoice.jsx';
import RoleBusinessFields from './RoleBusinessFields.jsx';

const OPTIONS = [
  { id: 'seller', label: 'Seller', icon: StoreIcon, text: 'List products and run your store.' },
];

export default function RolePicker({ choices, onChange, errors, roleIntent = null }) {
  const update = (role, patch) => onChange({ ...choices, [role]: { ...choices[role], ...patch } });

  return (
    <div className="rp">
      {/* A shared login can use buyer and seller workspaces without requiring buyer setup first. */}
      <div className="rp-card on locked">
        <span className="rp-ic"><BagIcon size={20} /></span>
        <div><b>Buyer workspace</b><small>Available with this login; delivery setup can be done later.</small></div>
        <span className="rp-check"><CheckIcon size={16} /></span>
      </div>

      {OPTIONS.map(({ id, label, icon: Ico, text }) => {
        const c = choices[id];
        return (
          <div key={id} className={'rp-block' + (c.on ? ' open' : '')}>
            <button type="button" role="switch" aria-checked={c.on} disabled={roleIntent === id} className={'rp-card' + (c.on ? ' on' : '')} onClick={() => update(id, { on: !c.on })}>
              <span className="rp-ic"><Ico size={20} /></span>
              <div><b>{label}</b><small>{text}</small></div>
              <span className="rp-check">{c.on && <CheckIcon size={16} />}</span>
            </button>
            {c.on && <RoleCredentialChoice role={id} value={c} onChange={(v) => update(id, v)} error={errors[id]} />}
            {c.on && <RoleBusinessFields role={id} value={c.biz} onChange={(biz) => update(id, { biz })} errors={errors[id + 'Biz']} />}
          </div>
        );
      })}

      <p className="af-note">Your seller workspace starts as <b>pending review</b>. This shared login can also be used for shopping.</p>
    </div>
  );
}