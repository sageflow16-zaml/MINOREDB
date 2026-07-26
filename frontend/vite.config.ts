import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const proxyTarget = process.env.VITE_API_PROXY;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 400,
  },
  server: {
    port: 5173,
    proxy: proxyTarget
      ? {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
          },
        }
      : undefined,
  },
});
