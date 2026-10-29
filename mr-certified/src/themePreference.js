const THEME_KEY = 'merqo-theme';

export function getThemePreference() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyThemePreference(theme) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', selectedTheme);
  document.documentElement.style.colorScheme = selectedTheme;
  try {
    localStorage.setItem(THEME_KEY, selectedTheme);
  } catch {
    // Theme remains applied for this visit if storage is unavailable.
  }
}
