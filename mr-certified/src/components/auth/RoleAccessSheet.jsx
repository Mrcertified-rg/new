/**
 * components/auth/RoleAccessSheet.jsx
 * The "log in again" popup shown every time someone switches into Seller mode.
 *   mode "login": they already hold the role -> enter its password.
 *   mode "apply": they never applied -> choose a login, confirm account
 *                 password, and the application is saved as PENDING.
 * The buyer session underneath is never touched.
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ROLE_LABEL, STATUS_LABEL } from '../../auth/config.js';
import { passwordProblem } from '../../auth/validators.js';
import { PasswordField, FormError } from './FormFields.jsx';
import RoleCredentialChoice from './RoleCredentialChoice.jsx';
import { CloseIcon, LockIcon, StoreIcon } from '../ui/Icons.jsx';

export default function RoleAccessSheet() {
  const { user, roleSheet, closeRoleAccess, unlockRole, applyRole } = useAuth();
  const [password, setPassword] = useState('');
  const [choice, setChoice] = useState({ on: true, mode: 'same', password: '' });
  const [error, setError] = useState('');
  const [errs, setErrs] = useState({ pw: '', role: '' }); // pw = password field, role = separate role password
  const [busy, setBusy] = useState(false);

  // Start every time the popup opens with a clean form.
  useEffect(() => {
    if (roleSheet.open) {
      setPassword(''); setChoice({ on: true, mode: 'same', password: '' });
      setError(''); setErrs({ pw: '', role: '' }); setBusy(false);
    }
  }, [roleSheet.open, roleSheet.role, roleSheet.mode]);

  useEffect(() => {
    if (!roleSheet.open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeRoleAccess(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [roleSheet.open, closeRoleAccess]);

  if (!roleSheet.open || !user) return null;

  const { role, mode } = roleSheet;
  const label = ROLE_LABEL[role];
  const Icon = StoreIcon;
  const status = user.roles[role]?.status;
  const separate = user.roles[role]?.credentialMode === 'separate';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const found = { pw: '', role: '' };
    if (!password) found.pw = 'Enter your password.';
    if (mode === 'apply' && choice.mode === 'separate') found.role = passwordProblem(choice.password);
    setErrs(found);
    if (found.pw || found.role) return;
    setBusy(true);
    try {
      if (mode === 'login') await unlockRole(role, password);
      else await applyRole(role, choice, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-wrap auth-wrap" onClick={(e) => { if (e.target === e.currentTarget) closeRoleAccess(); }}>
      <div className="modal auth-sheet" role="dialog" aria-modal="true" aria-label={`${label} login`}>
        <div className="auth-head">
          <div className="ras-title">
            <span className="rp-ic"><Icon size={20} /></span>
            <div>
              <h2>{mode === 'login' ? `${label} login` : `Become a ${label}`}</h2>
              <p>
                {mode === 'login'
                  ? `Log in again to enter ${label} mode. Your buyer session stays signed in.`
                  : `Applications start as "${STATUS_LABEL.pending}". Confirm it's you to continue.`}
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={closeRoleAccess} aria-label="Close"><CloseIcon size={18} /></button>
        </div>

        <form className="af-form" onSubmit={submit} noValidate>
          <FormError>{error}</FormError>

          {mode === 'login' && (
            <div className="ras-who"><LockIcon size={16} /><span>{user.firstName} {user.lastName} · {user.email}</span></div>
          )}

          {mode === 'apply' && (
            <RoleCredentialChoice
              role={role}
              value={choice}
              onChange={setChoice}
              error={errs.role}
            />
          )}

          <PasswordField
            label={mode === 'login' ? (separate ? `${label} password` : 'Account password') : 'Confirm account password'}
            value={password}
            onChange={setPassword}
            error={errs.pw}
          />

          {mode === 'login' && status === 'pending' && (
            <p className="af-note">Your {label.toLowerCase()} application is still pending review, so selling and payouts stay locked.</p>
          )}

          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Checking…' : mode === 'login' ? `Enter ${label} mode` : 'Apply and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
