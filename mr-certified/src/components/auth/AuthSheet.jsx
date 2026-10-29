/**
 * components/auth/AuthSheet.jsx
 * The sign-in / create-account popup. Visitors can browse freely; this opens
 * only when they try something that needs an account (like, message, buy...).
 */
import React, { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import SignInForm from './SignInForm.jsx';
import SignUpForm from './SignUpForm.jsx';
import { CloseIcon } from '../ui/Icons.jsx';

export default function AuthSheet() {
  const { sheet, closeAuth } = useAuth();

  // Escape closes the popup.
  useEffect(() => {
    if (!sheet.open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeAuth(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet.open, closeAuth]);

  if (!sheet.open) return null;
  const signup = sheet.view === 'signup';

  return (
    <div className="modal-wrap auth-wrap" onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="modal auth-sheet" role="dialog" aria-modal="true" aria-label={signup ? 'Create account' : 'Sign in'}>
        <div className="auth-head">
          <div>
            <h2>{signup ? sheet.roleIntent === 'seller' ? 'Create your seller account' : 'Create your account' : 'Welcome back'}</h2>
            <p>
              {sheet.notice
                ? sheet.notice
                : sheet.reason
                ? `To ${sheet.reason}, you need an account.`
                : signup
                  ? sheet.roleIntent === 'seller'
                    ? 'Set up your shared login and seller workspace directly.'
                    : 'Takes about a minute. You can keep browsing without one.'
                  : 'Sign in to continue.'}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={closeAuth} aria-label="Close"><CloseIcon size={18} /></button>
        </div>
        {signup ? <SignUpForm roleIntent={sheet.roleIntent} /> : <SignInForm initialIdentifier={sheet.initialIdentifier} />}
      </div>
    </div>
  );
}
