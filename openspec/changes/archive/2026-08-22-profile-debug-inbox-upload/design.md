## Context

The inbox is already modelled in the app: `PodContainerRegistry.inboxContainer()` derives `{storageRoot}inbox/kellermeister/` from the resolved container base and returns `null` while that base is unknown. `SoukaiOrderRepository` reads it with the authenticated Solid engine and deletes ingested source documents with `deleteSolidDataset(..., {fetch: session.fetch})`. So the URL, the session, and the precondition ("logged in AND base resolved") all exist; only writing is new.

The profile page is where the placeholder sits: a "Debug" section whose single row, "Inbox Upload", currently renders `<div class="value"></div>`. The page is otherwise read-only apart from the cellar controls, and it is usable without a session (it falls back to the stored WebID), so the upload control has to cope with there being no session rather than assuming one.

`@inrupt/solid-client` — already a dependency — offers two write paths: `overwriteFile(fileUrl, file, …)` writes to an exact URL, and `saveFileInContainer(folderUrl, file, …)` posts into a container and lets the server pick a free name.

## Goals / Non-Goals

**Goals:**
- Put a chosen file into the Pod inbox in one interaction, from inside the app.
- Make the outcome unambiguous: the resulting URL, or why it failed.
- Upload the file so that the existing ingestion path can actually read it.

**Non-Goals:**
- Validating or parsing the file, or checking that it is a well-formed order. The point is to exercise the real ingestion path, including its failure modes.
- Triggering ingestion from the profile page. Ingestion stays on the cellarwork page; a shortcut here would test a path that does not exist in normal use.
- Listing, previewing, or deleting inbox contents. Separate concerns, and the linked external tools already do it.
- Making this a user-facing feature. It lives in "Debug" and is described as such.

## Decisions

### Decision 1: `saveFileInContainer`, not `overwriteFile`
Post into the container and let the server assign the name.

- **Why:** the inbox is a drop location that ingestion consumes and deletes. Writing to a fixed URL would silently clobber a resource that is queued for ingestion, and re-uploading the same test file twice is a normal thing to do while debugging. Server-assigned names make repeat uploads additive.
- **Trade-off:** the final name is chosen by the server, so it is not predictable from the client. This is why the resulting URL must be reported back (Decision 3) rather than being assumed to be `container + file.name`.

### Decision 2: Fall back to `text/turtle` when the browser reports no content type
Send `file.type` when the browser provides one; otherwise `text/turtle`.

This is the decision that determines whether the feature is useful at all. Browsers derive `File.type` from the OS mapping for the extension, and `.ttl` is typically unmapped, giving `""`. A file posted without a usable content type is stored as an opaque binary rather than an RDF resource, and the inbox read then either skips it or fails — the upload would "succeed" while being invisible to ingestion, which is the worst possible outcome for a debugging tool.

- **Why `text/turtle` as the fallback rather than refusing?** The inbox holds Turtle order resources; that is what this control exists to place there. A file whose type the browser *does* know is uploaded with that type, so non-Turtle files are still possible and honest.
- **Alternative considered:** always force `text/turtle`. Rejected: it would mislabel any other file the user deliberately picks.
- **Alternative considered:** infer from the extension with a mapping table. Rejected as unnecessary; the browser already handles the mapped cases and the single unmapped case that matters here is `.ttl`.

### Decision 3: Report the outcome in the row, not in a dialog or the console
On success the row shows the URL the server created; on failure, the error. Both replace the idle state of the row.

- **Why:** the name is server-assigned, so "it worked" is not enough information to go and look at the resource. A `console.log` would be invisible to the person using the page, and an `alert` would not survive long enough to copy the URL from.
- The control is disabled while an upload is in flight, so a slow Pod cannot produce two uploads from one intent.

### Decision 4: Precondition mirrors ingestion, and is stated rather than hidden
The control is unavailable without an authenticated session or a resolved Pod container base, and says which of the two is missing.

- **Why:** `inboxContainer()` returns `null` before the base is resolved, so there is genuinely nowhere to write. Silently disabling a button in a Debug section invites the conclusion that the feature is broken.
- This is the same precondition `fetchUnprocessedOrders` applies (it returns an empty list when logged out or unresolved), so the two halves of the inbox story behave consistently.

### Decision 5: A port for the upload, adapter in infrastructure
The page calls a small port (e.g. `InboxUploader.upload(file): Promise<string>` returning the created URL) rather than `@inrupt/solid-client` directly; the adapter owns `saveFileInContainer`, the content-type fallback, and the precondition check.

- **Why:** it matches how the rest of the app treats Solid (the page never imports the Solid client today), and it puts the content-type rule somewhere unit-testable. The vitest environment is `node` with no DOM harness, so logic left inside the Lit component cannot be tested — the same reason `syncFailureAction` and `shouldRememberSync` exist.
- The content-type decision in particular is worth testing directly: it is invisible in the UI and only shows up as "ingestion silently ignores my file".

### Decision 6: Several files upload one after another, each with its own outcome
The control accepts a multi-file selection. The files are uploaded sequentially, and every file gets its own result line; one failure does not abort the rest and does not hide the successes.

- **Why sequential rather than concurrent?** They all post into the same container on someone's real Pod, and a debug tool has nothing to gain from saturating it. Sequential also makes the result order match the picking order, so a partial failure is easy to read.
- **Why per-file outcomes rather than one aggregate?** "3 of 5 uploaded" is useless when the point is to find out which order file the server rejected. Each line carries the created URL or the reason.
- **Consequence for the port:** the batch call resolves with the outcomes and does NOT reject on an individual failure — rejecting would discard the successes that came before it. It still rejects when the precondition is unmet, since then nothing can be attempted at all.

## Risks / Trade-offs

- **[Writes to the user's real Pod from a Debug section]** → It writes only into the inbox container the app already owns and consumes, never to the data container. The session precondition means it cannot fire unauthenticated.
- **[An uploaded file that is not a valid order]** → Deliberately not validated. It surfaces at ingestion, which is the behaviour under test. The upload reports the URL, so a bad resource can be found and removed with the linked external tools.
- **[The server rejects an unknown content type]** → Reported as a failure in the row, with the server's message; nothing is retried automatically.
- **[A large multi-file selection is slow]** → Sequential uploads against a remote Pod take as long as they take; the control stays disabled and shows progress while running. Acceptable for a debug affordance.
- **[Server-assigned names accumulate]** → Repeated debug uploads leave several resources in the inbox. Ingestion consumes and deletes them, so the normal path cleans up; abandoned files need the external tools.
- **[A `text/turtle` fallback mislabels a non-Turtle file with no browser type]** → Possible in principle (an extension the OS does not know). Accepted: the alternative fails the primary use case, and the row shows what was uploaded where.

## Migration Plan

Additive and code-only: a new port, a new adapter, and a row that currently renders nothing. No data, spec-level behaviour, or Pod layout changes elsewhere. Rollback = restore the empty `<div class="value"></div>` and drop the port and adapter; nothing else references them.

## Open Questions

None.
