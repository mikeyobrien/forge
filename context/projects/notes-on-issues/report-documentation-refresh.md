---
title: Documentation Refresh Report
category: projects
project: notes-on-issues
status: completed
created: 2025-06-14T00:00:00Z
modified: 2025-06-14T00:00:00Z
tags:
  - codex
  - documentation
  - notes-on-issues
command_type: report
generated_by: manual-review
---

## Summary

Expanded the public-facing documentation so newcomers can understand the structure of the Notes-on-Issues workspace without digging through source files. The root README now explains the repository layout, development workflow, and the major subsystems at a glance. A dedicated architecture guide in `docs/ARCHITECTURE.md` describes how the PARA knowledge base, static site generator, and MCP server interact.

## Documentation Enhancements

- **README** now covers prerequisites, initial setup, validation commands, and detailed instructions for running both the static site generator and the MCP server.
- **docs/ARCHITECTURE.md** captures the data flow, the responsibilities of the Rust and TypeScript packages, and the supporting tooling that keeps the knowledge base synchronised.
- Cross-links to existing references (`SITE_README.md`, `docs/GOAL.md`, and the PARA context directory) help readers locate deeper material quickly.
- Husky's `pre-commit` hook no longer forwards the deprecated `--silent` flag and now relies on the targeted `lint-staged` tasks alongside `pnpm test`, preventing false negatives when eslint runs under the new configuration format while still vetting staged changes.

## Follow-Up Ideas

- Add environment-specific notes for running the MCP server via Docker once the container workflow is exercised end-to-end.
- Capture a troubleshooting appendix covering common build errors for the Rust toolchain and pnpm-based tasks.
- Expand the architecture document with sequence diagrams after validating the MCP automation flows in practice.
