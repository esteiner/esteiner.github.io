import { test as base, type Page } from '@playwright/test';
import { login } from '../helpers/login';

/**
 * Extends the base test with an `authedPage` fixture: a page that has already
 * completed the Solid OIDC login flow and sits on the authenticated landing
 * page.
 *
 * This logs in per test. It is deliberately simple: the Solid session relies on
 * in-memory DPoP keys and the Pod session cookie, so persisting Playwright
 * storageState across tests is not guaranteed to restore a session. If login
 * latency becomes a problem with more specs, promote this to a worker-scoped
 * fixture (or verified storageState reuse) — the helper stays the same.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
