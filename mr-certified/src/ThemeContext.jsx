// MC
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { applyThemePreference, getThemePreference } from './themePreference.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getThemePreference);

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      setTheme(event.detail === 'light' ? 'light' : 'dark');
    };
    window.addEventListener('merqo-theme-change', syncTheme);
    return () => window.removeEventListener('merqo-theme-change', syncTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
