module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/code'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'code/**/*.ts',
    '!code/**/*.d.ts',
    '!code/**/dist/**',
    '!code/**/node_modules/**',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};
