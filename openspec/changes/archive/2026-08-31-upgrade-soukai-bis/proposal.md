## Why

The app's RDF persistence layer is built on `soukai` + `soukai-solid` `0.7.x`. Upstream development has moved to the next-generation `soukai-bis` line, which replaces the bespoke `FieldType` schema DSL with Zod-based schemas, simplifies model/relation definitions, and consolidates the Solid integration into a single package. Migrating now keeps us on the maintained line, unlocks Zod's validation and type-inference, and mirrors the reference migration already completed for the Ramen app ([commit 5096dbb](https://github.com/NoelDeMartin/ramen/commit/5096dbb1e4938b7b4b458451ef9027f90543ea6f)).

## What Changes

- **BREAKING (dev deps):** Add `soukai-bis` and `zod`; move `soukai`/`soukai-solid` usage onto the `soukai-bis` API. The three imported entry points (`soukai`, `soukai-solid`) are consolidated under `soukai-bis`.
- Rewrite every `*.schema.ts` (Cellar, Bottle, Product, Order, OrderItem, Seller, Customer, ContactPoint, Rating) from `defineSolidModelSchema` + `FieldType` to `defineSchema` + Zod validators (`string()`, `number()`, `url()`, `array()`, etc.), preserving each field's `rdfProperty`, RDF classes/contexts, `timestamps`, `history`, and required/optional semantics.
- Update model classes to extend the new schema-derived base and use the renamed relation types (e.g. `SolidBelongsToManyRelation` → `BelongsToManyRelation`); move relation wiring into schemas where the new API expects it.
- Update the boot sequence (`main.ts` and all test setups) from `bootSolidModels()` + `setEngine(new IndexedDBEngine(...))` to the `soukai-bis` equivalent (`bootCoreModels`/`bootModels`, `soukai-bis/patch-zod` side-effect import), keeping the **local-first IndexedDB engine as the global engine** and the **scoped `SolidEngine` for sync** (`engineScope.ts`, `SolidSyncService.ts`).
- Update repositories (`SoukaiCellarRepository`, `SoukaiBottleRepository`, `SoukaiProductRepository`, `SoukaiOrderRepository`) and factories for any renamed `bootModels`/query/save/`useSoftDeletes` APIs.
- Preserve all existing runtime behavior: local-first persistence, soft deletes, operation-log history, per-resource save, identity-scoped local data, and Pod synchronization — this is a library swap, **not** a behavior change.

## Capabilities

### New Capabilities
- `soukai-bis-data-layer`: The RDF/Solid persistence layer MUST be provided by `soukai-bis` with Zod-based schemas, replacing the `soukai`/`soukai-solid` `FieldType` DSL while preserving the existing local-first engine topology, soft deletes, and history semantics.

### Modified Capabilities
<!-- No spec-level requirement changes: local-persistence, pod-synchronization, identity-scoped-local-data, resource-identity, well-known-cellars, and inbox-order-ingestion keep their observable behavior. This is an implementation-library migration. -->

## Impact

- **Dependencies:** `package.json`/`package-lock.json` — add `soukai-bis`, `zod`; retarget `soukai`/`soukai-solid`.
- **Schemas:** all `src/infrastructure/soukai/model/*.schema.ts`.
- **Models & factories:** `src/infrastructure/soukai/model/Soukai*.ts`, `Soukai*Factory.ts`.
- **Repositories:** `src/infrastructure/soukai/Soukai*Repository.ts`, `localFirstQuery.ts`, `engineScope.ts`.
- **Sync/engine:** `src/infrastructure/solid/SolidSyncService.ts`, `src/infrastructure/local/IndexedDb*Store.ts`.
- **Boot:** `src/infrastructure/web/main.ts`.
- **Tests:** all `*.test.ts` importing from `soukai`/`soukai-solid` (KellermeisterService, local-first, identity-switch, IndexedDb*, engineScope, per-resource-save, SoukaiOrderRepository).
- **Build config:** `vite.config.ts` (polyfills for `web-streams-polyfill`/zod as needed), `tsconfig.json` if type resolution changes.
