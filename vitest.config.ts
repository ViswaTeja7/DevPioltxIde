import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['web/src/**/*.test.{ts,tsx}', 'electron/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Coverage is scoped to the pure, unit-testable libraries for now. Thresholds
      // ratchet up as suites grow to cover components and the server.
      include: ['web/src/lib/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
});
