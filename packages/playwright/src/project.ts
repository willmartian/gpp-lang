// A project as a Playwright run sees it: the files defineGppConfig names,
// loaded, and what the checker found in them.

import path from 'node:path'
import type { GppFile, Report, Scenario, Vocabulary } from '@gpp-lang/core'
import { check, LoadError, leftovers, words } from '@gpp-lang/core'
import { discover, load } from '@gpp-lang/core/node'

// What a generated test file is told about its project.
export interface Project {
  root: string
  features: string[]
  ignore: string[]
  outputDir: string
}

export interface Loaded {
  files: GppFile[]
  broken: Map<string, LoadError>
  vocabulary: Vocabulary[]
  report: Report
  scenarios: Map<string, Scenario>
}

export const where = (file: string, line: number) => `${file}:${line}`

export function loadProject(project: Project): Loaded {
  const files: GppFile[] = []
  const broken = new Map<string, LoadError>()
  for (const file of discover(project.features, project.root, project.ignore)) {
    try {
      files.push(load(file))
    } catch (err) {
      if (!(err instanceof LoadError)) throw err
      broken.set(file, err)
    }
  }
  const scenarios = new Map<string, Scenario>()
  for (const scenario of files.flatMap((f) => f.features).flatMap((f) => f.scenarios))
    scenarios.set(where(scenario.file, scenario.line), scenario)
  const report = check(files, { words: words(), settle: leftovers, name: (file) => path.relative(project.root, file) })
  return { files, broken, vocabulary: files.flatMap((f) => f.vocabulary), report, scenarios }
}
