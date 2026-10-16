// What a backend is to Spec++: something that runs scenarios, like
// @spp-lang/playwright or @spp-lang/storybook. A project lists the backends it
// uses in its spp.config.ts, and the tools that check files without running
// them, spp-lang check and the language server, check each file with the
// words of the backend that runs it.

import type { Env } from './language/cognate.ts'

export interface Backend {
  // its package, for messages
  name: string
  // what it runs: scenarios in .spp files and Markdown, or spp`…` templates
  // in scripts
  runs: 'specs' | 'templates'
  // where its files are, and what to leave out, relative to the config
  files: string[]
  ignore: string[]
  // its words, for checking
  words(): Env
}

// A project: its backends, and where the paths they give are relative to,
// which is where its spp.config.ts is. An editor's default project has no file.
export interface SppConfig {
  root: string
  file?: string
  backends: Backend[]
}
