import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    include: ['tests/**/*.spec.ts'],
  },
});
