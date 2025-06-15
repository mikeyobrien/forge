---
title: 'Notes-on-Issues P-03 Hello-World PWA Shell'
category: projects
created: 2025-06-14T00:00:00Z
modified: 2025-06-14T00:00:00Z
tags:
  - codex
  - notes-on-issues
  - implementation
---

Implemented Prompt P-03 to bootstrap the web PWA:

- Scaffolded a new Vite React project under `code/notes-on-issues/packages/web`.
- Added PWA support via `vite-plugin-pwa` with manifest name "Notes-on-Issues" and short name "NoI".
- Centralised Vite dependency versions using `pnpm.overrides` in the root `package.json`.
- Updated ESLint configuration to cover packages and added TypeScript config for tests.
- Created a minimal React app displaying `Hello Notes` and associated RTL test.
