import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // No domain code yet: phase 2 adds the first tests, then this line goes.
    passWithNoTests: true,
  },
})
