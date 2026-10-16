// The demo as a project of its own: a grocery list behind a sign-in page. Run it
// with `pnpm test:e2e`, here or from the repo's root.
import { defineConfig } from '@playwright/test'
import { sppTests } from '@spp-lang/playwright'
import spp from './spp.config.ts'

export default defineConfig({
  ...sppTests(spp),
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'node serve.ts', url: 'http://localhost:4173', reuseExistingServer: true },
})
