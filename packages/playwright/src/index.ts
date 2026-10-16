// @spp-lang/playwright: Spec++'s scenarios, in .spp files and Markdown, as
// Playwright tests. playwright() is the backend, for spp.config.ts, and
// sppTests() runs it, in playwright.config.ts.

export type { SppTests } from './generate.ts'
export { sppTests } from './generate.ts'
export type { PlaywrightBackend, PlaywrightOptions } from './project.ts'
export { playwright as default } from './project.ts'
export type { BrowserContext } from './words.ts'
export { browser } from './words.ts'
