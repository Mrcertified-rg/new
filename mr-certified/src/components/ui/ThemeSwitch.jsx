import { useTheme } from '../../ThemeContext.jsx';

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="btn ghost"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
