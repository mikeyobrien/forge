module.exports = {
  'code/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  'code/**/*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
