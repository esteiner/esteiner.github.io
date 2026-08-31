# End-to-end tests (Playwright)

Browser-driven tests that exercise the real login flow, routing, Solid Pod data
loading, and Lit UI rendering together. Everything for e2e lives under this
`e2e/` directory and is separate from the Vitest unit suite (`npm test`).

## Prerequisites

1. **Docker.** The suite starts its own Community Solid Server on
   `http://localhost:3001` for the duration of a run and stops it afterwards —
   you do **not** need to start or seed a Pod yourself. It serves a throwaway
   per-run copy of `community-solid-server/.volumes/data` with its
   `localhost:3000` identifiers rewritten to `localhost:3001`, so the committed
   3000 seed is never touched and a dev Pod on 3000 can run alongside.

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

Both the Pod (port 3001, via `globalSetup`) and the Vite dev server (via
`webServer`) are started automatically by Playwright. To point at an
already-running app, set `E2E_BASE_URL` in `e2e/.env`.

## Running

```bash
npm run test:e2e        # headless run
npm run test:e2e:ui     # interactive Playwright UI
```

## Layout

```
e2e/
  playwright.config.ts     # globalSetup/teardown + webServer (Vite), loads .env
  global-setup.ts          # copy+rewrite seed → start Pod on 3001 → wait ready
  global-teardown.ts       # stop the Pod container, delete the copy
  .env.example             # documents E2E_EMAIL / E2E_PASSWORD
  fixtures/auth.ts         # `authedPage` fixture — a logged-in page
  helpers/pod.ts           # Pod data prep + Docker lifecycle (port 3001)
  helpers/login.ts         # drives WebID entry → Pod login → consent → redirect
  specs/                   # test specs
  .pod-data/               # throwaway rewritten Pod data (gitignored)
```

## Notes

- Login goes through the app's own UI (pressing **Sync** while logged out starts
  the OIDC flow and remembers a pending sync that pulls the account's Pod data).
- Auth is performed per test. Playwright `storageState` reuse is intentionally
  not used: the Solid session relies on in-memory DPoP keys and the Pod session
  cookie, so persisted state is not guaranteed to restore a session.
