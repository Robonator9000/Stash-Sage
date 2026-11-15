import { defineConfig } from 'vitest/config';

// Tests live outside src/ so the production build (`tsc -b && vite build`)
// never typechecks or bundles them. Pure-logic tests run in a plain node env.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});