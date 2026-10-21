// Tests' gpp templates in jsdom: editor.spec.ts must pass, and each of
// failures.spec.ts's scenarios must fail with the message it gives.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'testing-library',
    root: import.meta.dirname,
    include: ['*.spec.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['setup.ts'],
  },
})
