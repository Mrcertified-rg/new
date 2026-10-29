/**
 * components/auth/RoleCredentialChoice.jsx
 * "Same password" vs "Different password" picker for Seller mode.
 * Used by the sign-up wizard and by the "apply for a role" popup.
 */
import React from 'react';
import { PasswordField } from './FormFields.jsx';
import { ROLE_LABEL } from '../../auth/config.js';

export default function RoleCredentialChoice({ role, value, onChange, error }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="rcc">
      <div className="rcc-title">Log in to {ROLE_LABEL[role]} mode with</div>
      <div className="seg" role="radiogroup" aria-label={`${ROLE_LABEL[role]} login`}>
        <button type="button" role="radio" aria-checked={value.mode === 'same'} className={value.mode === 'same' ? 'on' : ''} onClick={() => set({ mode: 'same' })}>
          My account password
        </button>
        <button type="button" role="radio" aria-checked={value.mode === 'separate'} className={value.mode === 'separate' ? 'on' : ''} onClick={() => set({ mode: 'separate' })}>
          A different password
        </button>
      </div>
      {value.mode === 'separate' && (
        <PasswordField
          label={`${ROLE_LABEL[role]} password`}
          value={value.password}
          onChange={(password) => set({ password })}
          error={error}
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
        />
      )}
    </div>
  );
}
