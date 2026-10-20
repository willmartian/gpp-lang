// TodoMVC as a project of its own, with its own vocabulary. Run it from here
// with `pnpm test:e2e`, here or from the repo's root.

import { defineGppConfig } from '@gpp-lang/playwright'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  ...defineGppConfig({ features: ['features'] }),
  use: { baseURL: 'http://localhost:4174' },
  webServer: { command: 'node serve.ts', url: 'http://localhost:4174', reuseExistingServer: true },
})
