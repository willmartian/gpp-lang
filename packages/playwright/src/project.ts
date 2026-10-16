// The backend, for a project's spp.config, and the project as a Playwright run
// sees it: every file of the project, the ones this backend runs, and what the
// checker found, with this backend's words.

import path from 'node:path'
import type { Backend, Report, Scenario, SppConfig, SppFile, Vocabulary } from '@spp-lang/core'
import { core, isScript, LoadError } from '@spp-lang/core'
import { checkProject, load, projectFiles } from '@spp-lang/core/node'
import { browser } from './words.ts'

const NAME = '@spp-lang/playwright'

export interface PlaywrightOptions {
  // Where the .spp files and Markdown are. By default, everything under the config.
  files?: string[]
  // Files and directories to leave out, like fixtures that are meant to fail.
  ignore?: string[]
  // Where the generated tests go. By default, .spp-tests.
  outputDir?: string
}

export interface PlaywrightBackend extends Backend {
  outputDir: string
}

// Runs the scenarios in .spp files and Markdown as Playwright tests.
export function playwright(options: PlaywrightOptions = {}): PlaywrightBackend {
  return {
    name: NAME,
    runs: 'specs',
    files: options.files ?? ['.'],
    ignore: options.ignore ?? [],
    outputDir: options.outputDir ?? '.spp-tests',
    words: () => browser(core()),
  }
}

export const isPlaywright = (b: Backend): b is PlaywrightBackend => b.name === NAME && 'outputDir' in b

// What a generated test file is told about its project: where its config is,
// for the runtime to load it again, and where the tests go.
export interface Project {
  root: string
  config: string
  outputDir: string
}

export interface Loaded {
  files: SppFile[]
  broken: Map<string, LoadError>
  // the files this backend runs
  own: Set<string>
  vocabulary: Vocabulary[]
  report: Report
  scenarios: Map<string, Scenario>
}

export const where = (file: string, line: number) => `${file}:${line}`

export function loadProject(config: SppConfig, backend: PlaywrightBackend): Loaded {
  const files: SppFile[] = []
  const broken = new Map<string, LoadError>()
  const runners = new Map<string, Backend | null>()
  // Scripts have no Defines, and their templates aren't this backend's.
  for (const { file, runner } of projectFiles(config)) {
    if (isScript(file)) continue
    runners.set(file, runner)
    try {
      files.push(load(file))
    } catch (err) {
      if (!(err instanceof LoadError)) throw err
      broken.set(file, err)
    }
  }
  const own = new Set([...runners].filter(([, runner]) => runner === backend).map(([file]) => file))
  const { analyses } = checkProject(
    config,
    files,
    (file) => runners.get(file) ?? null,
    (file) => path.relative(config.root, file),
  )
  const analysis = analyses.get(backend)
  if (!analysis) throw new Error(`${NAME} isn't one of the config's backends`)
  const scenarios = new Map<string, Scenario>()
  for (const f of files.filter((f) => own.has(f.file)))
    for (const scenario of f.features.flatMap((feature) => feature.scenarios))
      scenarios.set(where(scenario.file, scenario.line), scenario)
  return { files, broken, own, vocabulary: files.flatMap((f) => f.vocabulary), report: analysis.report, scenarios }
}
