// The editor's tests, in jsdom. Run them here with `pnpm test:vitest`, or from
// the repo's root, with the package's fixtures too.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'testing-library',
    root: import.meta.dirname,
    environment: 'jsdom',
    // gpp declares its tests with describe and test, and Testing Library
    // cleans up after each with afterEach.
    globals: true,
    setupFiles: ['setup.ts'],
  },
})
