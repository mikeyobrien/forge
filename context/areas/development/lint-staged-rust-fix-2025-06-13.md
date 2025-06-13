---
title: Fix lint-staged Rust commands
category: areas
status: completed
created: 2025-06-13T00:00:00Z
modified: 2025-06-13T00:00:00Z
tags:
  - tooling
  - ci
---

# Fix lint-staged Rust commands

## Summary

Updated the lint-staged configuration so Husky pre-commit hooks run `cargo fmt`, `cargo clippy`, and `cargo test` correctly. The previous commands attempted to execute with `cd` and `source` which failed in the lint-staged environment. The new config uses function entries that call each cargo command with the manifest path, ensuring hooks pass without manual overrides.
