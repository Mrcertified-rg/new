// MC
import React from 'react';
import ReactDOM from 'react-dom/client';
import './welcome.css'; // was loaded through App before; keep it FIRST so the style order stays the same
import './styles.css';
import './responsive.css'; // must stay AFTER styles.css
import './theme.css';
import { ThemeProvider } from './ThemeContext.jsx';
import { initAuth } from './auth/authService.js';
import { loadProducts } from './products/productservice.js';

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

const root = ReactDOM.createRoot(document.getElementById('root'));

// Dark splash while we fetch the login + products (never a white screen).
root.render(
  <div style={{ minHeight: '100vh', background: '#0b0b0c', color: '#f6c243', display: 'grid', placeItems: 'center', font: '600 18px Georgia, serif', letterSpacing: '.09em' }}>
    MERQO.
  </div>
);

async function start() {
  // Wait for the login check and the product list, but never longer than 5 seconds.
  const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
  await Promise.race([Promise.allSettled([initAuth(), loadProducts()]), timeout]);

  // App is loaded AFTER the data is ready, because some screens read the product list as soon as they load.
  const { default: App } = await import('./App.jsx');
  root.render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

start();
