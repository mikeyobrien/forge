// ABOUTME: ESLint configuration for the web package referencing local tsconfigs
module.exports = {
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },
};
