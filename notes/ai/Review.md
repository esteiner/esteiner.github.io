❯ Please review this project and provide a precise rating on the quality.

Searched for 1 pattern, read 1 file, listed 1 directory (ctrl+o to expand)

● Explore(Code quality audit of kellermeister)
⎿  Done (33 tool uses · 59.5k tokens · 1m 5s)
(ctrl+o to expand)

● Kellermeister — Quality Review

Rating: 6.5 / 10 — solid architectural foundation undermined by infrastructure decisions and one god service.

Strengths

- Clean architecture is real, not just folder names. src/domain/ has no framework deps; the CDI singleton stays inside infrastructure/cdi/CDI.ts and is not referenced from domain code.
- Repository interfaces are well-factored (e.g. CellarRepository.ts, OrderRepository.ts) — swapping Soukai for another backend would be feasible.
- Tests that exist are good. KellermeisterService.test.ts and ProductFilter.test.ts use proper factories, mocks, and edge cases — not snapshot fluff.
- TS strictness on (strict, noUnusedLocals, noUnusedParameters) and Lit components use safe-by-default templating.
- Inrupt auth is delegated, not reinvented → small custom auth surface.

Weaknesses

Critical

- Monolithic bottle document (SoukaiBottlesStorageRepository.ts) — all bottles in one Turtle file. notes/Performance-enhancements.md already documents the >500-bottle cliff. Full re-deserialization on every read, cache invalidated on every write. This is the headline scaling problem.

Major

- God service. KellermeisterService.ts (~394 lines) owns cellars, bottles, orders, filtering, grouping, ingestion, transfer, disposal. Splitting into BottleTransferService / OrderIngestionService / CellarQueryService would pay off quickly.
- any leakage in infrastructure. SolidService.getAuthenticatedFetch(): any; (document as any)["@graph"] as any[] in Soukai deserialization. Strict mode is undermined where it matters most — the trust boundary with external RDF.
- Cache invalidation contradicts comments. After save, cache is dropped instead of updated in-memory → extra Pod round-trips on flows that intend to be cheap.
- Silent error swallowing in repositories returning null (e.g. SoukaiCellarRepository.ts:45–54) — "not found" vs "network error" vs "ACL denied" are indistinguishable to callers.

Minor

- CLAUDE.md lies about tests — claims tests are disabled, but package.json runs vitest run inside build. Fix the doc.
- console.log everywhere (~87 instances) — needs a logger abstraction with levels.
- new Date(1900, 0, 1) as sentinel in KellermeisterService.ts — use null/undefined.
- Typo: orderRespository in KellermeisterService.ts.
- Commented-out code blocks in KellermeisterService.ts should go.
- Anemic domain models — interfaces with no invariants (e.g. bottle rating not constrained). Acceptable, but a missed opportunity given the otherwise rich layering.

Security

No XSS smell — unsafeHTML is only used on statically imported SVGs in kellermeister-button.ts. No hardcoded secrets. The main residual risk is no schema validation of RDF coming back from the Pod; a malicious or buggy Pod can feed the deserializer arbitrary shapes — and the as any casts will not catch it.

Headline recommendation

If you only do three things:

1. Split bottles into per-cellar documents — kills the scaling cliff.
2. Decompose KellermeisterService — 3–4 focused services.
3. Eliminate any at the Soukai boundary + add lightweight schema validation.

Everything else is polish.