import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Unit tests live under src/ as *.test.ts. The Playwright e2e specs
    // (e2e/**/*.spec.ts) run via `playwright test`, not vitest — scoping the
    // include here keeps `vitest run` (and `npm run build`) from collecting them.
    include: ['src/**/*.test.ts'],
  },
});
