/**
 * components/auth/RoleBusinessFields.jsx
 * The verification details a seller needs (business name, National ID, KRA PIN, phone).
 * Shown inside the sign-up wizard when a seller workspace is selected.
 */
import React from 'react';
import { Field } from './FormFields.jsx';
import { ROLE_LABEL } from '../../auth/config.js';
import SellerDocumentFields from './SellerDocumentFields.jsx';

export default function RoleBusinessFields({ role, value, onChange, errors = {} }) {
  const biz = value || {};
  const set = (key) => (e) => onChange({ ...biz, [key]: e.target.value });
  return (
    <div className="rcc">
      <div className="rcc-title">{ROLE_LABEL[role]} details</div>
      <Field label="Business name" error={errors.name}>
        <input className="ai" value={biz.name || ''} onChange={set('name')} placeholder="e.g. Urban Kicks Kenya" />
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
      <SellerDocumentFields
        value={biz}
        errors={errors}
        onChange={(key, file) => onChange({ ...biz, [key]: file })}
      />
    </div>
  );
}
