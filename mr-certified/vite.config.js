// MC
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const adminLocalOnly = () => ({
  name: 'admin-local-only',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      const isAdminRequest = url.startsWith('/admin.html') || url.startsWith('/src/admin/');
      const host = req.headers.host || '';
      const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);

      if (isAdminRequest && !isLocalHost) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      if (/^\/admin\.html(?:\?|$)/.test(url)) {
        req.url = url.replace(/^\/admin\.html/, '/src/admin/admin.html');
      } else if (/^\/src\/admin\/main\.jsx(?:\?|$)/.test(url)) {
        req.url = url.replace(/^\/src\/admin\/main\.jsx/, '/src/admin/src/admin/main.jsx');
      }

      next();
    });
  },
});

export default defineConfig({ plugins: [react(), adminLocalOnly()] });
