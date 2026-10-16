// @spp-lang/storybook: Spec++ as Storybook play functions. storybook() is the
// backend, for spp.config.ts, and sppStories() runs it, in .storybook/main.ts.
// Stories import spp from @spp-lang/storybook/play.

export type { SppStories } from './stories.ts'
export { sppStories } from './stories.ts'
export type { StorybookOptions, StoryContext } from './vocabulary.ts'
export { storybook as default } from './vocabulary.ts'
