---
title: 'Notes-on-Issues P-02 GitHub Action CI'
category: projects
created: 2025-06-14T00:00:00Z
modified: 2025-06-14T00:00:00Z
tags:
  - codex
  - notes-on-issues
  - implementation
---

Implemented Prompt P-02 by adding basic continuous integration:

- Added `.github/workflows/ci.yml` running on pushes and pull requests with Node.js 18 and 20.
- Workflow installs dependencies using pnpm, lints, and runs tests.
- Added CI status badge to `README.md`.
