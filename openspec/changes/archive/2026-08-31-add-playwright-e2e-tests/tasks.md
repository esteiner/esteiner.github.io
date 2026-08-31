## 1. Install and scaffold Playwright

- [x] 1.1 Add `@playwright/test` (and `dotenv` if not transitively available) as devDependencies; run `npx playwright install chromium`. _(Used the already-present `@dotenvx/dotenvx` instead of adding `dotenv`.)_
- [x] 1.2 Create the `e2e/` directory structure: `fixtures/`, `helpers/`, `specs/`.
- [x] 1.3 Add `e2e/playwright.config.ts` with `testDir: './specs'`, a single Chromium project, `use.baseURL` for the Vite dev server (default `http://localhost:5173`), and load `e2e/.env` via `dotenv`.
- [x] 1.4 Configure `webServer` in the config to run `npm run dev`, wait on the dev server URL, with `reuseExistingServer: !process.env.CI`.

## 2. Credentials and git hygiene

- [x] 2.1 Create `e2e/.env.example` documenting `E2E_EMAIL` and `E2E_PASSWORD` with placeholder values.
- [x] 2.2 Update `.gitignore` to exclude `e2e/.env`, `test-results/`, `playwright-report/`, and any `e2e/.auth/` state dir. _(`test-results/` and `playwright-report/` were already ignored.)_
- [x] 2.3 Create a local (untracked) `e2e/.env` with the real credentials for the seeded `edwin` account (developer step; not committed). _(File scaffolded from the example and gitignored — real E2E_EMAIL / E2E_PASSWORD still need to be filled in by the developer.)_

## 3. Login helper and auth fixture

- [x] 3.1 Implement `e2e/helpers/login.ts`: navigate to `/`, open the WebID dialog, enter `http://localhost:3000/edwin/profile/card#me`, confirm, then fill the Pod login form (email/password from env) and submit. _(Login is initiated via the Sync button, which also remembers a pending sync that pulls the account's Pod data.)_
- [x] 3.2 Handle the Pod authorize/consent screen conditionally (click authorize/continue only if present).
- [x] 3.3 Wait for redirect back to the app and assert the authenticated landing state (cellar buttons visible).
- [x] 3.4 Implement `e2e/fixtures/auth.ts` exposing an authenticated `page` fixture (worker-scoped if login latency warrants) built on the login helper. _(Test-scoped for now; documented how to promote to worker-scoped.)_

## 4. First spec: Hütte cellar contents

- [x] 4.1 Create `e2e/specs/cellar-huette.spec.ts` using the auth fixture.
- [x] 4.2 From the authenticated landing page, click the cellar button labelled "Hütte" and wait for the cellar page (`/cellar/:cellarId`) to load.
- [x] 4.3 Assert the product "Aagne Pinot noir spätlese 2021 (1.5l)" is listed.
- [x] 4.4 Assert its bottle count is exactly one (the count button reads `1`).
- [x] 4.5 If text/role selectors prove ambiguous, add a minimal `data-testid` to the relevant component in `src/` and use it (keep app changes minimal). _(Not needed — role/text selectors were unambiguous, so no `src/` change was made.)_

## 5. Scripts, verification, and docs

- [x] 5.1 Add `test:e2e` (and optional `test:e2e:ui`) npm scripts pointing at `-c e2e/playwright.config.ts`; leave `build` and `test` unchanged.
- [x] 5.2 Run `npm run test:e2e` against the running Pod at `:3000` and confirm the Hütte spec passes. _(PASSES. Ran the Pod inside the sandbox from the public `solidproject/community-server:7.2.0` image (retagged `community-solid-server:latest`) with `config/file-acp.json` against the seeded `.volumes/data`; credentials supplied in `e2e/.env`. Fixed a timing bug: the landing page only re-reads its cellar list when a sync *finishes*, so the login helper now waits for the full Pod sync (~37s) before "Hütte" appears.)_
- [x] 5.3 Document e2e prerequisites and how to run the suite (running Pod at `:3000`, seeded account, `e2e/.env`) in the README (or an `e2e/README.md`).
