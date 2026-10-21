// The addon: list it in .storybook/main.ts and every story's gpp template has
// the project's Defines.
//
//     addons: ['@gpp-lang/storybook']
//
// A play function runs in a browser, which can't read the project's files, so
// a Vite plugin reads them as Storybook builds, and a preview entry hands what
// it read to the templates (preview.ts). The project is the directory of the
// nearest gpp.config.ts above .storybook, as for gpp-lang check. Changing one
// of its files reloads the stories.

import fs from 'node:fs'
import path from 'node:path'
import { isScript } from '@gpp-lang/core'
import { findConfig, projectFiles } from '@gpp-lang/core/node'
import type { InlineConfig, Plugin } from 'vite'

// .ts when run from source, .js once built.
const PREVIEW = path.join(import.meta.dirname, `preview${path.extname(import.meta.filename)}`)

const DEFINES = 'virtual:gpp-lang/defines'

export async function viteFinal(config: InlineConfig, options: { configDir: string }): Promise<InlineConfig> {
  return {
    ...config,
    plugins: [...(config.plugins ?? []), defines(projectOf(options.configDir))],
  }
}

// The project .storybook is in: the directory of the nearest gpp.config.ts.
function projectOf(configDir: string): string {
  const config = findConfig(configDir)
  if (!config) throw new Error(`@gpp-lang/storybook found no gpp.config.ts at or above ${configDir}`)
  return path.dirname(config)
}

export async function previewAnnotations(entries: string[] = []): Promise<string[]> {
  return [...entries, PREVIEW]
}

// The project's .gpp files and Markdown, path → contents, as a module.
function defines(root: string): Plugin {
  const resolved = `\0${DEFINES}`
  return {
    name: 'gpp-lang:defines',
    resolveId: (id) => (id === DEFINES ? resolved : undefined),
    load(id) {
      if (id !== resolved) return
      const sources: Record<string, string> = {}
      for (const file of projectFiles(root).filter((f) => !isScript(f))) {
        this.addWatchFile(file)
        sources[path.relative(root, file)] = fs.readFileSync(file, 'utf8')
      }
      return `export default ${JSON.stringify(sources)}`
    },
  }
}
