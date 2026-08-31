## Context

The app is a Vite + Lit SPA that stores data in a Solid Pod. Authentication uses the Solid OIDC browser flow (`@inrupt/solid-client-authn-browser`): the user enters a WebID on the landing page, the app resolves the OIDC issuer from the WebID profile and redirects to the Pod server's login form, the user authenticates and consents, and the Pod redirects back to the app which restores the session. UI is rendered with Lit web components using **open** shadow roots (Playwright locators pierce these automatically).

Existing tests are unit tests under Vitest. There is no browser-level coverage. This change adds Playwright e2e tests, isolated under `e2e/`, that run against a Pod server assumed to be already running at `http://localhost:3000` with a seeded `edwin` account and Hütte cellar data.

Confirmed with the user: credentials come from environment variables (`e2e/.env`, gitignored); Playwright starts the Vite dev server itself via `webServer`.

## Goals / Non-Goals

**Goals:**
- A self-contained Playwright harness under `e2e/` that boots the app, logs in through the real OIDC flow, and asserts UI state.
- A reusable login helper/fixture so specs don't repeat the login flow.
- First spec: Hütte lists exactly one "Aagne Pinot noir spätlese 2021 (1.5l)".
- Keep the unit-test pipeline (`build`, `test`) untouched.

**Non-Goals:**
- Managing/seeding the Pod server or its data (assumed already running and seeded).
- Cross-browser matrix; a single Chromium project is sufficient to start.
- CI wiring (can follow later); the harness must run locally.
- Refactoring app code, except adding a stable test selector only if strictly necessary.

## Decisions

### Directory layout (everything under `e2e/`)
```
e2e/
  playwright.config.ts     # config: webServer (Vite), baseURL, testDir, chromium project
  .env.example             # documents E2E_EMAIL / E2E_PASSWORD (real .env is gitignored)
  fixtures/
    auth.ts                # test fixture exposing an authenticated page (login helper)
  helpers/
    login.ts               # drives WebID entry → Pod login form → consent → redirect back
  specs/
    cellar-huette.spec.ts  # first test
```
`playwright.config.ts` lives inside `e2e/` (referenced via `npx playwright test -c e2e/playwright.config.ts`, wrapped in an npm script) so no e2e config leaks into the repo root beyond the npm script and `.gitignore` entries.

### App server: Playwright `webServer`
Config runs `npm run dev` and waits for the Vite dev server (default `http://localhost:5173`). `baseURL` is set to that URL. `reuseExistingServer: !process.env.CI` so a locally running dev server is reused. The Pod server at `:3000` is **not** managed by Playwright — it is an external precondition documented in the spec and README.

### Login helper drives the real UI flow
Rather than mocking auth, the helper reproduces the user journey:
1. `page.goto('/')`, open the WebID login dialog, enter `http://localhost:3000/edwin/profile/card#me`, confirm.
2. The app redirects to the Pod's login page (`localhost:3000`); fill email + password from env and submit.
3. Handle the Pod's authorize/consent screen if shown (click authorize/continue).
4. Wait for redirect back to the app and for the authenticated landing state (cellar buttons visible).

Credentials read from `process.env.E2E_EMAIL` / `E2E_PASSWORD`, loaded from `e2e/.env` via Playwright config (`dotenv`). The helper is exposed as a Playwright **fixture** (`auth.ts`) so specs receive an already-authenticated `page`.

Auth-state reuse (Playwright `storageState` / `globalSetup`) is intentionally **deferred**: the Solid session relies on in-memory DPoP keys and the Pod session cookie, so persisting `storageState` is not guaranteed to restore a session cleanly. Start with per-test (or per-file, via a worker-scoped fixture) login; optimize to stored state only if login proves slow and reuse is verified to work. This keeps the first test robust.

### Selectors: prefer role/text, pierce shadow DOM automatically
- Cellar navigation: on the landing page cellars render as `kellermeister-button text="Hütte"`; click via `page.getByText('Hütte', { exact: true })` (or role `button`). Playwright pierces the open shadow root.
- Bottle assertion: the cellar page renders each product name in a `.product-name` span inside `bottle-component`, with the bottle count in a slotted `.bottle-button`. Assert the product `"Aagne Pinot noir spätlese 2021 (1.5l)"` is visible and that its associated count button reads `1`.
- Add a `data-testid` in `src/` **only if** text/role selectors prove ambiguous or brittle; note it as a task, keep app changes minimal.

### Credentials handling
`e2e/.env` (gitignored) holds `E2E_EMAIL` / `E2E_PASSWORD`; `e2e/.env.example` documents the keys with placeholder values. `.gitignore` gets `e2e/.env`, `test-results/`, `playwright-report/`, and `e2e/.auth/`.

### npm scripts
- `test:e2e`: `playwright test -c e2e/playwright.config.ts`
- `test:e2e:ui`: `playwright test -c e2e/playwright.config.ts --ui` (optional, for debugging)
`build` and `test` are unchanged.

## Risks / Trade-offs

- **Consent screen variability**: the Pod's authorize step may or may not appear (depends on prior "remember" state). The helper handles it conditionally (click authorize if present) so the flow works either way.
- **Login latency without state reuse**: logging in per test is slower. Mitigation: worker-scoped auth fixture to log in once per worker; revisit stored `storageState` later if needed.
- **External Pod dependency**: tests fail if `:3000` is down or data isn't seeded. This is by design (the user owns the Pod lifecycle); documented as a precondition and surfaced with a clear error if the WebID profile can't be resolved.
- **German locale strings** (`Hütte`, umlauts): specs use exact Unicode strings; source files must be UTF-8 (they are).
- **Selector brittleness**: relying on visible German text couples tests to copy. Acceptable for a first test; escalate to `data-testid` if churn appears.
