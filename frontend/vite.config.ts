import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['amclub.ngrok.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
    },
  },
});
