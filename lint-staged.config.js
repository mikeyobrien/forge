module.exports = {
  '*.{ts,tsx,js,json,md}': ['prettier --write', 'eslint --fix'],
  'code/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  'code/**/*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'code/mcp-server/src/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => './code/mcp-server/tests/integration/validate-mcp-tools.sh',
  ],
  'code/static-site-generator/**/*.rs': [
    () => 'cargo fmt --manifest-path code/static-site-generator/Cargo.toml',
    () => 'cargo clippy --manifest-path code/static-site-generator/Cargo.toml -- -D warnings',
    () => 'cargo test --manifest-path code/static-site-generator/Cargo.toml',
  ],
};
