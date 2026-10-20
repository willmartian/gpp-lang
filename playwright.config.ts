// Gherkin++'s own end-to-end tests: each example against its own app, and the
// fixtures, which must all fail, against the demo's. Each is a project of its
// own, with its own words, so their Defines don't clash.

import { defineGppConfig } from '@gpp-lang/playwright'
import { defineConfig } from '@playwright/test'

const demo = 'http://localhost:4173'
const todomvc = 'http://localhost:4174'

export default defineConfig({
  projects: [
    {
      name: 'demo',
      ...defineGppConfig({ features: ['examples/demo/features'], outputDir: '.gpp-tests/demo' }),
      use: { baseURL: demo },
    },
    {
      name: 'todomvc',
      ...defineGppConfig({ features: ['examples/todomvc/features'], outputDir: '.gpp-tests/todomvc' }),
      use: { baseURL: todomvc },
    },
    {
      name: 'failures',
      ...defineGppConfig({ features: ['packages/playwright/test/fixtures'], outputDir: '.gpp-tests/failures' }),
      use: { baseURL: demo },
    },
  ],
  webServer: [
    { command: 'node examples/demo/serve.ts', url: demo, reuseExistingServer: true },
    { command: 'node examples/todomvc/serve.ts', url: todomvc, reuseExistingServer: true },
  ],
})
