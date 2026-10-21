/*
 * Storybook as a backend in gpp.config.ts. Its templates are a story's steps,
 * with the shared words: a story renders itself from its args, on one page
 * that's already open, so it has no words of its own.
 *
 *     // gpp.config.ts
 *     import { defineConfig } from 'gpp-lang'
 *     import { storybook } from '@gpp-lang/storybook/config'
 *
 *     export default defineConfig({ backends: [storybook()] })
 *
 * Only this is loaded by the tools, so it imports nothing of Storybook's.
 */

import type { Backend } from '@gpp-lang/core'
import { words } from '@gpp-lang/core'

export interface StorybookOptions {
  /**
   * The stories files it runs, as globs from the config's directory. By
   * default, every *.stories.* file.
   */
  files?: string[]
}

export function storybook({ files = ['**/*.stories.*'] }: StorybookOptions = {}): Backend {
  return { name: 'Storybook', files, words: words(), templates: 'steps' }
}
