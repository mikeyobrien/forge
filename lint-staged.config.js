module.exports = {
  'code/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  'code/**/*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'code/mcp-server/src/**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => './code/mcp-server/tests/integration/validate-mcp-tools.sh'
  ],
  'code/static-site-generator/**/*.rs': [
    () => 'cd code/static-site-generator && source ~/.cargo/env && cargo fmt',
    () => 'cd code/static-site-generator && source ~/.cargo/env && cargo clippy -- -D warnings',
    () => 'cd code/static-site-generator && source ~/.cargo/env && cargo test'
  ],
};
