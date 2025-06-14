---
title: Notes-on-Issues Delivery Plan
category: projects
status: active
created: 2025-06-14T00:00:00Z
modified: 2025-06-14T00:00:00Z
tags:
  - codex
  - plan
  - notes-on-issues
---

# Notes-on-Issues – Delivery Plan

Author: ChatGPT – v1 (2025-06-14)

## 1. Vision

Build a cross-platform notes app whose **only remote state** lives in GitHub Issues.  
It must work **offline first**, offer optional **end-to-end encryption**, and beat GitHub’s native UX for
_capture, search, and organisation_.

## 2. Non-Functional Requirements

| ID    | Requirement                                                              | Rationale                          |
| ----- | ------------------------------------------------------------------------ | ---------------------------------- |
| NFR-1 | **Data ownership** – user can export 100 % of their notes without GitHub | Address HN privacy/lock-in concern |
| NFR-2 | **Offline read & write** within ≤ 100 ms                                 | Plane/Subway usage                 |
| NFR-3 | **Sync safety** – no silent data loss; conflicts detectable & resolvable | Notes ≠ Issues; edits collide      |
| NFR-4 | **Default test coverage ≥ 80 % lines**                                   | Enables fearless refactors         |
| NFR-5 | **Median p95 end-to-end encryption latency < 50 ms** on M2 Mac & Pixel 8 | UX                                 |
| NFR-6 | **Build & unit tests finish < 5 min in CI**                              | Developer velocity                 |

## 3. Architecture Overview

┌────────────┐ REST/GraphQL ┌─────────────────┐ │ Frontend │◀───────────────▶│ GitHub API │ │ React PWA │ └─────────────────┘ │ (RN shell) │ ▲ └──────▲─────┘ │ │ Adapter-SPI │ ┌──────┴─────┐◀──────────────────────┘ │ gh-notes-core (TS library) │ │ • AuthManager │ │ • IssueStore ↔ GitHub │ │ • LocalDB (IndexedDB) │ │ • SyncEngine │ │ • CryptoModule │ └────────────┬───────────────┘ │ uses WASM ┌──────▼──────┐ │ Tantivy-wasm│ (local search) └─────────────┘

## 4. Tech Stack

| Layer       | Choice                             | Reason                    |
| ----------- | ---------------------------------- | ------------------------- |
| Language    | **TypeScript 5** (strict)          | single language, great DX |
| Web         | **React 18 + Vite**                | fast HMR, PWA ready       |
| Mobile      | **React Native Expo**              | share 90 % of code        |
| Local DB    | **Dexie (IndexedDB)**              | browser native, mature    |
| Search      | **Tantivy-wasm**                   | fast, rust-powered        |
| Crypto      | **WebCrypto + libsodium-wasm**     | audited primitives        |
| Tests       | **Vitest + React Testing Library** | speedy, TS native         |
| CI          | **GitHub Actions**                 | dog-food platform         |
| Lint/Format | **ESLint, Prettier**               | consistency               |

## 5. Milestones

| Version             | Goal                                       | Increment             |
| ------------------- | ------------------------------------------ | --------------------- |
| **v0.1 “Skeleton”** | Monorepo, CI, env config, hello-world PWA  | devs can run & commit |
| **v0.2 “CRUD”**     | Auth + list/create/edit Issues online-only | prove API layer       |
| **v0.3 “Offline”**  | LocalDB cache + read offline               | minimal sync          |
| **v0.4 “Sync”**     | 2-way sync + conflict UI                   | usable offline        |
| **v0.5 “Encrypt”**  | Opt-in E2EE for bodies                     | privacy story         |
| **v0.6 “Search”**   | Local full-text search                     | fast find             |
| **v0.7 “Polish”**   | Mobile shell, backups, settings            | MVP ready             |

## 6. Work Breakdown (three levels)

### 6.1 Level-1 Epics ➜ Level-2 Stories ➜ Level-3 Tasks

Below is an excerpt for the first two epics; the rest follow the same pattern.

#### EPIC E1 – Repo & Tooling

| Story                    | Tasks                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| S1.0 Initialise monorepo | T1 Create `pnpm-workspace.yaml`<br>T2 Initialise `package.json` with workspaces<br>T3 Add baseline `README.md` |
| S1.1 Toolchain           | T4 Add TypeScript + `tsconfig.base.json`<br>T5 Add ESLint/Prettier configs<br>T6 Add Husky + lint-staged       |
| S1.2 CI                  | T7 GitHub Action: install, lint, test on push<br>T8 Add badge to README                                        |
| S1.3 PWA shell           | T9 Create `web` app with Vite + React<br>T10 Add Vitest + RTL example test                                     |

#### EPIC E2 – GitHub Core Library (`gh-notes-core`)

| Story            | Tasks                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| S2.0 AuthManager | T11 Install `@octokit/oauth-app`<br>T12 Implement Device Flow wrapper<br>T13 Persist token encrypted in localStorage |
| S2.1 IssueStore  | T14 Define Issue DTOs (strict TS)<br>T15 List issues via REST (happy path)<br>T16 Unit-test with nock                |

_…(EPIC E3 Offline, E4 Sync, etc.)_

### 6.2 Sprint slices (≈ 1 week each)

| Sprint | Definition of Done                                |
| ------ | ------------------------------------------------- |
| SP-1   | Tasks T1-T10 green in CI, app shows “Hello Notes” |
| SP-2   | Tasks T11-T16; user can log in & see issue list   |
| SP-3   | LocalDB (Dexie) schema, cache list; offline read  |
| SP-4   | Bi-directional sync, conflict banner              |
| …      | …                                                 |

### 6.3 Risk Register (watch-list)

- GitHub API rate-limit → back-off queue
- IndexedDB quota on iOS Safari (~50 MB)
- WASM bundle size (> 4 MB)

## 7. Acceptance Criteria for MVP (v0.7)

1. Create, edit, delete notes online & offline, with auto-sync.
2. Toggle “Encrypt note” – content unreadable via GitHub UI.
3. Search returns results < 30 ms for 5 000 notes on desktop.
4. Full export produces a zip with Markdown + media + JSON meta.
5. App installs as PWA and passes Lighthouse ≥ 90 % (perf, pwa).
