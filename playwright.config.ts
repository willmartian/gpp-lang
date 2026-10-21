/*
 * Gherkin++'s own end-to-end tests: each example against its own app, and the
 * fixtures, which must all fail, against the demo's. Each is a project of its
 * own, with its own gpp.config.ts and words, so their Defines don't clash.
 */

import { defineGppConfig } from '@gpp-lang/playwright'
import { defineConfig } from '@playwright/test'
import demoGpp from './examples/demo/gpp.config.ts'
import todomvcGpp from './examples/todomvc/gpp.config.ts'
import failuresGpp from './packages/playwright/test/fixtures/gpp.config.ts'

const demo = 'http://localhost:4173'
const todomvc = 'http://localhost:4174'

export default defineConfig({
  projects: [
    {
      name: 'demo',
      ...defineGppConfig(demoGpp),
      use: { baseURL: demo },
    },
    {
      name: 'todomvc',
      ...defineGppConfig(todomvcGpp),
      use: { baseURL: todomvc },
    },
    {
      name: 'failures',
      ...defineGppConfig(failuresGpp),
      use: { baseURL: demo },
    },
  ],
  webServer: [
    { command: 'node examples/demo/serve.ts', url: demo, reuseExistingServer: true },
    { command: 'node examples/todomvc/serve.ts', url: todomvc, reuseExistingServer: true },
  ],
})
