// A project's files and how they're checked: each file is run by the first
// backend that covers it and runs its kind, scenarios in .spp files and
// Markdown, or templates in scripts, and is checked with that backend's words.
// Every Define is the whole project's, as when the scenarios run.

import path from 'node:path'
import type { Backend, SppConfig } from '../backend.ts'
import type { Analysis, Diagnostic } from '../language/check.ts'
import { analyze } from '../language/check.ts'
import type { Env } from '../language/cognate.ts'
import type { SppFile } from '../language/load.ts'
import { isScript } from '../language/templates.ts'
import { leftovers } from '../words/shared.ts'
import { findConfig } from './config.ts'
import { discover } from './files.ts'

// A file of the project, and the backend that runs its scenarios, if one does.
export interface ProjectFile {
  file: string
  runner: Backend | null
}

const kindOf = (file: string): Backend['runs'] => (isScript(file) ? 'templates' : 'specs')

// Every file the project's backends cover. A file under a directory with an
// spp.config of its own is that project's, not this one's. A file with none
// above it at all is in a project an editor made up, as a default.
export function projectFiles(config: SppConfig): ProjectFile[] {
  const runners = new Map<string, Backend | null>()
  for (const backend of config.backends) {
    const resolve = (p: string) => path.resolve(config.root, p)
    const found = discover(
      backend.files.map(resolve),
      config.root,
      backend.ignore.map(resolve),
      backend.runs === 'templates',
    )
    for (const file of found) {
      if (backend.runs === kindOf(file) && !runners.get(file)) runners.set(file, backend)
      else if (!runners.has(file)) runners.set(file, null)
    }
  }
  const nearest = new Map<string, string | undefined>()
  const ours = (file: string) => {
    const dir = path.dirname(file)
    if (!nearest.has(dir)) nearest.set(dir, findConfig(dir))
    const found = nearest.get(dir)
    return found === undefined || path.dirname(found) === config.root
  }
  return [...runners].filter(([file]) => ours(file)).map(([file, runner]) => ({ file, runner }))
}

// A project checked: an analysis for each backend, of the files it runs and
// every Define, and every mistake once.
export interface Checked {
  analyses: Map<Backend, Analysis>
  diagnostics: Diagnostic[]
  // The analysis a file is checked in: its runner's, or the first backend's.
  analysisOf(file: string): Analysis | undefined
}

const words = new WeakMap<Backend, Env>()
const wordsOf = (backend: Backend) => {
  const known = words.get(backend) ?? backend.words()
  words.set(backend, known)
  return known
}

export function checkProject(
  config: SppConfig,
  files: SppFile[],
  runnerOf: (file: string) => Backend | null,
  name: (file: string) => string = (file) => file,
): Checked {
  const analyses = new Map<Backend, Analysis>()
  const diagnostics: Diagnostic[] = []
  for (const [i, backend] of config.backends.entries()) {
    // Its own files whole, and every other file's Defines, in the same order.
    const input = files.flatMap((f) =>
      runnerOf(f.file) === backend ? [f] : isScript(f.file) ? [] : [{ ...f, features: [] }],
    )
    const analysis = analyze(input, { words: wordsOf(backend), settle: leftovers, name })
    analyses.set(backend, analysis)
    // The Defines are checked with the first backend's words.
    if (i === 0) diagnostics.push(...analysis.report.vocabulary)
    diagnostics.push(...analysis.report.scenarios.values())
  }
  for (const f of files) {
    if (runnerOf(f.file) || !f.features.some((feature) => feature.scenarios.length)) continue
    const [what, like] =
      kindOf(f.file) === 'specs'
        ? ['Scenarios in .spp files and Markdown', '@spp-lang/playwright']
        : ['spp templates', '@spp-lang/storybook']
    const message = `${what} need a backend that runs them, like ${like}: add one to spp.config.ts that covers this file`
    diagnostics.push({ file: f.file, line: 1, column: 1, message })
  }
  const [first] = config.backends
  return {
    analyses,
    diagnostics,
    analysisOf: (file) => analyses.get(runnerOf(file) ?? first),
  }
}
