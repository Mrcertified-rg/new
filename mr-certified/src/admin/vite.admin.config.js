// MC
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds ONLY the admin console into dist-admin/ (never mixed with the public app).
export default defineConfig({
  plugins: [react()],
  define: { 'import.meta.env.VITE_ADMIN_BUILD': '"true"' },
  build: { outDir: 'dist-admin', rollupOptions: { input: 'admin.html' } },
});
