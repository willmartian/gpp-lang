/*
 * `@gpp-lang/playwright`: Gherkin++'s scenarios, in .gpp files and Markdown, as
 * Playwright tests, with a driver that runs the language's words in a browser.
 * gpp.config.ts names it as a backend from @gpp-lang/playwright/config.
 */

export type { BrowserContext } from './driver.ts'
export { playwright } from './driver.ts'
export type { GppOptions, GppTests } from './generate.ts'
export { defineGppConfig } from './generate.ts'
