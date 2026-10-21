// The demo as a project of its own: a grocery list behind a sign-in page. Run it
// with `pnpm test:e2e`, here or from the repo's root.

import { defineGppConfig } from '@gpp-lang/playwright'
import { defineConfig } from '@playwright/test'
import gpp from './gpp.config.ts'

export default defineConfig({
  ...defineGppConfig(gpp),
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'node serve.ts', url: 'http://localhost:4173', reuseExistingServer: true },
})
