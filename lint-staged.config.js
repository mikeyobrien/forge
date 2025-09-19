module.exports = {
  'code/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  'code/**/*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'code/forge-mcp/src/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => './code/forge-mcp/tests/integration/validate-mcp-tools.sh',
  ],
  'code/static-site-generator/**/*.rs': [
    () => 'cargo fmt --manifest-path code/static-site-generator/Cargo.toml',
    () => 'cargo clippy --manifest-path code/static-site-generator/Cargo.toml -- -D warnings',
    () => 'cargo test --manifest-path code/static-site-generator/Cargo.toml',
  ],
};
