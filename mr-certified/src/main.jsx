import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './responsive.css'; // must stay AFTER styles.css
import './theme.css';
import { ThemeProvider } from './ThemeContext.jsx';

/* Keep the app as tall as the VISIBLE screen (address bars, on-screen keyboard). */
const vv = window.visualViewport;
const fitHeight = () => {
  const h = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-h', h + 'px');
  if (vv && vv.offsetTop > 0) window.scrollTo(0, 0); // iOS pushes the page up when the keyboard opens
};
if (vv) document.documentElement.classList.add('has-vv');
fitHeight();
window.addEventListener('resize', fitHeight);
window.addEventListener('orientationchange', fitHeight);
if (vv) {
  vv.addEventListener('resize', fitHeight);
  vv.addEventListener('scroll', fitHeight);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
