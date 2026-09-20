## Why

The cellar bottle view groups bottles by product **name**, so two genuinely distinct products that happen to share an identical name collapse into one row. Because the app mints a distinct product resource per order item, buying the same wine in two orders produces two products with the same name — today they merge, hiding that they are separate products (with their own price, source/"Quelle", and — since the `bottle-rating` change — their own ratings). Grouping by product **id** keeps distinct products distinct.

## What Changes

- Group the cellar view's bottles by **product id** instead of product name.
- Two products with identical names but different ids are shown as **two separate rows**; bottles are only combined when they belong to the same product id.
- Preserve the existing display order (rows sorted by product name, so identically-named products remain adjacent).
- The per-row product shown (name, price, source, ratings) is that group's own product, so each row reflects exactly the product its bottles belong to.

## Capabilities

### New Capabilities
- `cellar-bottle-grouping`: How the cellar view groups a cellar's bottles into product rows — by product id, with same-name/different-id products shown separately, ordered by name.

### Modified Capabilities
<!-- No existing spec defines the cellar view's grouping behavior; introduced as a new capability. -->

## Impact

- **Application** (`src/application/`): `KellermeisterService.bottlesFromCellarGroupedByProduct` changes its grouping key from product name to product id (return shape stays a `Map<string, Bottle[]>`, now keyed by id; ordering stays by name).
- **Web** (`src/infrastructure/web/pages/cellar-page.ts`): consumes the grouped map's values only, so it continues to render one row per group with `bottleGroup[0]`'s product and `bottleGroup.length` as the count — no template change expected.
- **Related:** complements `bottle-rating` — with per-id grouping, each row's product resolves its own bottles' ratings instead of an arbitrary same-name product's.
