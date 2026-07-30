import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourceMaps: {
        include: ['./dist/assets'],
      },
      telemetry: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tanstack/react-query': path.resolve(__dirname, './src/lib/patchedReactQuery.ts'),
      '@tanstack/react-query-real': path.resolve(__dirname, 'node_modules/@tanstack/react-query/build/modern/index.js'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('reactflow') || id.includes('@xyflow')) return 'vendor-flow';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('pdfjs-dist') || id.includes('tesseract')) return 'vendor-ocr';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            return 'vendor';
          }
          if (id.includes('/pages/')) {
            const match = id.match(/\/pages\/(\w+)\./);
            if (match) return `route-${match[1]}`;
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
