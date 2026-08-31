# End-to-end tests (Playwright)

Browser-driven tests that exercise the real login flow, routing, Solid Pod data
loading, and Lit UI rendering together. Everything for e2e lives under this
`e2e/` directory and is separate from the Vitest unit suite (`npm test`).

## Prerequisites

1. **A running Pod server at `http://localhost:3000`** with the pre-seeded
   account whose WebID is `http://localhost:3000/edwin/profile/card#me`. Start
   the bundled Community Solid Server:

   ```bash
   cd community-solid-server && docker compose up
   ```

   The tests do **not** start or seed the Pod — it is an external precondition.

2. **Credentials.** Copy the example env file and fill in the account's
   email/password (the file is gitignored):

   ```bash
   cp e2e/.env.example e2e/.env
   # then edit e2e/.env: E2E_EMAIL / E2E_PASSWORD
   ```

3. **Browser binaries** (one-time):

   ```bash
   npx playwright install chromium
   ```

The Vite dev server is started automatically by Playwright (`webServer`), so you
do not need to run `npm run dev` yourself. To point at an already-running app,
set `E2E_BASE_URL` in `e2e/.env`.

## Running

```bash
npm run test:e2e        # headless run
npm run test:e2e:ui     # interactive Playwright UI
```

## Layout

```
e2e/
  playwright.config.ts     # webServer (Vite), baseURL, chromium project, loads .env
  .env.example             # documents E2E_EMAIL / E2E_PASSWORD
  fixtures/auth.ts         # `authedPage` fixture — a logged-in page
  helpers/login.ts         # drives WebID entry → Pod login → consent → redirect
  specs/                   # test specs
```

## Notes

- Login goes through the app's own UI (pressing **Sync** while logged out starts
  the OIDC flow and remembers a pending sync that pulls the account's Pod data).
- Auth is performed per test. Playwright `storageState` reuse is intentionally
  not used: the Solid session relies on in-memory DPoP keys and the Pod session
  cookie, so persisted state is not guaranteed to restore a session.
