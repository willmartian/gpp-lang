// @spp-lang/playwright: Spec++'s scenarios, in .spp files and Markdown, as
// Playwright tests, with a driver that runs the language's words in a browser.

export type { BrowserContext } from './driver.ts'
export { playwright } from './driver.ts'
export type { SppConfig, SppTests } from './generate.ts'
export { defineSppConfig } from './generate.ts'
