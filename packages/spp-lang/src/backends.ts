// The backends that run a project's scenarios, as the project has them
// installed. The tools that check files without running them, spp-lang check
// and the language server, check each file with its backend's words:
//
//   - @spp-lang/playwright runs .spp files and Markdown's ```spp blocks
//   - @spp-lang/storybook runs the spp`…` templates in scripts
//
// Each gives its words from <package>/vocabulary, which needs nothing they run
// with, like a browser, so checking works with only the backend installed.

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Analysis, Diagnostic } from './language/check.ts'
import { analyze } from './language/check.ts'
import { core, Env } from './language/cognate.ts'
import type { SppFile } from './language/load.ts'
import { isScript } from './language/templates.ts'
import { leftovers } from './words/shared.ts'

// Each backend's words: pages for .spp files and Markdown, templates for scripts.
export interface Backends {
  pages?: Env
  templates?: Env
}

const PACKAGES: Record<keyof Backends, { name: string; runs: string }> = {
  pages: { name: '@spp-lang/playwright', runs: 'Scenarios in .spp files and Markdown' },
  templates: { name: '@spp-lang/storybook', runs: 'spp templates' },
}

// The backends installed where a project is, each with its words.
export async function findBackends(root: string): Promise<Backends> {
  const require = createRequire(path.join(root, 'package.json'))
  const found: Backends = {}
  for (const kind of ['pages', 'templates'] as const) {
    const { name } = PACKAGES[kind]
    let file: string
    try {
      file = require.resolve(`${name}/vocabulary`)
    } catch {
      continue
    }
    const vocabulary: unknown = await import(pathToFileURL(file).href)
    const words =
      typeof vocabulary === 'object' &&
      vocabulary !== null &&
      'words' in vocabulary &&
      typeof vocabulary.words === 'function'
        ? vocabulary.words()
        : undefined
    // A backend built on another copy of spp-lang makes words this one can't read.
    if (!(words instanceof Env)) throw new Error(`${name} isn't for this spp-lang: install versions that go together`)
    found[kind] = words
  }
  return found
}

// A project checked: its .spp files and Markdown with the pages backend's
// words, its templates with the templates backend's, and the Defines, which
// both use, once. A file whose backend isn't installed is a mistake that says so.
export interface Checked {
  pages: Analysis
  templates: Analysis | null
  missing: Diagnostic[]
  // every mistake, once
  diagnostics: Diagnostic[]
}

export function checkProject(
  files: SppFile[],
  backends: Backends,
  name: (file: string) => string = (file) => file,
): Checked {
  const options = { settle: leftovers, name }
  const missing: Diagnostic[] = []
  const lacking = (kind: keyof Backends, file: SppFile) => {
    const { name, runs } = PACKAGES[kind]
    const message = `${runs} run with ${name}, which checks them too. Install it: npm install --save-dev ${name}`
    missing.push({ file: file.file, line: 1, column: 1, message })
  }
  const hasScenarios = (f: SppFile) => f.features.some((feature) => feature.scenarios.length)
  const definesOnly = (f: SppFile) => ({ ...f, features: [] })

  let pageFiles = files.filter((f) => !isScript(f.file))
  if (!backends.pages) {
    for (const f of pageFiles.filter(hasScenarios)) lacking('pages', f)
    pageFiles = pageFiles.map(definesOnly)
  }
  const pages = analyze(pageFiles, { words: backends.pages ?? backends.templates ?? core(), ...options })

  const scripts = files.filter((f) => isScript(f.file))
  let templates: Analysis | null = null
  if (scripts.length && backends.templates) {
    templates = analyze([...pageFiles.map(definesOnly), ...scripts], { words: backends.templates, ...options })
  } else {
    for (const f of scripts.filter(hasScenarios)) lacking('templates', f)
  }

  const diagnostics = [
    ...pages.report.vocabulary,
    ...pages.report.scenarios.values(),
    ...(templates?.report.scenarios.values() ?? []),
    ...missing,
  ]
  return { pages, templates, missing, diagnostics }
}
