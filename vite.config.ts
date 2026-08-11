import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  server: { fs: { strict: false } },
  optimizeDeps: {
    entries: ['src/**/*.{ts,tsx,js,jsx}'],
    exclude: ['three'],
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-ui': ['lucide-react', 'dompurify'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/form', '@mantine/notifications', '@mantine/modals', '@mantine/carousel', '@mantine/charts', '@mantine/dates', 'embla-carousel-react', '@tabler/icons-react'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
      },
      manifest: {
        name: 'Stash Sage',
        short_name: 'Stash Sage',
        description: 'Track cannabis products, consumption sessions, and your personal stash.',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Add Product',
            short_name: 'Add',
            description: 'Add a new product to your stash',
            url: '/?action=add',
            icons: [{ src: '/icon.svg', sizes: '192x192' }],
          },
          {
            name: 'Community',
            short_name: 'Feed',
            description: 'View community feed',
            url: '/?tab=community',
            icons: [{ src: '/icon.svg', sizes: '192x192' }],
          },
          {
            name: 'Marketplace',
            short_name: 'Market',
            description: 'Browse marketplace listings',
            url: '/?tab=marketplace',
            icons: [{ src: '/icon.svg', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Stash Sage - Main Feed',
          },
          {
            src: '/screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Stash Sage - Mobile View',
          },
        ],
      },
    }),
  ],
});