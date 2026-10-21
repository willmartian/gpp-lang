/*
 * Every story's play function as a test, in Chromium, through Storybook's
 * Vitest addon. Run it from the repo's root with `npm run test:storybook`, or
 * look at the stories with `npx storybook dev -c examples/storybook/.storybook`.
 */
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
