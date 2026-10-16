// Spec++'s own end-to-end tests: each example against its own app, and the
// fixtures, which must all fail, against the demo's. Each is a project of its
// own, with its own spp.config and words, so their Defines don't clash.
import { defineConfig } from '@playwright/test'
import { sppTests } from '@spp-lang/playwright'
import demoSpp from './examples/demo/spp.config.ts'
import todomvcSpp from './examples/todomvc/spp.config.ts'
import failuresSpp from './packages/playwright/test/fixtures/spp.config.ts'

const demo = 'http://localhost:4173'
const todomvc = 'http://localhost:4174'

export default defineConfig({
  projects: [
    { name: 'demo', ...sppTests(demoSpp), use: { baseURL: demo } },
    { name: 'todomvc', ...sppTests(todomvcSpp), use: { baseURL: todomvc } },
    { name: 'failures', ...sppTests(failuresSpp), use: { baseURL: demo } },
  ],
  webServer: [
    { command: 'node examples/demo/serve.ts', url: demo, reuseExistingServer: true },
    { command: 'node examples/todomvc/serve.ts', url: todomvc, reuseExistingServer: true },
  ],
})
