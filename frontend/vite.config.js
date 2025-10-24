import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration with a development proxy for the API.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});