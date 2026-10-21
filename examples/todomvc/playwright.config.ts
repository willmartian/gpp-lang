// TodoMVC as a project of its own, with its own vocabulary. Run it from here
// with `pnpm test:e2e`, here or from the repo's root.

import { defineGppConfig } from '@gpp-lang/playwright'
import { defineConfig } from '@playwright/test'
import gpp from './gpp.config.ts'

export default defineConfig({
  ...defineGppConfig(gpp),
  use: { baseURL: 'http://localhost:4174' },
  webServer: { command: 'node serve.ts', url: 'http://localhost:4174', reuseExistingServer: true },
})
