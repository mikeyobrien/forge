#!/usr/bin/env bash
# ABOUTME: Checks that pnpm is available in the environment.
# ABOUTME: Prints pnpm version and exits successfully.

set -euo pipefail
pnpm -v
pnpm vitest run --config code/notes-on-issues/vitest.config.ts --silent
