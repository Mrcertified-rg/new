/**
 * components/auth/FormFields.jsx
 * Small reusable form pieces shared by every sign-in / sign-up form,
 * so all fields look and behave the same.
 */
import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../ui/Icons.jsx';

/** Label + input + hint/error text. Wrap any <input>/<select> in it. */
export function Field({ label, error, hint, optional, children }) {
  return (
    <label className="af">
      <span className="af-label">{label}{optional && <em> optional</em>}</span>
      {children}
      {error ? <small className="af-error" role="alert">{error}</small> : hint ? <small className="af-hint">{hint}</small> : null}
    </label>
  );
}

/** Password input with a show/hide eye button. */
export function PasswordField({ label = 'Password', value, onChange, error, hint, autoComplete = 'current-password', placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      <div className="af-pw">
        <input
          className="ai"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button type="button" className="af-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
    </Field>
  );
}

/** Red box for form-level errors (wrong password, lockout, ...). */
export function FormError({ children }) {
  return children ? <div className="af-banner" role="alert">{children}</div> : null;
}
