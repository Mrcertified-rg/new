/**
 * components/auth/RoleBusinessFields.jsx
 * The verification details a Seller / Marketer needs (name, National ID, KRA PIN, phone).
 * Shown inside the sign-up wizard as soon as a role is ticked, so every role is set up in one go.
 */
import React from 'react';
import { Field } from './FormFields.jsx';
import { ROLE_LABEL } from '../../auth/config.js';

export default function RoleBusinessFields({ role, value, onChange, errors = {} }) {
  const biz = value || {};
  const set = (key) => (e) => onChange({ ...biz, [key]: e.target.value });
  const isMarketer = role === 'marketer';
  return (
    <div className="rcc">
      <div className="rcc-title">{ROLE_LABEL[role]} details</div>
      <Field label={isMarketer ? 'Marketer name' : 'Business name'} error={errors.name}>
        <input className="ai" value={biz.name || ''} onChange={set('name')} placeholder={isMarketer ? 'e.g. Brian_K' : 'e.g. Urban Kicks Kenya'} />
      </Field>
      <Field label="National ID number" error={errors.id}>
        <input className="ai" value={biz.id || ''} onChange={set('id')} inputMode="numeric" placeholder="e.g. 34567890" />
      </Field>
      <Field label="KRA PIN" error={errors.kra}>
        <input className="ai" value={biz.kra || ''} onChange={set('kra')} autoCapitalize="characters" placeholder="e.g. A012345678B" />
      </Field>
      <Field label="Phone number" error={errors.phone}>
        <input className="ai" value={biz.phone || ''} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="e.g. 0712 345 678" />
      </Field>
      <small className="af-hint">ID and KRA PIN are used only to verify identity and tax status. This is a prototype, so no documents are actually checked.</small>
    </div>
  );
}
