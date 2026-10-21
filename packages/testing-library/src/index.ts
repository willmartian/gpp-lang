// @gpp-lang/testing-library: Gherkin++ as Vitest or Jest tests, with Testing
// Library. Test files import gpp from here; a setup file calls renderWith.

export type { Renderer } from './driver.ts'
export { renderWith, testingLibrary } from './driver.ts'
export { gpp } from './feature.ts'
