// A project's files checked: .gpp files and Markdown with the language's
// words; stories' templates with a template's, which have no page words; tests'
// templates with those and Render; and the Defines, which all use, once.

import type { Analysis, Diagnostic } from './language/check.ts'
import { analyze } from './language/check.ts'
import type { GppFile } from './language/load.ts'
import { isScript } from './language/templates.ts'
import { leftovers, words } from './words/shared.ts'

export interface Checked {
  specs: Analysis
  stories: Analysis
  tests: Analysis
  diagnostics: Diagnostic[]
  // The analysis a file is checked in, for an editor's questions about it.
  analysisOf(file: string): Analysis
}

export function checkFiles(files: GppFile[], name: (file: string) => string = (file) => file): Checked {
  const options = { settle: leftovers, name }
  const specs = analyze(
    files.filter((f) => !isScript(f.file)),
    { words: words(), ...options },
  )
  // Every file's Defines, and the templates whole, in the same order.
  const templates = (these: (f: GppFile) => boolean, render: boolean) =>
    analyze(
      files.map((f) => (isScript(f.file) && these(f) ? f : { ...f, features: [] })),
      { words: words({ template: true, render }), ...options },
    )
  const stories = templates((f) => !f.tests, false)
  const tests = templates((f) => f.tests === true, true)
  const testFiles = new Set(files.filter((f) => f.tests).map((f) => f.file))
  return {
    specs,
    stories,
    tests,
    diagnostics: [
      ...specs.report.vocabulary,
      ...specs.report.scenarios.values(),
      ...stories.report.scenarios.values(),
      ...tests.report.scenarios.values(),
    ],
    analysisOf: (file) => (testFiles.has(file) ? tests : isScript(file) ? stories : specs),
  }
}
