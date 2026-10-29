/**
 * components/auth/SignUpForm.jsx
 * Three short steps so nobody faces one giant form:
 *   1. About you   (name, phone, email, password)
 *   2. Delivery    (county, town, area, landmark ...)
 *   3. Your role   (buyer / seller / marketer)
 * Creating the account signs the buyer in right away and keeps them signed in.
 */
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { KENYA_COUNTIES, KENYA_SUB_COUNTIES } from '../../auth/config.js';
import { validateAccountStep, validateDeliveryStep, validateRoleChoices } from '../../auth/validators.js';
import { Field, PasswordField, FormError } from './FormFields.jsx';
import RolePicker from './RolePicker.jsx';
import { ArrowLeftIcon } from '../ui/Icons.jsx';

const STEP_TITLES = ['Buyer basics', 'Delivery details (optional)', 'Your MERQO roles'];

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', email: '', password: '',
  county: '', town: '', area: '', landmark: '', altPhone: '', notes: '',
};
const EMPTY_BIZ = { name: '', id: '', kra: '', phone: '' };
const EMPTY_CHOICE = { on: false, mode: 'same', password: '', biz: EMPTY_BIZ };

export default function SignUpForm() {
  const { signUp, setSheetView } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [choices, setChoices] = useState({ seller: EMPTY_CHOICE, marketer: EMPTY_CHOICE });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({
    ...f,
    [key]: e.target.value,
    ...(key === 'county' ? { town: '' } : {}),
  }));

  const next = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate only the step being shown.
    const found = step === 0 ? validateAccountStep(form) : step === 1 ? validateDeliveryStep(form) : validateRoleChoices(choices);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step < 2) { setStep(step + 1); return; }

    // Last step -> create the account.
    setBusy(true);
    try {
      await signUp({
        firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email, password: form.password,
        address: { county: form.county, town: form.town, area: form.area, landmark: form.landmark, altPhone: form.altPhone, notes: form.notes },
        roleChoices: choices,
      });
    } catch (err) {
      setFormError(err.message);
      if (err.code === 'exists') setStep(0);
      setBusy(false);
    }
  };

  return (
    <form className="af-form" onSubmit={next} noValidate>
      <div className="steps" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}
      </div>
      <h3 className="af-step">{STEP_TITLES[step]}</h3>
      <FormError>{formError}</FormError>

      {step === 0 && (
        <React.Fragment>
          <div className="af-two">
            <Field label="First name" error={errors.firstName}>
              <input className="ai" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input className="ai" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Phone number" error={errors.phone} hint="Used for delivery calls and sign-in.">
            <input className="ai" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="0712 345 678" />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className="ai" value={form.email} onChange={set('email')} autoComplete="email" inputMode="email" placeholder="you@email.com" />
          </Field>
          <PasswordField
            label="Create password"
            value={form.password}
            onChange={(password) => setForm((f) => ({ ...f, password }))}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number."
            autoComplete="new-password"
          />
        </React.Fragment>
      )}

      {step === 1 && (
        <React.Fragment>
          <p className="af-note">Your buyer account is ready without an address. Add delivery details now, or save them for when you place an order.</p>
          <Field label="County" error={errors.county}>
            <select className="ai" value={form.county} onChange={set('county')} autoComplete="address-level1">
              <option value="">Select county</option>
              {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="af-two">
            <Field label="Sub-county / Town" error={errors.town}>
            <select className="ai" value={form.town} onChange={set('town')} autoComplete="address-level2" disabled={!form.county}>
              <option value="">{form.county ? 'Select sub-county' : 'Select county first'}</option>
              {(KENYA_SUB_COUNTIES[form.county] || []).map((town) => <option key={town} value={town}>{town}</option>)}
            </select>
            </Field>
            <Field label="Area / Estate" error={errors.area}>
              <input className="ai" value={form.area} onChange={set('area')} />
            </Field>
          </div>
          <Field label="Street, building or landmark" optional>
            <input className="ai" value={form.landmark} onChange={set('landmark')} placeholder="e.g. Opposite the petrol station" />
          </Field>
          <Field label="Alternative phone" optional error={errors.altPhone}>
            <input className="ai" value={form.altPhone} onChange={set('altPhone')} inputMode="tel" />
          </Field>
          <Field label="Delivery notes" optional>
            <input className="ai" value={form.notes} onChange={set('notes')} placeholder="e.g. Call when you arrive at the gate" />
          </Field>
        </React.Fragment>
      )}

      {step === 2 && <RolePicker choices={choices} onChange={setChoices} errors={errors} />}

      <div className="af-actions">
        {step > 0 && (
          <button type="button" className="btn ghost af-back" onClick={() => { setErrors({}); setStep(step - 1); }} aria-label="Back">
            <ArrowLeftIcon size={18} />
          </button>
        )}
        {step === 1 && (
          <button type="button" className="btn ghost af-skip" onClick={() => { setErrors({}); setStep(2); }}>
            Add later
          </button>
        )}
        <button type="submit" className="btn" disabled={busy}>
          {step < 2 ? 'Continue' : busy ? 'Creating account…' : 'Create account'}
        </button>
      </div>
      <p className="af-switch">
        Already have an account? <button type="button" className="af-link" onClick={() => setSheetView('signin')}>Sign in</button>
      </p>
    </form>
  );
}