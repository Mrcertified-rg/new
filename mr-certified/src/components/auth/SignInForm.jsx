/**
 * components/auth/SignInForm.jsx
 * Email-or-phone + password sign-in for returning buyers.
 */
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { parseIdentifier } from '../../auth/validators.js';
import { Field, PasswordField, FormError } from './FormFields.jsx';

export default function SignInForm({ initialIdentifier = '' }) {
  const { signIn, setSheetView } = useAuth();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!parseIdentifier(identifier)) next.identifier = 'Enter a valid email or phone number.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signIn(identifier, password); // closes the sheet + resumes the blocked action
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="af-form" onSubmit={submit} noValidate>
      <FormError>{formError}</FormError>
      <Field label="Email or phone" error={errors.identifier}>
        <input
          className="ai"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          inputMode="email"
          placeholder="you@email.com or 0712 345 678"
        />
      </Field>
      <PasswordField value={password} onChange={setPassword} error={errors.password} />

      <button type="button" className="af-link" onClick={() => setShowReset((s) => !s)}>Forgot password?</button>
      {showReset && (
        <p className="af-note">
          Password reset needs an email or SMS service, which isn't connected in this demo yet.
        </p>
      )}

      <button type="submit" className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="af-switch">
        New here? <button type="button" className="af-link" onClick={() => setSheetView('signup')}>Create an account</button>
      </p>
    </form>
  );
}
