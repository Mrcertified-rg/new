/**
 * components/auth/RolePicker.jsx
 * Step 3 of sign-up: "How will you use MR Certified?"
 * Buyer is always on. Seller and Marketer are optional switches; each one
 * reveals its own login choice (same / different password).
 */
import React from 'react';
import { BagIcon, StoreIcon, MegaphoneIcon, CheckIcon } from '../ui/Icons.jsx';
import RoleCredentialChoice from './RoleCredentialChoice.jsx';
import RoleBusinessFields from './RoleBusinessFields.jsx';

const OPTIONS = [
  { id: 'seller', label: 'Seller', icon: StoreIcon, text: 'List products and run your store.' },
  { id: 'marketer', label: 'Marketer', icon: MegaphoneIcon, text: 'Promote products and earn commission.' },
];

export default function RolePicker({ choices, onChange, errors }) {
  const update = (role, patch) => onChange({ ...choices, [role]: { ...choices[role], ...patch } });

  return (
    <div className="rp">
      {/* Buyer is automatic - shown as a locked card so it is clear it's included */}
      <div className="rp-card on locked">
        <span className="rp-ic"><BagIcon size={20} /></span>
        <div><b>Buyer</b><small>Shop, save and order. Included for everyone.</small></div>
        <span className="rp-check"><CheckIcon size={16} /></span>
      </div>

      {OPTIONS.map(({ id, label, icon: Ico, text }) => {
        const c = choices[id];
        return (
          <div key={id} className={'rp-block' + (c.on ? ' open' : '')}>
            <button type="button" role="switch" aria-checked={c.on} className={'rp-card' + (c.on ? ' on' : '')} onClick={() => update(id, { on: !c.on })}>
              <span className="rp-ic"><Ico size={20} /></span>
              <div><b>{label}</b><small>{text}</small></div>
              <span className="rp-check">{c.on && <CheckIcon size={16} />}</span>
            </button>
            {c.on && <RoleCredentialChoice role={id} value={c} onChange={(v) => update(id, v)} error={errors[id]} />}
            {c.on && <RoleBusinessFields role={id} value={c.biz} onChange={(biz) => update(id, { biz })} errors={errors[id + 'Biz']} />}
          </div>
        );
      })}

      <p className="af-note">
        Seller and Marketer accounts start as <b>pending review</b>. You'll log in again each time you switch into those modes.
      </p>
    </div>
  );
}