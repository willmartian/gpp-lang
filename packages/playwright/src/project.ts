// A project as a Playwright run sees it: the files its gpp.config.ts says
// Playwright runs, loaded with every Define in the project, and what the
// checker found in them.

import path from 'node:path'
import type { GppFile, Report, Scenario, Vocabulary } from '@gpp-lang/core'
import { backendOf, check, isScript, LoadError, leftovers } from '@gpp-lang/core'
import { load, projectFiles } from '@gpp-lang/core/node'
import { playwright } from './config.ts'

// What a generated test file is told about its project.
export interface Project {
  // the config's directory
  root: string
  // the files Playwright runs, as globs from the root
  files: string[]
  outputDir: string
}

export interface Loaded {
  // every .gpp file and Markdown file, with the Features of those Playwright runs
  files: GppFile[]
  broken: Map<string, LoadError>
  vocabulary: Vocabulary[]
  report: Report
  scenarios: Map<string, Scenario>
}

export const where = (file: string, line: number) => `${file}:${line}`

export function loadProject(project: Project): Loaded {
  const backend = playwright({ files: project.files })
  const config = { root: project.root, backends: [backend] }
  const files: GppFile[] = []
  const broken = new Map<string, LoadError>()
  for (const file of projectFiles(project.root).filter((f) => !isScript(f))) {
    try {
      const loaded = load(file)
      // Another backend's Features aren't Playwright's to run, but every Define is.
      files.push(backendOf(config, file) ? loaded : { ...loaded, features: [] })
    } catch (err) {
      if (!(err instanceof LoadError)) throw err
      broken.set(file, err)
    }
  }
  const scenarios = new Map<string, Scenario>()
  for (const scenario of files.flatMap((f) => f.features).flatMap((f) => f.scenarios))
    scenarios.set(where(scenario.file, scenario.line), scenario)
  const report = check(files, {
    words: backend.words,
    settle: leftovers,
    name: (file) => path.relative(project.root, file),
  })
  return { files, broken, vocabulary: files.flatMap((f) => f.vocabulary), report, scenarios }
}
