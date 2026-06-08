import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.GITHUB_PAGES === 'true' ? '/Stash-Tracker/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', '.nojekyll'],
      manifest: {
        name: 'Stash Tracker',
        short_name: 'Stash',
        description: 'Track cannabis products, consumption sessions, and your stash.',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: base,
        start_url: base,
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          {
            src: `${base}icon.svg`,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: `${base}icon.svg`,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
