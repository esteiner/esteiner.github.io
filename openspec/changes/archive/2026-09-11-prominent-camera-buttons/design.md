## Context

`renderCamera()` in `kellermeister-footer.ts` renders the camera overlay with its controls as:

```html
<div class="camera-controls">
  <kellermeister-button text="Aufnehmen" icon="umbuchen" size="small">…
  <kellermeister-button text="Abbrechen" icon="umbuchen" size="small">…
</div>
```

`kellermeister-button size="small"` renders a small text+icon control; on the dark overlay it looks like a faint icon-link, and the `umbuchen` icon is unrelated to the action. The app already has a real-button style, `.dialog-btn` / `.dialog-btn-ok` / `.dialog-btn-cancel`, used by the source chooser (in this same component) and the cellar-delete dialog.

## Goals / Non-Goals

**Goals:**
- Make the shutter and cancel look like prominent, real buttons, reusing the app's dialog-button language.
- Keep the same accessible names and behavior (so existing e2e selectors keep working).

**Non-Goals:**
- No change to capture/conversion/ingestion logic or the two-step flow.
- No redesign of the overlay layout beyond the controls.
- No change to the source-chooser dialog or the file-mode banner.

## Decisions

### Decision 1: Use real `<button>`s with the dialog-button style

Replace the two `kellermeister-button`s with `<button class="camera-btn …">` elements: **Aufnehmen** as the primary (filled/green, like `.dialog-btn-ok`) and **Abbrechen** as the secondary (like `.dialog-btn-cancel`). The camera overlay lives in the component's shadow DOM, so these are styled by the component's own stylesheet (unlike the portaled source dialog, which needed inlined styles).

- **Why reuse the dialog-button look:** consistency with the source chooser and delete dialog, and it already reads as a real button.
- **Why not keep `kellermeister-button`:** `size="small"` is not prominent, and it carries an icon slot that adds a meaningless glyph here; a plain styled button is simpler and clearer.

### Decision 2: Prominence tuning for the dark overlay

Give the camera buttons a bit more weight than the dialog buttons (larger padding/font, min-width, and full-tap targets) since they sit on a photo preview and the shutter is the primary action. Keep the cancel visually secondary. Ensure adequate contrast on the dark background (the primary is green-on-white text; the secondary uses a light background so it stands out against the dark overlay).

## Risks / Trade-offs

- **Selector stability for tests** → Keep the German button text ("Aufnehmen"/"Abbrechen") so `getByRole('button', { name })` in the e2e keeps matching. Using real `<button>` elements actually improves the accessible role.
- **Style duplication** → Minor: add a small `.camera-btn*` ruleset. Could share with `.dialog-btn`, but the source-dialog styles are inlined in a portal, so a small dedicated ruleset in the component stylesheet is clearer than trying to share.

## Migration Plan

Purely a presentational change in one component method plus a few CSS rules. No data/config/API impact; revert by restoring the previous markup.
