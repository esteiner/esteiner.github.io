## MODIFIED Requirements

### Requirement: End-to-end test harness

The project SHALL provide a Playwright-based end-to-end test harness. All e2e files (configuration, fixtures, helpers, and specs) SHALL live under the top-level `e2e/` directory. The harness SHALL start the app's Vite dev server automatically for the duration of a test run and tear it down afterwards. The harness SHALL also start its own dedicated Solid Pod server instance on **port 3001** at the beginning of a run and stop it (and remove its temporary data) at the end — it SHALL NOT require a manually-started Pod. The e2e suite SHALL be runnable independently of the unit-test suite and SHALL NOT be part of the `npm run build` or `npm test` pipelines.

#### Scenario: Running the e2e suite

- **WHEN** a developer runs the e2e npm script (e.g. `npm run test:e2e`)
- **THEN** Playwright starts a Pod server on port 3001 and the Vite dev server, executes the specs under `e2e/`, and shuts both down when the run finishes

#### Scenario: E2e files are isolated

- **WHEN** the project is inspected
- **THEN** every Playwright config, helper, fixture, and spec file resides under `e2e/`, and no e2e file is placed under `src/`

#### Scenario: Unit pipeline is unaffected

- **WHEN** `npm run build` or `npm test` runs
- **THEN** the Playwright e2e suite is not executed as part of it

#### Scenario: Committed seed data is not mutated

- **WHEN** the e2e suite runs
- **THEN** the Pod on port 3001 serves a throwaway copy of the seed data, and the committed `community-solid-server/.volumes/data` (the 3000 baseline) is left unchanged

#### Scenario: Runs do not require a pre-existing Pod on 3000

- **WHEN** no Pod is running on port 3000
- **THEN** the e2e suite still starts, provisions its own Pod on 3001, and runs to completion

### Requirement: Authenticated login against a live Pod

The harness SHALL provide a reusable login helper that authenticates the app against the Pod server the harness itself started at `http://localhost:3001`, using the pre-seeded account with WebID `http://localhost:3001/edwin/profile/card#me`. The Pod's data SHALL be a per-run copy of the committed seed with its `localhost:3000` identifiers (resource content and URL-encoded internal index filenames) rewritten to `localhost:3001`, so the WebID, OIDC issuer, and resource URIs are internally consistent on port 3001. The helper SHALL drive the full Solid OIDC redirect flow through the app's own UI (entering the WebID, completing the Pod server login form, and any consent step) and SHALL leave the app in an authenticated state ready for interaction. Account credentials SHALL be read from environment variables and SHALL NOT be committed to the repository.

#### Scenario: Successful login

- **WHEN** the login helper runs with valid credentials from the environment
- **THEN** the app completes the OIDC redirect flow against the Pod on port 3001 and lands in an authenticated session showing the user's cellars

#### Scenario: Credentials are not hardcoded

- **WHEN** the e2e sources are inspected
- **THEN** the account email and password are read from environment variables (e.g. an `e2e/.env` file) that are excluded from version control, and no secret is written into a tracked file
