## Context

The footer captures front + back (camera or file) and then calls `convertAndIngest(front, back)` immediately. Two dialogs already exist in the component, portaled to `<body>` (the footer host's `backdrop-filter` traps `position:fixed`, so a real centered modal must live outside the footer): the source chooser via `updatePortal()` / `renderSourceDialog()`. The conversion request is `{front, back}` base64 JSON, behind `OrderConversionService`.

This change inserts a details step between capture and conversion, and threads optional `place`/`price` into the request.

## Goals / Non-Goals

**Goals:**
- Show a details dialog (Ort, Preis; both optional) after both photos, styled like the existing dialog, with Abbrechen/Senden.
- Pass entered details to the conversion API as optional fields; omit blanks.

**Non-Goals:**
- No validation/parsing of Preis (free text, as specified).
- No change to ingestion, the mock's fixed output, or the two-step capture itself.
- No persistence of details beyond the request.

## Decisions

### Decision 1: Reuse the portal + dialog styling for a second dialog

Generalize the existing dialog machinery: `updatePortal()` renders **either** the source chooser (when `capturing==='front' && source===null`) **or** the new details dialog (when a new `detailsOpen` flag is set), into the same `<body>` portal, with shared dialog styles (rename the wrapper to a neutral `.km-footer-dialog` and add `.dialog-input`/`.dialog-field` rules). Keeps one portal and one visual language.

### Decision 2: Stash the blobs; gate conversion on Senden

Both capture completions (file back-select, camera back-shutter) stop capturing and call `openDetails(front, back)` — which stashes the two blobs (`pendingFront`/`pendingBack`) and sets `detailsOpen = true` — instead of converting directly. **Senden** reads the inputs and calls `convertAndIngest(front, back, {place, price})`; **Abbrechen** clears the pending blobs and resets. The camera stream is already stopped before the dialog (unchanged), so cancel just discards.

### Decision 3: Read inputs from the DOM, not reactive state

The two text inputs are plain (no value binding), read from the portal on Senden. Because `renderDetailsDialog()` doesn't bind `value`, incidental re-renders of the portal don't clobber what the user typed, and there's no per-keystroke re-render churn.

### Decision 4: Optional details as omitted-when-blank request fields

`OrderConversionService.convert(front, back, details?)` gains an optional `details: {place?, price?}`. `HttpOrderConversionService` adds `place`/`price` to the JSON body only when non-empty (so the existing `{front, back}` shape is unchanged when no details are given — no test/contract churn). `MockOrderConversionService` ignores details. The OpenAPI request schema gains optional `place`/`price` strings.

## Risks / Trade-offs

- **Two concurrent open changes touch `photo-order-capture`** → This change modifies the *Convert* requirement and adds a *details* requirement; the open `prominent-camera-buttons` change touches the *capture* and *camera-buttons* requirements. Disjoint, so sync order does not matter.
- **DOM-read inputs vs. state** → Slightly less "Lit-idiomatic", but avoids focus/cursor issues in a portaled light-DOM form; values are read once on Senden.

## Migration Plan

Additive. New optional arg + request fields (blanks omitted) keep the existing contract/tests valid. Revert by removing the dialog step and the optional arg.
