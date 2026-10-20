// A project's files checked: .spp files and Markdown with the language's
// words, templates with a template's, which have no page words, and the
// Defines, which both use, once.

import type { Analysis, Diagnostic } from './language/check.ts'
import { analyze } from './language/check.ts'
import type { SppFile } from './language/load.ts'
import { isScript } from './language/templates.ts'
import { leftovers, words } from './words/shared.ts'

export interface Checked {
  specs: Analysis
  templates: Analysis
  diagnostics: Diagnostic[]
  // The analysis a file is checked in, for an editor's questions about it.
  analysisOf(file: string): Analysis
}

export function checkFiles(files: SppFile[], name: (file: string) => string = (file) => file): Checked {
  const options = { settle: leftovers, name }
  const specs = analyze(
    files.filter((f) => !isScript(f.file)),
    { words: words(), ...options },
  )
  // Every file's Defines, and the templates whole, in the same order.
  const templates = analyze(
    files.map((f) => (isScript(f.file) ? f : { ...f, features: [] })),
    { words: words({ template: true }), ...options },
  )
  return {
    specs,
    templates,
    diagnostics: [
      ...specs.report.vocabulary,
      ...specs.report.scenarios.values(),
      ...templates.report.scenarios.values(),
    ],
    analysisOf: (file) => (isScript(file) ? templates : specs),
  }
}
