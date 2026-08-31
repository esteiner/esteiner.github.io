## Context

Today the e2e suite (added in `add-playwright-e2e-tests`) assumes a Pod is already running at `http://localhost:3000` and logs the seeded `edwin` account in against it. That seed — `community-solid-server/.volumes/data`, served via the committed `config/kellermeister.json` (ACP, file backend) — has `http://localhost:3000` baked into the WebID, OIDC issuer, `pim:storage`, every resource URI (923 `.ttl` files), and two URL-encoded internal account-index filenames.

We want the suite to provision its **own** Pod on **port 3001**, so a run is self-contained and can coexist with a dev Pod on 3000. Because the identifiers are coupled to the origin, the 3001 Pod must serve data whose `localhost:3000` references have been rewritten to `localhost:3001`. Per the chosen approach, this is done against a **throwaway per-run copy**, leaving the committed 3000 seed pristine (and incidentally making runs hermetic — no more accidental seed mutation).

Docker is already the project's way of running CSS and is available in the run environment.

## Goals / Non-Goals

**Goals:**
- e2e run starts a CSS instance on 3001 and stops it + cleans up afterwards, with no manual Pod needed.
- Serve a rewritten copy of the seed so WebID/issuer/resource URIs are consistent on 3001.
- Keep the committed seed and the dev `docker-compose.yml` (3000) untouched.
- Minimal churn to the existing helper/spec (only the origin changes).

**Non-Goals:**
- Migrating the committed seed to 3001 (explicitly rejected — 3000 stays the baseline).
- Removing the Docker dependency (running CSS via `npx` is out of scope).
- Parameterizing arbitrary ports; 3001 is the fixed e2e port (overridable by env if trivial).
- CI provisioning of Docker (assumed available, as for the dev Pod).

## Decisions

### Lifecycle via Playwright `globalSetup` / `globalTeardown`
`playwright.config.ts` gains `globalSetup` and `globalTeardown` (the Vite `webServer` stays). Order per run: globalSetup (prepare data → start Pod → wait ready) → webServer (Vite) → tests → globalTeardown (stop Pod → delete copy). globalSetup runs before Vite, so the Pod is up before any test.

### Throwaway data copy + origin rewrite
Helper (`e2e/helpers/pod.ts`) prepares a gitignored copy:
1. `rm -rf e2e/.pod-data` then recursively copy `community-solid-server/.volumes/data` → `e2e/.pod-data`, **excluding transient CSS runtime state** (`.internal/idp/adapter`, `.internal/accounts/cookies`, `.internal/locks`). See the note below.
2. Rewrite file **contents**, replacing both origin forms:
   - plain `localhost:3000` → `localhost:3001` (in `.ttl` and JSON values)
   - URL-encoded `localhost%3A3000` → `localhost%3A3001` (in `.internal` JSON keys/values)
3. Rewrite **filenames**: any file whose name contains `localhost%3A3000` (the pod-`baseUrl` and `webIdLink/webId` account indexes) is renamed to the `…3001…` form. `fs.rename` handles the `#` in `…card#me$.json`.
4. **Assert clean**: after rewriting, scan the copy for any remaining `localhost:3000` / `localhost%3A3000`; if found, fail setup loudly (a missed reference silently breaks login or cellar→bottle links).

Done in Node `fs` (not `sed`/`rename`) for portability across the container and macOS. ~1200 small files; a few seconds is acceptable at suite start.

**Excluding runtime state from the copy.** The copy skips the gitignored CSS runtime directories — OIDC adapter tokens/sessions/clients (`.internal/idp/adapter`), login cookies (`.internal/accounts/cookies`), and resource locks (`.internal/locks`). Two reasons: (a) a fresh Pod regenerates all of it, and the app uses dynamic client registration, so no pre-existing OIDC state is needed for login — the account data (`.internal/accounts/…`) and signing keys (`.internal/idp/keys`) that login *does* need are kept; (b) a dev Pod on 3000 actively rewrites those adapter files, so copying them races with the live process (observed as intermittent `EACCES` reading `.internal/idp/adapter/…` mid-copy). Excluding them makes the copy stable alongside a running dev Pod and gives each run clean sessions.

### Start CSS on 3001 with Docker, reusing the committed config
```
docker rm -f css-e2e            # clear any leftover
docker run -d --name css-e2e -p 3001:3001 \
  -v <abs>/e2e/.pod-data:/data \
  -v <abs>/community-solid-server/config:/config \
  solidproject/community-server:7.2.0 \
  -c /config/kellermeister.json -b http://localhost:3001/ -p 3001 -f /data
```
Distinct container name `css-e2e` and port 3001 avoid clashing with a dev `css`/3000. Image pinned to `7.2.0` (matches the committed compose). Readiness: poll `GET http://localhost:3001/edwin/profile/card` until 200 (bounded timeout, e.g. 60s), then proceed.

### Origin as a single source of truth
`e2e/helpers/pod.ts` exports `POD_PORT = 3001` and `POD_ORIGIN = http://localhost:3001` (overridable via `E2E_POD_ORIGIN`). `helpers/login.ts` derives `TEST_WEBID = ${POD_ORIGIN}/edwin/profile/card#me` from it instead of hardcoding 3000. The redirect-detection in the helper keys off `POD_ORIGIN` rather than a literal `localhost:3000`.

### Teardown
`globalTeardown`: `docker rm -f css-e2e` and `rm -rf e2e/.pod-data`. Best-effort (ignore errors) so a partial setup still cleans up.

## Risks / Trade-offs

- **Incomplete rewrite** breaks auth or data linkage. Mitigated by handling both plain and `%3A`-encoded forms plus filenames, and by the post-rewrite "no 3000 left" assertion.
- **Docker now mandatory** for the suite (previously the Pod was external). Setup fails with a clear message if `docker` is missing or the image can't be pulled. Documented in `e2e/README.md`.
- **Port 3001 in use / stale `css-e2e`** → `docker rm -f css-e2e` up front and a clear error if the port bind fails.
- **First-run image pull** adds latency if `solidproject/community-server:7.2.0` isn't cached; readiness timeout accounts for it, or a task pre-pulls it.
- **Copy cost** (~1200 files each run) adds a few seconds and disk under `e2e/.pod-data`; acceptable and gitignored.
- **Startup ordering**: globalSetup must finish (Pod ready) before tests; the readiness poll guarantees this rather than relying on a fixed sleep.
