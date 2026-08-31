## ADDED Requirements

### Requirement: End-to-end test harness

The project SHALL provide a Playwright-based end-to-end test harness. All e2e files (configuration, fixtures, helpers, and specs) SHALL live under the top-level `e2e/` directory. The harness SHALL start the app's Vite dev server automatically for the duration of a test run and tear it down afterwards. The e2e suite SHALL be runnable independently of the unit-test suite and SHALL NOT be part of the `npm run build` or `npm test` pipelines.

#### Scenario: Running the e2e suite

- **WHEN** a developer runs the e2e npm script (e.g. `npm run test:e2e`)
- **THEN** Playwright starts the Vite dev server, executes the specs under `e2e/`, and shuts the server down when the run finishes

#### Scenario: E2e files are isolated

- **WHEN** the project is inspected
- **THEN** every Playwright config, helper, fixture, and spec file resides under `e2e/`, and no e2e file is placed under `src/`

#### Scenario: Unit pipeline is unaffected

- **WHEN** `npm run build` or `npm test` runs
- **THEN** the Playwright e2e suite is not executed as part of it

### Requirement: Authenticated login against a live Pod

The harness SHALL provide a reusable login helper that authenticates the app against a Solid Pod server assumed to be already running at `http://localhost:3000`, using the pre-seeded account with WebID `http://localhost:3000/edwin/profile/card#me`. The helper SHALL drive the full Solid OIDC redirect flow through the app's own UI (entering the WebID, completing the Pod server login form, and any consent step) and SHALL leave the app in an authenticated state ready for interaction. Account credentials SHALL be read from environment variables and SHALL NOT be committed to the repository.

#### Scenario: Successful login

- **WHEN** the login helper runs with valid credentials from the environment
- **THEN** the app completes the OIDC redirect flow and lands in an authenticated session showing the user's cellars

#### Scenario: Credentials are not hardcoded

- **WHEN** the e2e sources are inspected
- **THEN** the account email and password are read from environment variables (e.g. an `e2e/.env` file) that are excluded from version control, and no secret is written into a tracked file

### Requirement: Cellar contents are verified in the UI

The harness SHALL be able to navigate an authenticated session to the cellar page for a named cellar and assert the bottles it lists. As the first test, it SHALL open the cellar page for the cellar named **"Hütte"** and verify that exactly one bottle of the product **"Aagne Pinot noir spätlese 2021 (1.5l)"** is listed.

#### Scenario: Hütte lists one Aagne Pinot noir spätlese 2021 (1.5l)

- **WHEN** an authenticated user opens the cellar page for "Hütte"
- **THEN** the product "Aagne Pinot noir spätlese 2021 (1.5l)" is listed with a count of exactly one bottle
