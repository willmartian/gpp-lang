// Spec++ in a Storybook config: every story's spp template has the project's
// Defines.
//
//     // .storybook/main.ts
//     import { sppStories } from '@spp-lang/storybook'
//     import spp from '../spp.config.ts'
//
//     export default { ...sppStories(spp), framework: '@storybook/html-vite', stories: ['../src/**/*.stories.ts'] }
//
// A play function runs in a browser, which can't read the project's files, so
// a Vite plugin reads them as Storybook builds, and a preview entry hands what
// it read to the templates (preview.ts). Changing one reloads the stories.

import fs from 'node:fs'
import path from 'node:path'
import type { SppConfig } from '@spp-lang/core'
import { isScript } from '@spp-lang/core'
import { projectFiles } from '@spp-lang/core/node'
import type { InlineConfig, Plugin } from 'vite'
import { isStorybook } from './vocabulary.ts'

// .ts when run from source, .js once built.
const PREVIEW = path.join(import.meta.dirname, `preview${path.extname(import.meta.filename)}`)

const DEFINES = 'virtual:spp-lang/defines'

export interface SppStories {
  viteFinal(config: InlineConfig): Promise<InlineConfig>
  previewAnnotations(entries?: string[]): Promise<string[]>
}

export function sppStories(config: SppConfig): SppStories {
  if (!config.backends.some(isStorybook)) throw new Error('sppStories: give it a spp.config with a storybook() backend')
  return {
    viteFinal: async (vite) => ({ ...vite, plugins: [...(vite.plugins ?? []), defines(config)] }),
    previewAnnotations: async (entries = []) => [...entries, PREVIEW],
  }
}

// The project's .spp files and Markdown, path → contents, as a module.
function defines(config: SppConfig): Plugin {
  const resolved = `\0${DEFINES}`
  return {
    name: 'spp-lang:defines',
    resolveId: (id) => (id === DEFINES ? resolved : undefined),
    load(id) {
      if (id !== resolved) return
      const sources: Record<string, string> = {}
      for (const { file } of projectFiles(config)) {
        if (isScript(file)) continue
        this.addWatchFile(file)
        sources[path.relative(config.root, file)] = fs.readFileSync(file, 'utf8')
      }
      return `export default ${JSON.stringify(sources)}`
    },
  }
}
