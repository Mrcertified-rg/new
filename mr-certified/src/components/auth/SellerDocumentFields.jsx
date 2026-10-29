import React from 'react';
import { Field } from './FormFields.jsx';
import { validateSellerDocuments } from '../../auth/validators.js';

export default function SellerDocumentFields({ value = {}, onChange, errors = {} }) {
  const fields = [
    { key: 'idFront', label: 'National ID — front photo', accept: '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif' },
    { key: 'idBack', label: 'National ID — back photo', accept: '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif' },
    { key: 'kraCertificate', label: 'KRA certificate (PDF)', accept: '.pdf,application/pdf' },
  ];

  return (
    <div className="seller-documents">
      {fields.map(({ key, label, accept }) => {
        const selected = value[key];
        const error = errors[key] || (selected ? validateSellerDocuments({ [key]: selected })[key] : '');
        return (
          <Field key={key} label={label} error={error} hint={selected ? `Selected: ${selected.name}` : 'Required · 10 MB maximum'}>
            <input
              className="ai"
              type="file"
              accept={accept}
              required
              onChange={(event) => onChange(key, event.target.files?.[0] || null)}
            />
          </Field>
        );
      })}
      <p className="af-note" role="note">
        Prototype only: files are checked in your browser but are not uploaded or saved. Do not use real identity documents until secure document upload is available.
      </p>
    </div>
  );
}
