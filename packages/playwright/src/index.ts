// @gpp-lang/playwright: Gherkin++'s scenarios, in .gpp files and Markdown, as
// Playwright tests, with a driver that runs the language's words in a browser.

export type { BrowserContext } from './driver.ts'
export { playwright } from './driver.ts'
export type { GppConfig, GppTests } from './generate.ts'
export { defineGppConfig } from './generate.ts'
