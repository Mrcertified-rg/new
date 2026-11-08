import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp.jsx';

// A production build of the PUBLIC app never contains this file. Extra guard:
// a production bundle only runs if it was built with `npm run build:admin`.
const blocked = import.meta.env.PROD && import.meta.env.VITE_ADMIN_BUILD !== 'true';

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  blocked ? <p style={{ padding: 24, fontFamily: 'sans-serif' }}>Not available.</p> : <AdminApp />,
);
