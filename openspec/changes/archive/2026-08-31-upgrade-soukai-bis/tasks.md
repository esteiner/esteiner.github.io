## 1. Dependencies & Boot

- [x] 1.1 Add `soukai-bis` and `zod` (v4) to `package.json` (installed `soukai-bis@next` = `0.0.0-next.38850539…`; peer dep is `zod` only — `web-streams-polyfill` NOT required)
- [x] 1.2 Add the `import 'soukai-bis/patch-zod'` side-effect and switch `src/infrastructure/web/main.ts` boot to the `soukai-bis` boot API (`bootCoreModels` + `bootModels` via new `soukai/bootModels.ts`), keeping the IndexedDB engine as the global engine
- [ ] 1.3 Confirm the app boots (`npm run dev`) with the new deps before touching schemas — DEFERRED (needs repositories/sync migrated first; app won't compile until §4 done)

## 2. Schema Migration

- [x] 2.1 Rewrite `SoukaiCellar.schema.ts` to `defineSchema` + Zod (self-map `km` → `km:` to reproduce the legacy opaque `<km:displayOrder>` predicate that bis otherwise refuses to expand)
- [x] 2.2 Rewrite `SoukaiBottle.schema.ts` (`cellarUrl` stays a `string()` literal — legacy typed it String not Key; `productUrl`/`orderItemId` → `url()`; product relation moved to schema)
- [x] 2.3 Rewrite `SoukaiProduct.schema.ts` (orderItem + ratings relations moved to schema)
- [x] 2.4 Rewrite `SoukaiOrder.schema.ts` (`date()`, `array(url())`; seller/customer/positions relations moved to schema)
- [x] 2.5 Rewrite `SoukaiOrderItem.schema.ts` (order/product relations moved to schema)
- [x] 2.6 Rewrite `SoukaiSeller/Customer/ContactPoint/Rating.schema.ts` (Customer's vestigial `url` field dropped; `timestamps:false, history:false` set explicitly since bis defaults timestamps to true)
- [x] 2.7 VERIFIED RDF preservation: captured ground-truth Turtle from the old models, then asserted the migrated models emit byte-identical domain triples for all 9 aggregates (temp round-trip test, since removed)

## 3. Model Classes, Relations & Factories

- [x] 3.1 Updated every `Soukai*.ts` model class: extend the schema base, retype relations to bis (`BelongsToOneRelation`/`BelongsToManyRelation<this, …>`), drop `static timestamps`, replace `getIdAttribute()`/`this.id` with `this.url`
- [x] 3.2 Inventoried all relations (Bottle→product; Order→seller/customer/positions; Customer→contactPoint; OrderItem→order/product; Product→orderItem/ratings) and moved them into the schemas via `requireBootedModel` thunks (avoids import cycles), preserving `usingSameDocument`
- [x] 3.3 `useSoftDeletes(true)` → schema `tombstone` (bis auto-enables `tombstone` when `history:true`, which matches exactly the 4 models that used soft deletes: Cellar/Bottle/Product/Order)
- [x] 3.4 Updated factories: `relatedX.addRelated()` → `setRelated()` (bis `addRelated` is multi-relation only; single relations use `setRelated`/`attach`). NOTE: relation-persistence (foreign-key wiring on save) still needs runtime validation via the test suite.

## 4. Repositories, Query & Engine Scope

- [x] 4.1 Updated all repositories: centralized boot via `bootSoukaiModels()`; `Model.from(c).all()` → `Model.all({from:c})`; dropped `isSoftDeleted()` checks (VERIFIED via spike: bis auto-excludes tombstoned docs from `all()`/`find()`); `mintUrl(url,false,"it")` → `mintUrl({documentUrl,documentExists:false,resourceHash})`; `getSourceDocumentUrl()` → `getDocumentUrl()`; `new SolidEngine(fetch)` → `new SolidEngine({fetch})`
- [x] 4.2 Updated `localFirstQuery.ts` (`fetchLive`) to the bis query API; removed the now-redundant soft-delete filter
- [x] 4.3 Re-pointed `engineScope.ts` to `soukai-bis`: `withEngine` → `runWithEngine`, serialization logic unchanged
- [x] 4.4a Updated `IndexedDbLocalDataStore` wipe: bis `IndexedDBEngine` has no `purgeDatabase()` → `close()` + `deleteDatabase(getNamespace())`. Also `main.ts`: `setNamespace("kellermeister")` + `new IndexedDBEngine()` (bis ignores the ctor name arg — DB is named after the namespace)
- [x] 4.4b **REWROTE `SolidSyncService.ts` on bis `Sync`** — see §7. Type-clean; re-home phase unit-tested.

**STATUS:** all non-sync, non-test application source type-checks cleanly under soukai-bis. RDF output verified byte-identical. Remaining tsc errors: SolidSyncService (8, §7) + tests (66, §5/§7).

## 5. Tests

- [x] 5.1 Migrated all `*.test.ts` to the new `src/testing/soukai.ts` harness (InMemory per test/role; per-test-namespace IndexedDB where real IDB is exercised). Deleted `per-resource-save.spike.test.ts` (spike, self-marked for deletion; pinned OLD soukai-solid semantics). Trimmed `local-first.test.ts` to its pod-independent tests (offline reads, well-known cellars); its pod-sync tests moved to e2e (they can't faithfully simulate bis `Sync`) and its re-home assertions are covered by `SolidSyncService.test.ts`. **Also fixed a real runtime bug: direct relation-attribute assignment (`bottle.product = …`, `order.seller = …`, `addOrderItem`, `createRating`) is a no-op in bis → switched to `setRelated`/`addRelated`.**
- [x] 5.2 `npm run test` GREEN: 167 unit tests across 21 files.
- [x] 5.3 Playwright e2e (`npm run test:e2e`) GREEN against the local Community Solid Server: login → bis `Sync.run` pulls the Pod data (32s) → Hütte cellar lists exactly one bottle. Validates the new sync end-to-end.

## 6. Build, Verify & Cleanup

- [x] 6.1 `npm run build` (tsc + vitest + vite) PASSES. 0 tsc errors; soukai-bis + zod bundle cleanly (no polyfill needed). Fixed vitest config to scope `include` to `src/**/*.test.ts` so it stops collecting the Playwright e2e `.spec.ts`.
- [x] 6.2 Login + Pod sync validated via the e2e (§5.3) — supersedes a manual preview smoke test.
- [x] 6.3 Removed `soukai` and `soukai-solid` from `package.json` (grepped clean first; migrated the last holdout — the unused `domain/User/schemas/User.schema.ts` — to bis). Only `soukai-bis` remains.

## 7. Sync-layer rewrite on bis `Sync` (DECIDED: adopt built-in Sync)

The proposal/design assumed the sync algorithm was unchanged. FALSE: bis removes
`Model.synchronize(a,b)`/`isSoftDeleted()`/`forceDelete()`/static `from()` and
replaces them with a document-level `Sync` job (`SyncConfig`: `userProfile`,
`localEngine`, `remoteEngine`, `typeIndexes`, `applicationModels`) plus a
`MigrateLocalUrls` job for the `local://` → Pod re-homing the app already does by
hand. **User chose to adopt bis's built-in `Sync`.**

- [x] 7.1 Decision: adopt bis's built-in `Sync` job
- [x] 7.2 `SolidUserProfile` sourced via solid-utils `fetchLoginUserProfile(webId, {fetch})`, injected into `SolidSyncService` (default; overridable in tests). No CDI change — constructor signature preserved.
- [x] 7.3 Rewrote `SolidSyncService.synchronize()` = `rehome` (`MigrateLocalUrls` local://→Pod + `fixCellarReferences` for the string-literal ref MigrateLocalUrls can't touch) + `Sync.run({userProfile, localEngine, remoteEngine, applicationModels})`. 4 aggregate roots registered under `private/kellermeister/v1/<collection>`; same-document relations travel inside their parent doc; the old custom sweep/rebuild is gone. **Re-home phase unit-tested & GREEN** (`SolidSyncService.test.ts`); `Sync.run` push/pull needs CSS e2e (§7.5).
- [x] 7.4 **Test isolation redesigned + proven.** bis `InMemoryEngine` is per-instance isolated and satisfies `ManagesDocuments`, so tests use a fresh `InMemoryEngine()` per test/role (named IDB engines no longer isolate). Added `src/testing/soukai.ts` (`installMemoryEngine`/`createMemoryEngine`/`installIndexedDbEngine`) and `soukai/engineContext.ts` (the async context manager bis requires for `runWithEngine`, wired into `bootSoukaiModels`). Migrated + GREEN: `engineScope.test.ts`, `IndexedDbLocalDataStore.test.ts`. Discovered: bis validates `url` via Zod `url()`, so tests using bare-id urls need real-URL data (tracked in §5).
- [x] 7.5 Validated sync end-to-end against the local CSS (§5.3). Root cause found & fixed: bis `Sync` **pull** only reads containers registered in a `typeIndex` passed via `typeIndexes` — the legacy Pod has none (old app used fixed paths). `SolidSyncService.buildTypeIndex(base)` now supplies an in-memory private type index registering the 4 containers, so pull discovers the seed data. (First attempt with `typeIndexes: []` finished in 0.1s pulling nothing; with the type index it pulls in ~32s and the cellars load.)
