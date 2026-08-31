## Context

Kellermeister persists domain aggregates (`Cellar`, `Bottle`, `Product`, `Order`, `OrderItem`, `Seller`, `Customer`, `ContactPoint`, `Rating`) as RDF via `soukai` + `soukai-solid` `0.7.x`. Models are split into a `*.schema.ts` (schema via `defineSolidModelSchema` + `FieldType`) and a `*.ts` (class extending the schema, adding domain accessors and `useSoftDeletes`). The runtime is **local-first**: `main.ts` installs an `IndexedDBEngine("kellermeister")` as the global engine, and the sync layer (`SolidSyncService`, `engineScope.ts`) swaps in a scoped `SolidEngine` only for Pod reconciliation. History/operation-log and soft deletes drive cross-device sync.

The reference migration ([Ramen commit 5096dbb](https://github.com/NoelDeMartin/ramen/commit/5096dbb1e4938b7b4b458451ef9027f90543ea6f)) shows the target API shape:
- Schemas: `defineSolidModelSchema` + `FieldType` → `defineSchema` (from `soukai-bis`) + Zod validators (`string()`, `number()`, `array()`, `url()`).
- `rdfsClass`/`rdfsClasses` → `rdfClass`; field `rdfProperty` via a `.rdfProperty('…')` modifier; slug via `.useAsSlug()`.
- Required-by-default; nullable via `.optional()`/`.nullable()`.
- Relations move into the schema (`belongsToMany`, `contains`, `defineContainerSchema`); relation types renamed (`SolidBelongsToManyRelation` → `BelongsToManyRelation`).
- Boot: `bootSolidModels()` → `import 'soukai-bis/patch-zod'` + `bootCoreModels(true)`/`bootModels(...)`.
- Deps: add `soukai-bis` and `zod` (peer deps include `web-streams-polyfill`).

## Goals / Non-Goals

**Goals:**
- Replace `soukai`/`soukai-solid` with `soukai-bis` across schemas, models, repositories, sync, boot, and tests.
- Preserve every RDF field/property/class IRI and required/optional semantic so existing Pod and IndexedDB data stays readable.
- Keep the local-first engine topology and the `engineScope` serialization contract intact.
- Keep `timestamps`, `history`, and soft-delete behavior working (they underpin sync).
- Keep the existing unit + e2e test suites green.

**Non-Goals:**
- No change to domain models, use cases, UI, or routing.
- No new persisted fields, no RDF vocabulary changes, no data migration of existing pods.
- No change to the sync algorithm itself — only the library calls it is built on.
- Not adopting soukai-bis container/type-index features beyond what the current app already relies on.

## Decisions

**1. Follow the Ramen commit as the canonical API map.** It is the same maintainer's reference migration; we mirror its import renames and schema shape rather than reinvent them. Where our app uses field types Ramen does not (`FieldType.Key`, `FieldType.Date`, `FieldType.Array` of keys), we map them to the soukai-bis equivalents by consulting the `soukai-bis` type defs at implementation time (likely `url()` for keys/IRIs, a date validator for dates, `array(url())` for key arrays). Each mapping is verified against a round-trip read of pre-migration RDF.

**2. Keep the two-file schema/class split.** Minimizes churn: each `*.schema.ts` is rewritten in place to `defineSchema`, and each `*.ts` keeps its domain accessors, changing only the base-class import and relation types. `useSoftDeletes(true)` stays on the class unless soukai-bis relocates it into schema config (resolved during implementation).

**3. Preserve the local-first engine topology verbatim.** `IndexedDBEngine` and the scoped Solid engine are re-imported from `soukai-bis`; `engineScope.ts`'s `withEngine` serialization is retained as-is. This is the app's most fragile invariant (see the module docstring) so it changes only by import path, not by logic.

**4. Pin an explicit soukai-bis version.** Ramen tracks `"next"`; for a deployable app we prefer pinning the exact resolved pre-release build in `package.json` (and rely on `package-lock.json`) to avoid surprise breakage, rather than floating on `next`. Add `zod` (v4) and `web-streams-polyfill` as required, wiring polyfills through `vite.config.ts` / `vite-plugin-node-polyfills` if the browser build needs them.

**5. Migrate tests alongside source.** Every `*.test.ts` importing `soukai`/`soukai-solid` is updated in the same change; the `IndexedDBEngine + fake-indexeddb` setup used for history/sync tests is retained (per project memory), only re-pointed to `soukai-bis`.

## Risks / Trade-offs

- **soukai-bis is a pre-release (`0.0.0-next.*`).** → Pin the exact build; gate the merge on the full unit + e2e suite passing; keep the change isolated on the `soukai-bis` branch for easy rollback (revert dep + schema commits).
- **Silent RDF drift** (a field mapped to a different property/type) corrupts interop with existing pods. → For each model, assert unchanged RDF output by round-tripping a fixture written by the old version before deleting old code paths; diff serialized Turtle where feasible.
- **Engine-swap regressions** break all local work if a scope leaks (documented failure mode). → Do not touch `engineScope` logic; run `engineScope.test.ts` and the local-first/identity-switch suites as the gate.
- **Zod v4 / web-streams polyfill bundling** may break the Vite browser build or PWA. → Verify `npm run build` (tsc + vitest + vite) and a `preview` smoke test; add polyfills only if the build demands them.
- **Relation API relocation** (belongsToMany/contains moving into schema) may not map 1:1 to our current relations. → Inventory actual relations in use (Order↔OrderItem, Product/Bottle links) before rewriting; port each explicitly.

## Migration Plan

1. Add `soukai-bis` (pinned) + `zod` (+ polyfills) to `package.json`; install.
2. Add the `soukai-bis/patch-zod` import and switch boot in `main.ts` and all test setups; get the app booting.
3. Rewrite `*.schema.ts` files one aggregate at a time, verifying RDF round-trip against a fixture.
4. Update model classes (base import, relation types, `useSoftDeletes`) and factories.
5. Update repositories, `localFirstQuery.ts`, `engineScope.ts` (import-only), and `SolidSyncService.ts`.
6. Migrate `*.test.ts` imports; run `npm run test` until green.
7. Run `npm run build` and the Playwright e2e suite (`npm run test:e2e`); smoke-test login + sync against the local Community Solid Server.
8. Remove `soukai`/`soukai-solid` from deps once no imports remain.

**Rollback:** revert the branch; deps and schemas change together so a single revert restores the `0.7.x` state.

## Open Questions

- Exact soukai-bis exports for `FieldType.Key` (IRI), `FieldType.Date`, and key-array fields — confirm against the published type defs during step 3.
- Does soukai-bis express `history: true` / operation-log and `useSoftDeletes` the same way, or is configuration relocated into `defineSchema`?
- Are `web-streams-polyfill` / zod needed in the browser bundle, or only in the Node/vitest test environment?
- Should we pin an exact `soukai-bis` build (preferred here) or track `next` to stay aligned with the reference app?
