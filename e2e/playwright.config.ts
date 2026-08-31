import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from '@dotenvx/dotenvx';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load credentials from e2e/.env (gitignored). Missing file is fine here — the
// login helper fails loudly if E2E_EMAIL / E2E_PASSWORD are absent.
const e2eDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(e2eDir, '.env'), ignore: ['MISSING_ENV_FILE'], quiet: true });

// The app's Vite dev server. Override with E2E_BASE_URL if you run it elsewhere.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './specs',
  // Solid login is a real redirect flow — give it room and don't hammer the Pod.
  fullyParallel: false,
  workers: 1,
  // Login drives a real OIDC redirect and then waits for a full Pod sync, which
  // is slow for a large Pod — give the whole test room.
  timeout: 210_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Playwright starts the Vite dev server itself and tears it down afterwards.
  // The Pod server at :3000 is an external precondition and is NOT managed here.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
