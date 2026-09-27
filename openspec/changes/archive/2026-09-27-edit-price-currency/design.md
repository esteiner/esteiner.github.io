## Context

`product-component` renders each detail as a `.group` with a label and a value. In edit mode, `numberInput`, `textField` and `yearInput` render inputs that write through to the model on `input` (`writeThrough` → the `product-changed` event) and persist on `change` (`updateProduct`). "Trinkfenster" already puts two inputs on one line inside `<span class="value range">`, styled so that each `.edit-input` is `5em` wide. The price row renders `numberInput(p.getPrice(), p.setPrice)` in edit mode and the slotted `bottle-component` price text (`price currency`) otherwise. `Product` has `getPriceCurrency()` but no setter.

## Goals / Non-Goals

**Goals:**
- Edit the price and the currency side by side, in the same style as Trinkfenster.
- The currency persists and shows up immediately in the read-only row.

**Non-Goals:**
- A currency picker or list of ISO codes. The currency stays free text, like in the photo-capture dialog.
- Clearing the price. An empty price input is still ignored by `numberInput`, which is unchanged.
- Editing the order item's price or currency (order view, read-only).

## Decisions

- **Reuse the `.value.range` wrapper**: `${numberInput(price)} ${currencyInput}`, without the "–" separator used by Trinkfenster. Alternative: a new flex wrapper. Rejected because the range wrapper already gives the aligned two-input row.
- **Currency input via `textField`**: in edit mode, `textField` renders exactly the `input.value.edit-input` wired to `writeThrough`/`persist`. The price row calls it only inside the `editing` branch, so its read-only span branch is never used here. It gets an extra class `currency-input` (a small optional `extraClass` parameter on `textField`), with CSS `width: 4em` and `aria-label="Währung"`, and the price input gets `aria-label="Preis"`. Alternative: a separate `currencyInput` helper. Rejected because it would duplicate `textField`.
- **Empty currency → `undefined`**: `setPriceCurrency(value.trim() || undefined)`, so the read-only row renders just the price and the stored document drops the triple, instead of storing `""`.
- **`setPriceCurrency(currency: string | undefined)`** on `Product`/`SoukaiProduct`, which assigns `this.priceCurrency`.
- The read-only row needs no change. `bottle-component` renders `${product.getPrice()} ${product.getPriceCurrency()}` and re-renders on `product-changed`.

## Risks / Trade-offs

- [Free-text currency invites inconsistent values ("chf", "Fr.")] → Same as today's order and photo-capture input. It is only display text.
- [The `.range` input width (5em) is tight for large prices] → Unchanged from the Trinkfenster years. Prices here are small integers or decimals.
