import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Offline is a first-class state, not a degraded one.
 *
 * The app shell and every font are precached, so a returning user gets the
 * whole thing with no network — which is what "local-first" has to mean if it
 * means anything. Supabase calls are deliberately *not* cached: a stale answer
 * about somebody's own account is worse than an honest failure, and the sync
 * layer already queues writes while offline.
 *
 * Updates are prompted rather than silent: swapping the bundle underneath
 * someone mid-sentence is how you lose a paragraph.
 */
/**
 * The absolute URL the app is served from.
 *
 * Open Graph images and canonical links have to be absolute — a relative one is
 * silently ignored by some crawlers, which is the kind of failure you only find
 * out about from a link that previews as a grey rectangle. Set VITE_APP_URL to
 * the deployed origin; with nothing set the tags are stripped rather than
 * shipped pointing at a placeholder.
 */
function absoluteUrls(appUrl: string) {
  return {
    name: 'lifebook-absolute-urls',
    transformIndexHtml(html: string) {
      if (appUrl) return html.replaceAll('%APP_URL%', appUrl);
      // No origin configured: drop the tags that would be wrong rather than
      // emit "%APP_URL%/og.png" into somebody's link preview.
      return html
        .split('\n')
        .filter((line) => !line.includes('%APP_URL%'))
        .join('\n');
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv rather than process.env: this file is typechecked with types: [],
  // deliberately, and Vite's own loader reads both the .env files and the
  // matching environment variables without needing the node types.
  const appUrl = (loadEnv(mode, '.', 'VITE_')['VITE_APP_URL'] ?? '').replace(/\/+$/, '');

  return {
  plugins: [
    react(),
    absoluteUrls(appUrl),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Lifebook',
        short_name: 'Lifebook',
        description:
          'Write the life you want, then the life you have — and the work that closes the gap.',
        theme_color: '#0B0E14',
        background_color: '#0B0E14',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        // Never serve a cached answer about somebody's own account.
        navigateFallbackDenylist: [/^\/auth\//, /^\/rest\//],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0, // keep font files as real assets, never data: URIs in CSS
    rollupOptions: {
      output: {
        manualChunks: {
          // React and the router are needed for the first paint; everything
          // else is split so it can arrive when it is actually used.
          react: ['react', 'react-dom', 'react-router-dom'],
          storage: ['dexie'],
          // The constellation's renderer: ~600 KB that nobody pays for until
          // they open that one screen.
          three: ['three'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/store/__tests__/setup.ts'],
  },
};
});
