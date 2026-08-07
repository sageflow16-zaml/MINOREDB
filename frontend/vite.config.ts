import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Only enable the Sentry plugin when a build has upload credentials.
    // An unconfigured sentryVitePlugin still rewrites the entry chunk,
    // injecting static side-effect imports of heavy dynamic chunks
    // (vendor-charts, vendor-flow, ...) that force ~495KB of chart/flow
    // code into the first paint. Gating it keeps local and CI builds
    // (which never set SENTRY_AUTH_TOKEN) free of that regression while
    // preserving source map upload for deployments that do configure it.
    ...(process.env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourceMaps: {
        include: ['./dist/assets'],
      },
      telemetry: false,
    })] : []),
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
    // Every modern browser (Chrome 65+, Firefox 65+, Safari 12+) supports
    // native modulepreload; the runtime polyfill shim pulls side-effect
    // imports of heavy dynamic chunks (vendor-charts, vendor-flow, ...)
    // into the entry's static graph, making the HTML preload ~495KB of
    // chart/flow code on first paint. Disabling the polyfill keeps those
    // chunks lazily loaded until a page actually needs them.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('reactflow') || id.includes('@xyflow') ||
                id.includes('dagre') || id.includes('graphlib') || id.includes('lodash')) return 'vendor-flow';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('lightweight-charts')) return 'vendor-lightweight';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@sentry/')) return 'vendor-sentry';
            if (id.includes('pdfjs-dist') || id.includes('tesseract')) return 'vendor-ocr';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            return 'vendor';
          }
          // Modules are grouped by source-layer, mirroring the dependency
          // flow (components -> hooks -> api/lib -> pages). This guarantees
          // a page chunk never absorbs shared modules: previously a hook or
          // component imported by two pages was merged into the first page's
          // chunk, creating static import edges between page chunks (e.g.
          // route-Projects statically imported route-Dashboard). Those edges
          // made Vite modulepreload ~500KB of route code and the 487KB OCR
          // vendor chunk on the initial page load.
          if (id.includes('/pages/')) {
            const match = id.match(/\/pages\/(\w+)\./);
            if (match) return `route-${match[1]}`;
            return 'page-utils';
          }
          // Chart widgets are their own boundary: they pull in recharts
          // (~400KB), so they must never be reachable from the entry chunk.
          // They are imported only by quant pages and load lazily.
          if (id.includes('/components/charts/')) return 'ui-charts';
          // Graph widgets pull in reactflow (~94KB) plus its d3 dependency
          // (~40KB of vendor-charts). They are only imported by lazy pages
          // (KnowledgeEngine, GraphExplorer), so they get their own chunk
          // instead of being absorbed into ui-shared where they would be
          // statically reachable from the entry on first paint.
          if (id.includes('/components/graph/') || id.includes('/components/knowledge/')) return 'ui-graph';
          // The trading workspace (charts, panels, drawing, ICT) forms a
          // closed island: only lazy pages import it, and it pulls in
          // lightweight-charts via ChartContainer. Keeping it out of
          // ui-shared drops the charting library from the first paint.
          if (id.includes('/components/workspace/') || id.includes('/components/chart/') ||
              id.includes('/components/panels/') || id.includes('/components/drawing/') ||
              id.includes('/components/ict/')) return 'ui-workspace';
          if (id.includes('/components/')) return 'ui-shared';
          if (id.includes('/hooks/')) return 'hooks-shared';
          if (id.includes('/api/')) return 'api-shared';
          if (id.includes('/services/')) return 'services-shared';
          if (id.includes('/lib/')) return 'lib-shared';
          if (id.includes('/context/')) return 'context-shared';
          if (id.includes('/auth/')) return 'auth-shared';
          if (id.includes('/theme/')) return 'theme-shared';
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
