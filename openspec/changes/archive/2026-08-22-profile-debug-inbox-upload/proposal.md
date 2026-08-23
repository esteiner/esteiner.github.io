## Why

Inbox order ingestion is the one part of the app that cannot be exercised locally: it reads real resources from `{storageRoot}inbox/kellermeister/` on the Pod, so testing it means putting a file there with an external tool (the profile page already links to Solid File Manager and the SolidOS Databrowser for exactly this reason). That is a slow loop for a feature that is otherwise developed offline.

The profile page already has a "Debug" section with an "Inbox Upload" row whose value is an empty placeholder. Filling it with an upload control removes the detour: pick a file, it lands in the inbox, and opening the cellarwork page ingests it.

## What Changes

- The "Inbox Upload" row in the profile page's Debug section SHALL offer a control to pick a local file and upload it to the Pod inbox container `{storageRoot}inbox/kellermeister/`.
- The upload SHALL use the authenticated Solid session, and SHALL be unavailable (with a visible reason) when there is no session or the Pod container base has not been resolved — the same precondition inbox ingestion already has.
- The result SHALL be reported in place: the URL of the created resource on success, or the reason on failure. No silent success.
- The file SHALL be uploaded with a content type that makes it ingestible: browsers commonly report no type for `.ttl` files, so the system falls back to `text/turtle` rather than letting the server store an order as an opaque binary.
- Uploading SHALL NOT overwrite an existing inbox resource; the server assigns a free name.

Not included: validating that the file is a well-formed order, or triggering ingestion from the profile page. Ingestion stays where it is (opening the cellarwork page), so this change tests the real path rather than a shortcut.

## Capabilities

### New Capabilities
<!-- None. This is an operator affordance on an existing page, against the existing inbox container. -->

### Modified Capabilities
- `profile-overview`: gains a requirement for the Debug section's inbox upload — its precondition (authenticated session and resolved Pod base), where the file is written, and how the outcome is reported.

## Impact

- `src/infrastructure/web/pages/profile-page.ts` — the file input, the upload handler, and the status/result line replacing the empty `<div class="value"></div>`.
- Upload port + adapter so the page does not talk to `@inrupt/solid-client` directly; the adapter uses `saveFileInContainer`, which the project does not use yet (it currently only calls `deleteSolidDataset`, in `SoukaiOrderRepository.deleteFromInbox`).
- `src/infrastructure/cdi/CDI.ts` — wiring, reusing `PodContainerRegistry.inboxContainer()` (already the single source of the inbox URL) and the existing `AuthService` session.
- No domain, sync, or local-persistence impact: the file goes straight to the Pod and is never written to IndexedDB. It becomes visible to the app only through the existing inbox ingestion path.
- Debug-only surface: it writes to the user's Pod, so it is guarded by the same session precondition as ingestion and reports exactly what it did.
