// spp-lang: the spp-lang command, the language server, and defineConfig, for a
// project's spp.config.ts.

export type { Backend, SppConfig } from '@spp-lang/core'
export { defineConfig } from '@spp-lang/core/node'
export type { Entry } from './tools/dictionary.ts'
export { dictionary, entries, shape, takes } from './tools/dictionary.ts'
