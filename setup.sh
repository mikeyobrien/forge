#!/bin/bash
# Setup script for the Forge monorepo
# Installs required dependencies and builds projects

set -e

cyan="\033[1;36m"
green="\033[0;32m"
red="\033[0;31m"
reset="\033[0m"

info() {
  echo -e "${cyan}$1${reset}"
}

error() {
  echo -e "${red}$1${reset}" >&2
}

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
  error "Node.js is required but was not found in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  error "npm is required but was not found in PATH."
  exit 1
fi

# Check for Rust
if ! command -v cargo >/dev/null 2>&1; then
  error "Rust toolchain is required but was not found. Install via https://rustup.rs/"
  exit 1
fi

info "Installing root npm packages..."
npm install

info "Installing MCP server dependencies..."
pushd code/forge-mcp >/dev/null
npm install
popd >/dev/null

info "Building static site generator..."
pushd code/static-site-generator >/dev/null
cargo build --release
popd >/dev/null

info "Setup complete."

