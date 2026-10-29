/**
 * auth/AuthContext.jsx
 * ---------------------------------------------------------------------------
 * The single place the rest of the app talks to for "who is signed in?".
 *
 *   user          the shared signed-in identity (null = visitor browsing as a guest)
 *   elevatedRole  'seller' | null - which privileged mode is
 *                 currently UNLOCKED. Kept in memory only, so a page refresh,
 *                 switching modes, or 15 idle minutes locks it again.
 *
 * Shared account: signed in once, remembered for 30 days (see authService).
 * Seller: must log in again every time they enter that mode.
 * ---------------------------------------------------------------------------
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  restoreSession, registerUser, signInUser, signOutUser,
  verifyRolePassword, applyForRole, setRoleStatusDemo, updateBuyerProfile,
} from './authService.js';
import { applyThemePreference, getThemePreference } from '../themePreference.js';
import { ROLE_IDLE_MINUTES } from './config.js';
import AuthSheet from '../components/auth/AuthSheet.jsx';
import RoleAccessSheet from '../components/auth/RoleAccessSheet.jsx';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  // Restore the remembered account synchronously so there is no login flash.
  const [user, setUser] = useState(() => restoreSession());
  const [elevatedRole, setElevatedRole] = useState(null);

  // Sign-in / sign-up popup
  const [sheet, setSheet] = useState({ open: false, view: 'signin', reason: '', initialIdentifier: '', notice: '' });
  const afterAuthRef = useRef(null); // action to run once the visitor is signed in

  // Seller password popup
  const [roleSheet, setRoleSheet] = useState({ open: false, role: null, mode: 'login' });
  const afterRoleRef = useRef(null);

  /* ----------------------- visitors -> account ----------------------- */
  /** Opens the sign-in (or sign-up) popup. `afterAuth` runs once they succeed. */
  const promptAuth = useCallback((reason = '', afterAuth = null, view = 'signin', roleIntent = null) => {
    afterAuthRef.current = afterAuth;
    setSheet({ open: true, view, reason, roleIntent, initialIdentifier: '', notice: '' });
  }, []);

  const closeAuth = useCallback(() => {
    afterAuthRef.current = null;
    setSheet((s) => ({ ...s, open: false, initialIdentifier: '', notice: '' }));
  }, []);

  const setSheetView = useCallback((view) => {
    if (view === 'signin' && sheet.roleIntent) {
      afterAuthRef.current = null;
      setSheet((s) => ({ ...s, view, roleIntent: null }));
      return;
    }
    setSheet((s) => ({
      ...s,
      view,
      ...(view === 'signup' ? { initialIdentifier: '', notice: '' } : {}),
    }));
  }, [sheet.roleIntent]);

  /** Guard for account-only actions: runs `action` now if signed in, else asks to sign in first. */
  const requireAuth = useCallback((reason, action) => {
    if (user) { action(); return true; }
    promptAuth(reason, action);
    return false;
  }, [user, promptAuth]);

  const finishAuth = (nextUser, roleIntent = null) => {
    setUser(nextUser);
    if (roleIntent) setElevatedRole(roleIntent);
    setSheet((s) => ({ ...s, open: false, initialIdentifier: '', notice: '' }));
    const pending = afterAuthRef.current;
    afterAuthRef.current = null;
    if (pending) setTimeout(pending, 0); // resume what they were trying to do
  };

  const signUp = async (form) => {
    const nextUser = await registerUser(form);
    if (!form.roleChoices?.seller?.on) {
      setSheet((s) => ({
        ...s,
        open: true,
        view: 'signin',
        roleIntent: null,
        initialIdentifier: form.email || form.phone,
        notice: 'Your account is ready. Sign in using the email or phone you registered with.',
      }));
      return;
    }
    if (form.accountIntent === 'seller') afterAuthRef.current = null;
    finishAuth(nextUser);
  };
  const signIn = async (identifier, password) => finishAuth(await signInUser(identifier, password));

  const signOut = async () => {
    await signOutUser();
    setElevatedRole(null);
    setUser(null);
  };

  const saveBuyerProfile = async (profile) => {
    if (!user) throw new Error('Please sign in again to update your profile.');
    setUser(await updateBuyerProfile(user.id, profile));
  };

  useEffect(() => {
    applyThemePreference(user?.theme || getThemePreference());
  }, [user?.id, user?.theme]);

  /* ----------------------- seller unlocking ----------------------- */
  /** Opens the "log in to Seller mode" popup (or the "apply" popup if they never applied). */
  const openRoleAccess = useCallback((role, onDone) => {
    afterRoleRef.current = onDone || null;
    setRoleSheet({ open: true, role, mode: user?.roles?.[role] ? 'login' : 'apply' });
  }, [user]);

  const closeRoleAccess = useCallback(() => {
    afterRoleRef.current = null;
    setRoleSheet((s) => ({ ...s, open: false }));
  }, []);

  const finishRole = (role, nextUser) => {
    setUser(nextUser);
    setElevatedRole(role); // unlock ONLY this role (the other one stays locked)
    setRoleSheet((s) => ({ ...s, open: false }));
    const done = afterRoleRef.current;
    afterRoleRef.current = null;
    if (done) setTimeout(done, 0);
  };

  const unlockRole = async (role, password) => finishRole(role, await verifyRolePassword(user.id, role, password));
  const applyRole = async (role, choice, accountPassword) =>
    finishRole(role, await applyForRole(user.id, role, choice, accountPassword));
  const lockRole = useCallback(() => setElevatedRole(null), []);

  /** DEMO ONLY - see authService.setRoleStatusDemo. */
  const simulateApproval = async (role) => setUser(await setRoleStatusDemo(user.id, role, 'approved'));

  // Auto-lock a privileged mode after ROLE_IDLE_MINUTES without taps/keys.
  useEffect(() => {
    if (!elevatedRole) return undefined;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    const timer = setInterval(() => {
      if (Date.now() - last > ROLE_IDLE_MINUTES * 60000) setElevatedRole(null);
    }, 15000);
    return () => {
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
      clearInterval(timer);
    };
  }, [elevatedRole]);

  const value = {
    user, elevatedRole, saveBuyerProfile,
    sheet, promptAuth, closeAuth, setSheetView, requireAuth, signUp, signIn, signOut,
    roleSheet, openRoleAccess, closeRoleAccess, unlockRole, applyRole, lockRole, simulateApproval,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthSheet />
      <RoleAccessSheet />
    </AuthContext.Provider>
  );
}
