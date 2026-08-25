import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// No runtime network requests: fonts are bundled from node_modules (@fontsource),
// there is no analytics, no CDN, no API. See README "Verifying zero network calls".
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0, // keep font files as real assets, never data: URIs in CSS
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
