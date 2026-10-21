/*
 * gpp-lang: the gpp-lang command, the language server, the listing of words
 * that `gpp-lang words` and the docs site share, and defineConfig, for a
 * project's gpp.config.ts.
 */

export type { Backend, Config } from '@gpp-lang/core'
export { defineConfig } from '@gpp-lang/core/node'
export type { Entry } from './tools/words.ts'
export { entries, listWords, shape, takes } from './tools/words.ts'
