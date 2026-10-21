/*
 * A project's files checked: each file's Features with the words of the
 * backend its config says runs it, and the Defines, which every backend's
 * files use, with each backend's words.
 */

import type { Backend, Config } from './config.ts'
import { backendOf } from './config.ts'
import type { Analysis, Diagnostic } from './language/check.ts'
import { analyze } from './language/check.ts'
import type { GppFile } from './language/load.ts'
import { leftovers, words } from './words/shared.ts'

export interface Checked {
  /** each backend's analysis, with its words */
  analyses: Map<Backend, Analysis>
  diagnostics: Diagnostic[]
  /**
   * The analysis a file is checked in, for an editor's questions about it:
   * its backend's, or, for a file of only Defines, the shared words'.
   */
  analysisOf(file: string): Analysis
}

/**
 * Without a config, as in an editor that won't run the workspace's code,
 * there's no telling which words a file has, so it says nothing is wrong, and
 * answers questions with the shared words.
 */
export function checkFiles(
  files: GppFile[],
  config: Config | null,
  name: (file: string) => string = (file) => file,
): Checked {
  const options = { settle: leftovers, name }
  const owner = new Map(files.map((f) => [f.file, config && backendOf(config, f.file)]))
  /** Every file's Defines, and the Features of those the backend runs, in order. */
  const analyses = new Map(
    (config?.backends ?? []).map((b) => [
      b,
      analyze(
        files.map((f) => (owner.get(f.file) === b ? f : { ...f, features: [] })),
        { words: b.words, interpolation: b.interpolation, ...options },
      ),
    ]),
  )
  const shared = analyze(
    files.map((f) => ({ ...f, features: [] })),
    { words: words(), ...options },
  )

  return {
    analyses,
    diagnostics: !config
      ? []
      : [
          ...defineMistakes(analyses.size ? [...analyses.values()] : [shared]),
          ...[...analyses.values()].flatMap((a) => [...a.report.scenarios.values()]),
          ...files.flatMap((f) => unrun(f, owner.get(f.file) ?? null, name)),
        ],
    analysisOf: (file) => {
      const backend = owner.get(file)
      return (backend && analyses.get(backend)) ?? shared
    },
  }
}

/**
 * The mistakes in Defines that every backend has: a Define that only works
 * with one backend's words, like one that uses Visit, is fine, and a mistake
 * only where it's used without them.
 */
function defineMistakes(analyses: Analysis[]): Diagnostic[] {
  const at = (d: Diagnostic) => `${d.file}:${d.line}:${d.column}`
  const [first, ...rest] = analyses.map((a) => a.report.vocabulary)
  return (first ?? []).filter((d) => rest.every((other) => other.some((o) => at(o) === at(d))))
}

/**
 * Why a file's Features don't run, if they don't: no backend runs the file,
 * or its backend's templates are of another kind.
 */
function unrun(file: GppFile, backend: Backend | null, name: (file: string) => string): Diagnostic[] {
  const [feature] = file.features
  if (!feature) return []
  const at = { file: name(file.file), line: feature.line, column: 1 }
  if (!backend)
    return [{ ...at, message: "No backend in gpp.config.ts runs this file: none of their files' globs match it" }]
  if (file.templates === undefined || file.templates === backend.templates) return []
  const message =
    backend.templates === undefined
      ? `${backend.name} doesn't run gpp templates`
      : backend.templates === 'features'
        ? `${backend.name}'s gpp templates are Features, starting with Feature:`
        : `${backend.name}'s gpp templates are a story's steps, with no Feature:`
  return [{ ...at, message }]
}
