---
title: 'Notes-on-Issues P-04 AuthManager Skeleton'
category: projects
created: 2025-06-15T00:00:00Z
modified: 2025-06-15T00:00:00Z
tags:
  - codex
  - notes-on-issues
  - implementation
---

Implemented Prompt P-04 by introducing the core package:

- Added `gh-notes-core` workspace under `code/notes-on-issues/packages`.
- Declared `IAuthManager` interface and `AuthManager` class with stub methods.
- Provided Vitest config and a simple test ensuring `getToken()` returns `null`.
- Registered new package in the workspace and updated tooling paths.
