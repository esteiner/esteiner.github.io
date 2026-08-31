## Why

The e2e suite currently assumes a Pod server is already running at `http://localhost:3000` — the developer must start it by hand, and a run mutates that shared, committed seed. Making the suite start (and stop) its own dedicated Pod on a separate port makes it self-contained, hermetic, and safe to run alongside a dev Pod on 3000.

## What Changes

- The e2e harness SHALL start its own Community Solid Server instance on **port 3001** as part of a test run, and stop it (plus clean up) afterwards — no manually-started Pod required.
- The e2e Pod SHALL serve a **throwaway per-run copy** of the committed seed data, rewritten from `localhost:3000` to `localhost:3001` (resource content and the two URL-encoded internal index filenames). The committed `community-solid-server/.volumes/data` stays pristine at 3000.
- The login helper and config SHALL target the WebID `http://localhost:3001/edwin/profile/card#me` (issuer `http://localhost:3001/`) instead of 3000.
- Startup/teardown is orchestrated via Playwright `globalSetup`/`globalTeardown` (Docker for the CSS container), leaving the existing Vite `webServer` in place.
- Because the copy is fresh each run, e2e runs no longer touch the developer's real Pod data.

## Capabilities

### New Capabilities
<!-- None. This refines the existing e2e-testing capability. -->

### Modified Capabilities
- `e2e-testing`: The harness now provisions its own Pod instance on port 3001 from a throwaway rewritten copy of the seed, rather than assuming a live Pod on 3000. Affects the "End-to-end test harness" and "Authenticated login against a live Pod" requirements.

## Impact

- **`e2e/`**: new `global-setup.ts` / `global-teardown.ts` (or equivalent), a data-copy/rewrite helper, and Pod-lifecycle config in `playwright.config.ts`. `helpers/login.ts` switches to the 3001 WebID.
- **`.gitignore`**: ignore the throwaway Pod data dir (e.g. `e2e/.pod-data/`).
- **Dependencies**: relies on Docker being available in the run environment (already used for the dev Pod). No new npm dependency required; the CSS image and `config/kellermeister.json` are reused.
- **No change** to `src/`, to the committed seed at 3000, or to the unit-test/build pipelines.
