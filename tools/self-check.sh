#!/usr/bin/env bash
# ABOUTME: Coordinates validation for the Node and Rust projects in the monorepo.
# ABOUTME: Runs automated test suites to guard commits.

set -euo pipefail
pnpm -v

echo 'Running Vitest suite...'
pnpm vitest run --silent

echo 'Running Rust static site generator tests...'
cargo test --manifest-path code/static-site-generator/Cargo.toml
