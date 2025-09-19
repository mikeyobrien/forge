---
title: Orchestration and Agent Guidance Update
category: projects
project: notes-on-issues
status: completed
created: 2025-06-15T00:00:00Z
modified: 2025-06-15T00:00:00Z
tags:
  - codex
  - automation
  - documentation
command_type: report
generated_by: manual-review
---

## Summary

Refined the repository orchestration so a single `pnpm test` run now executes the Vitest suite and the Rust tests together.
Updated agent guidance to live in one consolidated `AGENTS.md` and aligned documentation with the new workflow.

## Changes

- Expanded `tools/self-check.sh` to run the Vitest suite alongside the Rust static site generator tests.
- Corrected `lint-staged.config.js` to target `code/forge-mcp` for staged TypeScript files and integration validation.
- Updated `eslint.config.mjs` to ignore `code/forge-mcp` while linting so the consolidated workflow reflects the active codebase.
- Refreshed the README and architecture guide to describe the unified validation command.
- Added a scope map to the top-level `AGENTS.md`, documenting that it is the sole control file and summarising per-directory expectations.

## Follow-Up

- Audit the remaining npm-based MCP tooling to ensure it works seamlessly with the pnpm-driven workflow.
- Introduce automated formatting checks for Markdown documentation to complement the Prettier guidance.
