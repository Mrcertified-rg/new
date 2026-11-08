import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * DEV ONLY: the admin console is served to this computer only.
 * Anyone reaching the dev server through a LAN address or a tunnel
 * (ngrok, cloudflared...) gets a 404 for the admin files.
 */
const adminLocalOnly = () => ({
  name: 'admin-local-only',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (url.startsWith('/admin.html') || url.startsWith('/src/admin/')) {
        const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host || '');
        if (!local) { res.statusCode = 404; res.end('Not found'); return; }
      }
      next();
    });
  },
});

export default defineConfig({ plugins: [react(), adminLocalOnly()] });
