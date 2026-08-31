## Why

The app currently has only unit tests (Vitest); there is no coverage that exercises the real login flow, routing, Solid Pod data loading, and Lit UI rendering together. A browser-driven end-to-end test would catch regressions that unit tests cannot — for example a broken cellar view, a routing change, or a data-mapping bug that only surfaces against a live Pod.

## What Changes

- Add [Playwright](https://playwright.dev/) as a dev dependency and an end-to-end test harness.
- Place all e2e files under a new top-level `e2e/` directory (config, fixtures, helpers, specs).
- Configure Playwright to start the Vite dev server automatically (`webServer`) and to run against a Pod server expected to be already running at `http://localhost:3000` with a pre-seeded account (WebID `http://localhost:3000/edwin/profile/card#me`).
- Provide a reusable login helper that drives the full Solid OIDC redirect flow (enter WebID → Pod login form → consent → redirect back), reading account credentials from environment variables (`e2e/.env`, gitignored).
- Add npm scripts to run the e2e suite (`test:e2e`) separately from the unit suite so the existing `build`/`test` pipeline is unaffected.
- First test: log in, open the cellar page for **Hütte**, and assert exactly one bottle of **"Aagne Pinot noir spätlese 2021 (1.5l)"** is listed.

## Capabilities

### New Capabilities
- `e2e-testing`: Browser-driven end-to-end testing of the app against a live Solid Pod, including authenticated login and verification of cellar contents rendered in the UI.

### Modified Capabilities
<!-- No existing spec requirements change; e2e tests are additive and do not alter app behavior. -->

## Impact

- **New files**: `e2e/` directory (Playwright config, login helper/fixture, first spec, `.env.example`), `.gitignore` entry for `e2e/.env` and Playwright artifacts.
- **`package.json`**: new `@playwright/test` devDependency and `test:e2e` script(s). No change to `build` or `test`.
- **Dependencies**: Playwright browser binaries must be installed (`npx playwright install`).
- **External prerequisites**: a running Community Solid Server at `http://localhost:3000` with the seeded `edwin` account and the Hütte cellar data. Not started or managed by the app build.
- **No changes** to `src/` application code (unless a stable test selector needs to be added — tracked in tasks).
