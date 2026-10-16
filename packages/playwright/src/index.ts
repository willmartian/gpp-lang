// @spp-lang/playwright: Spec++'s scenarios, in .spp files and Markdown, as
// Playwright tests.

export type { SppConfig, SppTests } from './generate.ts'
export { defineSppConfig, generate } from './generate.ts'
export { runScenario } from './runtime.ts'
export type { BrowserContext } from './words.ts'
export { browser, playwright, settle } from './words.ts'
