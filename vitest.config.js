import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    includeSource: ['src/**/*.{js,ts}'],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
}) 