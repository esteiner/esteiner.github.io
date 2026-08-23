## 1. Upload port and adapter

- [x] 1.1 Add an application port (e.g. `InboxUploader` in `src/application/ports/`) with `upload(file: File): Promise<string>` returning the URL of the created resource, so the page never imports `@inrupt/solid-client` (no page does today).
- [x] 1.2 Implement the adapter in `src/infrastructure/solid/`: post into `PodContainerRegistry.inboxContainer()` with `saveFileInContainer(container, file, {fetch: session.fetch, contentType})` and return the created resource's URL from the result (`getSourceUrl`) — NOT `container + file.name`, since the server assigns the name (design Decision 1).
- [x] 1.3 Content type: pass `file.type` when the browser reports one, otherwise `text/turtle` (design Decision 2). This is what makes an uploaded `.ttl` order readable by ingestion instead of being stored as an opaque binary; keep it in the adapter, not the component, so it can be tested.
- [x] 1.4 Reject with a clear reason when there is no authenticated session or `inboxContainer()` is `null`, mirroring `SoukaiOrderRepository.fetchUnprocessedOrders`'s precondition.
- [x] 1.5 Wire it in `CDI` (reusing `AuthService` and the existing `PodContainerRegistry`) and expose an accessor for the profile page.

## 2. Profile page Debug row

- [x] 2.1 Replace the empty `<div class="value"></div>` in the "Inbox Upload" row with a file input plus an upload action, following the page's existing markup and `kellermeister-button` styling.
- [x] 2.2 Disable the control and state the reason when the precondition is unmet ("no session" vs "Pod container not resolved yet"), rather than rendering a button that always fails.
- [x] 2.3 Disable the control while an upload is in flight, so one intent cannot produce two uploads against a slow Pod.
- [x] 2.4 Show the outcome in the row: the created resource's URL on success, the reason on failure. Clear the previous outcome when a new upload starts.

## 3. Tests

- [x] 3.1 Adapter tests with a stub session/fetch and a stub container: uploads to `{storageRoot}inbox/kellermeister/`, returns the URL the server reported (not the local file name), and passes the file through unvalidated.
- [x] 3.2 Content-type tests: a file with `type: ""` is uploaded as `text/turtle`; a file with a browser-reported type keeps it. These cover the rule that is otherwise invisible until ingestion silently ignores a file.
- [x] 3.3 Precondition tests: no session → rejects with a stated reason and no request is made; `inboxContainer()` is `null` → same.
- [x] 3.4 Typecheck (`tsc --noEmit`), full test suite, and production build.

## 5. Multiple files

- [x] 5.1 Extend the port with a batch call returning one outcome per file (created URL or reason). It MUST NOT reject because a single file failed — that would discard the outcomes of the files already uploaded — but MUST still reject when the precondition is unmet.
- [x] 5.2 Implement it in the adapter as a sequential loop over the existing single-file upload, catching per file (design Decision 6).
- [x] 5.3 Accept a multi-file selection in the profile page (`multiple`) and render one result line per file, successes and failures together.
- [x] 5.4 Tests: several files all upload and are reported in order; a failure in the middle still uploads the rest and keeps the earlier successes; the precondition still rejects without attempting anything.

## 6. Verification

Verified by the user in the browser: a single file and a multi-file selection both land in the inbox, and the row shows the unavailable state with its reason when the precondition is unmet.

- [x] 6.1 Manual verification against a live Pod (needs Solid credentials): upload a `.ttl` order from the Debug section, confirm the reported URL exists in `{storageRoot}inbox/kellermeister/` (e.g. via the linked Solid File Manager), then open the cellarwork page and confirm the order is ingested and the source document removed from the inbox.
- [x] 6.2 Manual check of the unavailable state: open the profile page logged out and confirm the control is disabled with the reason shown.
