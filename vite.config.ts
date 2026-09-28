import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crmApiPlugin } from './vite-plugin-crm-api.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crmApiPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'node',
  }
});
