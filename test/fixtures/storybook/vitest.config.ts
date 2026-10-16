// Play functions that must fail, each with the message it should fail with.
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
  test: {
    name: 'storybook-failures',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  },
})
