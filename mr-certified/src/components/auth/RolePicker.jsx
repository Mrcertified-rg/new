/**
 * components/auth/RolePicker.jsx
 * Role setup step: choose a seller workspace on the shared login.
 * Seller-intent signup does not silently add Buyer access.
 */
import React from 'react';
import { BagIcon, StoreIcon, CheckIcon } from '../ui/Icons.jsx';
import RoleBusinessFields from './RoleBusinessFields.jsx';

const OPTIONS = [
  { id: 'seller', label: 'Seller', icon: StoreIcon, text: 'List products and run your store.' },
];

export default function RolePicker({ choices, onChange, errors, roleIntent = null }) {
  const update = (role, patch) => onChange({ ...choices, [role]: { ...choices[role], ...patch } });

  return (
    <div className="rp">
      {roleIntent !== 'seller' && (
        <div className="rp-card on locked">
          <span className="rp-ic"><BagIcon size={20} /></span>
          <div><b>Buyer workspace</b><small>Included with this account; delivery setup can be done later.</small></div>
          <span className="rp-check"><CheckIcon size={16} /></span>
        </div>
      )}

      {OPTIONS.map(({ id, label, icon: Ico, text }) => {
        const c = choices[id];
        return (
          <div key={id} className={'rp-block' + (c.on ? ' open' : '')}>
            <button type="button" role="switch" aria-checked={c.on} disabled={roleIntent === id} className={'rp-card' + (c.on ? ' on' : '')} onClick={() => update(id, { on: !c.on })}>
              <span className="rp-ic"><Ico size={20} /></span>
              <div><b>{label}</b><small>{text}</small></div>
              <span className="rp-check">{c.on && <CheckIcon size={16} />}</span>
            </button>
            {c.on && <RoleBusinessFields role={id} value={c.biz} onChange={(biz) => update(id, { biz })} errors={errors[id + 'Biz']} />}
          </div>
        );
      })}

      <p className="af-note">
        {roleIntent === 'seller'
          ? <>Your seller workspace starts as <b>pending review</b>. This signup creates seller access only; it will not create a buyer workspace.</>
          : choices.seller.on
            ? <>Your seller workspace starts as <b>pending review</b>. This shared login can also be used for shopping.</>
            : 'Buyer access is included with this account. You can add a seller workspace here if needed.'}
      </p>
    </div>
  );
}