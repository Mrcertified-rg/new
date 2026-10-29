import React, { useState, useCallback } from 'react';
import { applyThemePreference, getThemePreference } from '../../themePreference.js';

/* Light / dark theme. The choice is saved on this device and applied before the first render (no flash). */
applyThemePreference(getThemePreference());

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getThemePreference);
  const toggle = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    applyThemePreference(next);
    setTheme(next);
  }, [theme]);

  const toLight = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={toLight ? 'Switch to light mode' : 'Switch to dark mode'}
      title={toLight ? 'Light mode' : 'Dark mode'}
    >
      {toLight ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
        </svg>
      )}
    </button>
  );
}
