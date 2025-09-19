import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Notes-on-Issues',
        short_name: 'NoI',
        start_url: '/',
        display: 'standalone',
      },
    }),
  ],
});
