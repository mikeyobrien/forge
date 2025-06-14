import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/**/*.spec.ts'],
    tsconfig: './tsconfig.vitest.json',
  },
});
