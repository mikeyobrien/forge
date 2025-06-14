#!/usr/bin/env bash
# ABOUTME: Checks that pnpm is available in the environment.
# ABOUTME: Prints pnpm version and runs vitest tests.

set -euo pipefail
pnpm -v
pnpm vitest run --silent
