# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kellermeister is a German wine cellar management web app using [Solid Pods](https://solidproject.org/) for decentralized data storage. Users authenticate via a Solid Identity Provider and their data lives in their own Pod.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # tsc + vite build (deployed to GitHub Pages at /kellermeister/)
npm run preview   # Preview production build
```

No lint or test scripts are configured. Vitest is installed but tests are currently disabled.

## Architecture

The codebase follows a clean architecture with three layers:

**Domain** (`src/domain/`) — Pure business models and repository interfaces. No framework dependencies. Key aggregates: `Bottle`, `Cellar`, `Order`, `Product`, `User`.

**Application** (`src/application/`) — `KellermeisterService` orchestrates all use cases (cellar CRUD, bottle transfers, order ingestion). `SolidService` interface abstracts authentication.

**Infrastructure** (`src/infrastructure/`) — Three sub-packages:
- `solid/` — Solid Pod implementations: `InruptSolidService` (auth via `@inrupt/solid-client-authn-browser`), repository implementations using Soukai models
- `cdi/` — `CDI` singleton acts as the dependency injection container; `CDI.setStorageUrl()` must be called after login before repositories/services are usable
- `web/` — Lit web components. Pages in `pages/`, reusable components in `components/`. Router uses Vaadin Router with lazy-loaded page components.

### Data layer: Soukai + Solid

Domain models extend Soukai's `SolidModel`. Data is persisted as RDF (Turtle) resources in the user's Solid Pod under `{storageUrl}kellermeister/`. The Soukai engine is initialized in `main.ts` and repositories are path-based (constructed from `storageUrl`).

### Startup sequence

1. `main.ts` initializes Soukai engine, CDI, and the Vaadin router
2. `InruptSolidService.restoreSession()` checks for an existing Solid session
3. On successful auth, the user's `storageUrl` is set on `CDI`, which initializes all repositories and `KellermeisterService`
4. Pages retrieve services via `CDI.getInstance().getKellermeisterService()`

### Routing

Routes defined in `src/infrastructure/web/router.ts`:
- `/` — landing/home page
- `/cellar/:cellarId` — cellar detail view
- `/cellarwork/:cellarId` — cellar work view
- `/order` — order management
- `/profile` — user profile

### PWA

Configured via `vite-plugin-pwa` with Workbox runtime caching for Solid `.well-known/solid` endpoints. The `VITE_BASE_PATH` env var sets the base path (used for GitHub Pages deployment with `/kellermeister/`).
