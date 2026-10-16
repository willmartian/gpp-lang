// Spec++ as Storybook play functions, run in Chromium through Storybook's
// Vitest addon: the example's stories, which pass, and the fixtures, which
// pass only when Spec++ fails as it should.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { projects: ['examples/storybook/vitest.config.ts', 'test/fixtures/storybook/vitest.config.ts'] },
})
