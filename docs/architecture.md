# Architecture

```
db/migrations/*.sql ──► SQLite (db/base.sqlite)
db/seeds/*.ts ────────►   │
                          │  npm run research:rank     src/research/scoring.ts       → derived_scores
                          │  npm run research:baskets  src/research/basket-builder.ts → baskets, basket_items,
                          │                            containers.ts, matching.ts       basket_containers, …
                          │  npm run data:validate     src/research/validation.ts     → fails on missing provenance
                          ▼
             src/data/sqlite/export.ts  ──►  src/data/generated/snapshot.json   (DataSnapshot, ~330 KB)
                                                   │
                                                   ▼
                                     src/data/api.ts   getCurrentBase(), getIngredientBySlug(), …
                                                   │
                                                   ▼
                          React pages (src/pages) ─► prerendered HTML (dist/) + hydrated client
```

## Boundaries

- **The UI never touches SQLite.** Pages call the functions in `src/data/api.ts`, which read a typed `DataSnapshot`. That snapshot is the contract between the research engine and the storefront.
- **A hosted backend later** replaces `setSnapshot()` + the static JSON with HTTP calls behind the same function names (`getCurrentBase`, `getBaskets`, `getIngredientRanking`, `getOrderSummary`, `getPickupInformation`, `getContainerInformation`…). Nothing in `src/pages` or `src/components` needs to change.
- **Research modules are pure.** `src/research/*.ts` take plain data in and return plain data, so they are unit-tested without a database, and the same code runs in scripts and in the browser (cost and order summaries).

## Toolchain

- **Node ≥ 22.18** runs TypeScript scripts directly (type stripping) and provides SQLite via the built-in `node:sqlite`. No native modules.
- **React 19 + TypeScript.** `tsc --noEmit` type-checks; esbuild bundles.
- **esbuild instead of Vite.** The prototype was built in an environment where the npm registry was unavailable, so it uses esbuild directly (`scripts/build-lib.ts`): one client bundle, one CSS bundle, and a CommonJS server bundle used only at build time to prerender every route with `renderToString`. Swapping in Vite later is straightforward because there is no esbuild-specific code in `src/`.
- **Static output.** `npm run build` writes `dist/` with one `index.html` per route (94 pages), hashed assets, a hashed data snapshot and `404.html`. Any static host works; the client fetches the snapshot and hydrates.

## Routing

`src/routes.tsx` lists every route with its title, description and the paths to prerender. `src/lib/router.tsx` is a ~60-line pushState router; links are real `<a href>` so everything works before hydration and without JavaScript.

## State

The only client state is the "Build my Base" drawer (`src/lib/build-state.tsx`): selected add-ons and container mode, kept in `localStorage` under `base.build.v1` with a try/catch fallback. Reserving is a prototype action; nothing is sent anywhere.

## Determinism

Given the same database and the same `BASE_WEEK_OF`, the pipeline produces byte-identical baskets and rankings. Ties always break by slug or name; the synthetic price history uses a fixed hash; nothing uses `Math.random()` (the bowl illustrations use a seeded generator).
