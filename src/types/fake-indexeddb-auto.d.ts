// `fake-indexeddb/auto` is a side-effect-only module that installs the
// IndexedDB globals. Its package `exports["./auto"]` map has no `types`
// condition, so under `moduleResolution: "bundler"` TypeScript cannot resolve
// its declarations (TS2307). This ambient declaration lets the side-effect
// import type-check; runtime behavior is unchanged.
declare module "fake-indexeddb/auto";
