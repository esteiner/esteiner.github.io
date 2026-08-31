## 1. Pod data preparation helper

- [x] 1.1 Create `e2e/helpers/pod.ts` exporting `POD_PORT` (3001) and `POD_ORIGIN` (`http://localhost:3001`, overridable via `E2E_POD_ORIGIN`).
- [x] 1.2 Implement `prepareData()`: `rm -rf e2e/.pod-data`, then recursively copy `community-solid-server/.volumes/data` → `e2e/.pod-data` using Node `fs`. _(Copy excludes transient, gitignored CSS runtime state — `.internal/idp/adapter`, `accounts/cookies`, `locks` — which a fresh Pod regenerates; this also keeps the copy stable while a dev Pod is actively churning those files.)_
- [x] 1.3 Rewrite file contents in the copy: replace `localhost:3000` → `localhost:3001` and `localhost%3A3000` → `localhost%3A3001` across all files.
- [x] 1.4 Rename files in the copy whose names contain `localhost%3A3000` to the `…3001…` form (handle the `#` in `…card#me$.json`).
- [x] 1.5 After rewriting, assert no `localhost:3000` or `localhost%3A3000` remains in the copy (content or filenames); throw with a clear message if any is found.

## 2. Pod lifecycle (start / stop)

- [x] 2.1 In `e2e/helpers/pod.ts`, implement `startPod()`: `docker rm -f css-e2e` (ignore errors), then `docker run -d --name css-e2e -p 3001:3001 -v <abs>/e2e/.pod-data:/data -v <abs>/community-solid-server/config:/config solidproject/community-server:7.2.0 -c /config/kellermeister.json -b http://localhost:3001/ -p 3001 -f /data`.
- [x] 2.2 Implement `waitForPod()`: poll `GET ${POD_ORIGIN}/edwin/profile/card` until HTTP 200, with a bounded timeout (~60s) and a clear failure message.
- [x] 2.3 Implement `stopPod()`: `docker rm -f css-e2e` and `rm -rf e2e/.pod-data`, best-effort (ignore errors).

## 3. Wire into Playwright

- [x] 3.1 Create `e2e/global-setup.ts`: `prepareData()` → `startPod()` → `waitForPod()`.
- [x] 3.2 Create `e2e/global-teardown.ts`: `stopPod()`.
- [x] 3.3 Update `e2e/playwright.config.ts` to reference `globalSetup` and `globalTeardown` (keep the Vite `webServer`).

## 4. Point the login flow at 3001

- [x] 4.1 Update `e2e/helpers/login.ts` so `TEST_WEBID` is derived from `POD_ORIGIN` (`${POD_ORIGIN}/edwin/profile/card#me`) and the redirect-detection keys off `POD_ORIGIN` instead of a literal `localhost:3000`.
- [x] 4.2 Update `e2e/.env.example` / `e2e/README.md`: the WebID is now on 3001 and the harness starts the Pod itself (document the Docker requirement; note 3000 is no longer needed).

## 5. Git hygiene and verification

- [x] 5.1 Add `e2e/.pod-data/` to `.gitignore`.
- [x] 5.2 Run `npm run test:e2e` and confirm: the suite starts `css-e2e` on 3001, the Hütte spec passes, and both the Pod and `e2e/.pod-data` are cleaned up afterwards. _(Verified: Pod ready at http://localhost:3001, spec passes, `css-e2e` and `e2e/.pod-data` removed after the run.)_
- [x] 5.3 Confirm the committed `community-solid-server/.volumes/data` (3000 baseline) shows no git changes after a run, and that the suite passes with no Pod running on 3000. _(Verified both: seed git-clean after runs; suite passes with the dev css on 3000 stopped.)_
