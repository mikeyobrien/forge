---
title: Notes-on-Issues Prompt Sequence
category: projects
status: active
created: 2025-06-14T00:00:00Z
modified: 2025-06-14T00:00:00Z
tags:
  - codex
  - prompt-plan
  - notes-on-issues
---

# Prompt Sequence: Notes-on-Issues

The following LLM prompts implement the project incrementally with a test-first approach. Feed each prompt to your code generation model in order, committing after each passes lint and tests.

```
Prompt P-00 — Create Monorepo Skeleton

You are an expert TS/Node engineer working in an empty git repo.

**Goal:** Bootstrap a pnpm-based monorepo that will host multiple packages (`web`, `gh-notes-core`, later `mobile`).

**Tasks**
1. Add `pnpm-workspace.yaml` listing `packages/*`.
2. Add root `package.json` with:
   - `"private": true`
   - `"packageManager": "pnpm@latest"`
   - minimal scripts: `lint`, `test`, `clean`
3. Add an empty `packages/` directory and `.gitkeep` inside to commit.
4. Create a placeholder `README.md` with project title.

**Tests:**
Create a simple shell test in `tools/self-check.sh` that runs `pnpm -v` and exits `0`.

**Deliverables:**
All files added and ready to commit. No other code.

Return a unix-style patch (diff) that applies cleanly to root.
```

```
**Status**: ✅ Complete
**Completion**: 2025-06-14
**Notes**: Monorepo skeleton created with pnpm workspace, package.json, README, and self-check script.
Prompt P-01 — Toolchain & Quality Gates

Context: Repo contains the skeleton from P-00.

**Goal:** Add TypeScript, ESLint, Prettier, Husky, and lint-staged.

**Tasks**
1. Install devDeps:
   - `typescript @types/node`
   - `eslint eslint-config-prettier eslint-plugin-import`
   - `prettier`
   - `husky lint-staged`
2. Create `tsconfig.base.json` with `"strict": true`.
3. Configure ESLint (`.eslintrc.cjs`) extending `eslint:recommended`, `plugin:import/recommended`, `prettier`.
4. Add Prettier config (`.prettierrc`).
5. Add Husky pre-commit that runs `pnpm lint --silent` and `pnpm test --silent`.
6. Configure `lint-staged` to run Prettier + ESLint on staged `*.{ts,tsx,js,json,md}`.
7. Update root `package.json` scripts:
   - `lint`, `test` (jest placeholder), `prepare` (`husky install`).

**Tests**
- Write a minimal Vitest config (`code/notes-on-issues/vitest.config.ts`) and one passing test `code/notes-on-issues/tests/health.spec.ts` asserting `true === true`.
- Add CI step in `tools/self-check.sh` to run `pnpm vitest run --config code/notes-on-issues/vitest.config.ts --silent`.

Return patch only.
```

**Status**: ✅ Complete
**Completion**: 2025-06-14
**Notes**: Tooling configured with TypeScript, ESLint, Prettier, Husky, lint-staged, and Vitest under `code/notes-on-issues`.

```
Prompt P-02 — Bootstrap GitHub Action CI

Repo has tooling from P-01.

**Goal:** Continuous Integration green on every push.

**Tasks**
1. Add `.github/workflows/ci.yml` that runs on `push` and `pull_request`.
2. Matrix: `node@18`, `node@20`.
3. Steps: checkout → setup-pnpm → install → lint → test.
4. Cache pnpm store for speed.
5. Fail fast if any step fails.

**Tests**
Add badge markdown in `README.md` referencing workflow status (use fake link; CI will update).

Deliverable: patch.
```

```
Prompt P-03 — Hello-World PWA Shell

Context: infra is ready.

**Goal:** A Vite React PWA served from `packages/web/` that shows "Hello Notes".

**Tasks**
1. Run `pnpm create vite packages/web --template react-ts`.
2. Move Vite dep versions to root `package.json` resolutions.
3. Add PWA plugin (`@vite-pwa/react`), configure manifest: name "Notes-on-Issues", short_name "NoI".
4. Modify `App.tsx` to render `<h1>Hello Notes</h1>`.
5. Add Vitest + React Testing Library setup inside `packages/web`.
6. Provide one RTL test verifying header text.

**Tests**
`pnpm --filter web test` passes.

Return patch.
```

```
Prompt P-04 — AuthManager Skeleton (gh-notes-core)

Create new workspace package `packages/gh-notes-core`.

**Goal:** First slice of AuthManager—no network calls yet.

**Tasks**
1. `mkdir packages/gh-notes-core && pnpm init`.
2. Add peerDep `@octokit/oauth-app`.
3. Declare public API: `src/auth/AuthManager.ts` with:
   - interface `IAuthManager { login(): Promise<void>; logout(): void; getToken(): string | null }`
   - throw `NotImplementedError` for now.
4. Export barrel `index.ts`.

**Tests**
Vitest spec verifying `new AuthManager().getToken() === null`.

Patch only.
```

```
Prompt P-05 — Implement Device Flow Login

Now flesh out AuthManager.

**Tasks**
1. Implement `login()` using `@octokit/oauth-app` *device flow* (mock HTTP in tests with `nock`).
2. Encrypt token via WebCrypto (AES-GCM) using a generated key stored under `cryptoKey` in indexedDB (use `idb-keyval` for KV).
3. Persist ciphertext in `localStorage` under `gh.notes.token`.
4. Implement `logout()` clearing both storage locations.

**Tests**
- Unit test happy path: `login` stores encrypted token, `getToken()` returns plaintext.
- Token survives page reload (simulate by new AuthManager instance).
- `logout()` clears state.

Use fake client ID/secret in tests.

Patch only.
```

```
Prompt P-06 — Issue DTOs & List API

Goal: read user issues (online only).

**Tasks**
1. In `gh-notes-core`, add `IssueDTO` (id, title, body, updatedAt, labels).
2. Implement `IssueStore.listIssues()` that fetches `/issues?filter=all&state=open&per_page=100`.
3. Inject personal access token from AuthManager.
4. Map REST result to DTO array.

**Tests**
- Unit test with nock: returns array length matches mock.
- Error case: 401 ➜ throws `AuthError`.

Patch.
```

```
Prompt P-07 — LocalDB Schema & Persistence

Add Dexie DB in `gh-notes-core`.

**Tasks**
1. `LocalDB.ts` with stores: `issues` (primary key id), `meta` (k/v).
2. Write `saveIssues(dtos)` + `getIssue(id)`.
3. On first open, create v1 schema.

**Tests**
- Unit test saving two issues then retrieving one by id.
- Verify IndexedDB actually persists (Dexie-FakeIndexDB adapter).

Patch.
```

```
Prompt P-08 — Offline-first List View

Wire LocalDB into Web UI.

**Tasks**
1. Add `packages/web/src/hooks/useIssues.ts`:
   - On mount, call `IssueStore.listIssues()`; save to LocalDB; set React state.
   - If network fails, fall back to `LocalDB.getAllIssues()`.
2. Update `<App>` to show list of issue titles.
3. Show banner "Offline" when falling back.

**Tests**
- RTL test: offline mock ⇒ banner visible, titles rendered from LocalDB fixture.

Patch.
```

```
Prompt P-09 — Two-way Sync Engine (minimal)

Goal: push local edits, pull remote changes.

**Tasks**
1. In `gh-notes-core/sync/`, implement `SyncEngine.sync()`:
   - Fetch remote issues updated since lastSync.
   - Merge into LocalDB (simple "newer wins").
   - Push local `issues.where({ dirty: true })` to GitHub via `PATCH /issues/{id}`.
   - Clear dirty flag on success; update `lastSync` meta.
2. Expose event emitter for progress.

**Tests**
- Unit: given local dirty + remote newer scenario, verify merge rules & conflict flag.

Patch.
```

```
Prompt P-10 — Conflict Resolution Banner

Add UI for conflicts.

**Tasks**
1. Extend Issue DTO with `hasConflict` boolean.
2. In list view, mark conflicted rows red.
3. Clicking row opens diff modal showing "Local" vs "Remote" body, and buttons "Keep Local" / "Accept Remote".
4. Choosing an option updates LocalDB and clears `hasConflict`.

**Tests**
RTL: simulate conflict DTO ⇒ diff modal opens, clicking keep local removes badge.

Patch.
```

```
Prompt P-11 — Opt-in End-to-End Encryption

Crypto!

**Tasks**
1. Add `CryptoModule.encrypt(text, noteKey)` / `decrypt`.
2. Provide "Encrypt note" toggle in editor (new component).
3. When enabled, body stored locally & remotely as cipher (Base64).
4. Store noteKey in LocalDB keyed by note id, encrypted by master key (same used for token).
5. Update search to skip encrypted notes until decrypted client side.

**Tests**
- Unit: encrypt+decrypt round trip equals original.
- Editor RTL: create encrypted note, list view shows 🔒 icon.

Patch.
```

```
Prompt P-12 — Full-text Search with Tantivy-wasm

Goal: instant search on 5 000 notes.

**Tasks**
1. Add `tantivy-wasm` to `gh-notes-core/search/`.
2. Index fields: title, body (if not encrypted), labels.
3. Hook up incremental indexing on every LocalDB write.
4. `search(query)` returns array of issue ids sorted by score.
5. Web UI: search box filters list.

**Tests**
- Index 1 000 fake notes, search "foo" returns expected ids < 30 ms (jest fake timers).

Patch.
```

```
Prompt P-13 — Automated Export & Import

Goal: user can get all their data.

**Tasks**
1. `ExportService.exportZip()` – stream all issues as Markdown + JSON meta, plus attachments, into `JSZip`.
2. Trigger via settings screen; download in browser.
3. `ImportService.importZip(file)` – rehydrate LocalDB and push to GitHub.

**Tests**
- Unit: export then import, LocalDB count identical.

Patch.
```

```
Prompt P-14 — Mobile (Expo) Shell

Create `packages/mobile` (Expo managed workflow).

**Tasks**
1. Initialise with `expo init`.
2. Add `@noI/core` (alias to gh-notes-core) via monorepo symlink.
3. Render same list UI using React Navigation.
4. Use `expo-secure-store` for key storage.

**Tests**
- Jest snapshot test list screen.

Patch.
```

```
Prompt P-15 — Backups & Settings

Final polish.

**Tasks**
1. Settings screen with:
   - Manual "Sync now"
   - Toggle auto-backup to user-provided Git remote
2. Implement backup: git push export zip to `backup/notes-YYYY-MM-DD.zip`.
3. Show last backup time.

**Tests**
Mock git CLI; verify file path format.

Patch.
```

```
Prompt P-16 — Release Automation

Ship it!

**Tasks**
1. Add semantic-release to root.
2. Configure changelog, GitHub release notes.
3. Web PWA auto-deploy to GitHub Pages via Action.
4. Mobile build artifacts via EAS build on tags.

**Tests**
- Dry-run semantic-release in CI; expect no errors.

Patch.
```
