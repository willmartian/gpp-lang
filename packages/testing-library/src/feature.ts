// Gherkin++ as Vitest or Jest tests.
//
//     gpp`
//       Feature: Editor
//
//         Scenario: Saving a draft
//           Given I Render ${<Editor title="" />}
//           When I Click the Button "Save"
//           Then the Status should Read "Draft saved"
//     `
//
// A template is a Feature: a describe, with a test for each Scenario, and for
// each row of an Outline. Its ${…} are what Render renders, and nothing else
// can take one, so the rest is checked as any Gherkin++ is.
//
// It's read as the test file loads, to declare its tests, and checked the
// first time one runs, against the shared words and Render (config.ts), and
// the project's Defines, so a
// mistake fails its own test before anything renders.

import path from 'node:path'
import type { Diagnostic, GppFile, Report, Scenario, Step } from '@gpp-lang/core'
import {
  check,
  GppError,
  isFeatureTemplate,
  isScript,
  LoadError,
  leftovers,
  loadSource,
  runSteps,
  settle,
} from '@gpp-lang/core'
import { findConfig, load, projectFiles } from '@gpp-lang/core/node'
import { ComponentType, testingLibraryWords } from './config.ts'
import { render, testingLibrary } from './driver.ts'

// ---------------------------------------------------------------- reading

// A template as a script of its own, as gpp-lang check reads it in a test
// file (templates.ts), with each ${…} as ${0}, ${1}… in its place.
const FILE = 'gpp template.js'
const script = (strings: readonly string[]) => `gpp\`${strings.map((s, i) => (i ? `\${${i - 1}}${s}` : s)).join('')}\``

// A template, read: the file it makes, of one Feature, and its source, for messages.
export interface Read {
  file: GppFile
  source: string
}

// Reads a template, as written, or says what's wrong with it.
export function read(strings: readonly string[]): { read: Read; problem: null } | { read: null; problem: string } {
  const source = script(strings)
  if (!isFeatureTemplate(source.slice('gpp`'.length))) return { read: null, problem: NOT_A_FEATURE }
  try {
    return { read: { file: loadSource(FILE, source), source }, problem: null }
  } catch (err) {
    if (!(err instanceof LoadError)) throw err
    return { read: null, problem: err.problems.map((p) => framed(source, p)).join('\n\n') }
  }
}

const NOT_A_FEATURE =
  "A test's gpp template is a Feature, starting with Feature:, with Scenarios under it. A story's is only its steps, for @gpp-lang/storybook"

// What's wrong, then the line it's on, with a caret under where.
function framed(source: string, { line, column, message }: { line: number; column: number; message: string }): string {
  const text = source.split('\n')[line - 1] ?? ''
  const indent = text.length - text.trimStart().length
  return `${message}\n\n${frame(text.trim(), column - 1 - indent)}`
}

const frame = (text: string, index: number) => `    ${text}\n    ${' '.repeat(Math.max(0, index))}^`

// ---------------------------------------------------------------- the project

// The project's Defines, from its .gpp files and Markdown: those under the
// nearest gpp.config.ts above the test file. Their scenarios are another
// backend's, and their mistakes are gpp-lang check's to report: a test fails
// only on one it uses.
let defines: GppFile[] | undefined

function projectDefines(): GppFile[] {
  const config = findConfig(testDir())
  defines ??= config
    ? projectFiles(path.dirname(config))
        .filter((f) => !isScript(f))
        .map((f) => ({ ...load(f), features: [] }))
    : []
  return defines
}

// The running test file's directory, as Vitest's and Jest's expect know it,
// or, without one, where the tests run.
function testDir(): string {
  const { expect } = globalThis as { expect?: unknown }
  const file = hasState(expect) ? expect.getState().testPath : undefined
  return typeof file === 'string' ? path.dirname(file) : process.cwd()
}

const hasState = (v: unknown): v is { getState(): { testPath?: unknown } } =>
  typeof v === 'function' && 'getState' in v && typeof v.getState === 'function'

// ---------------------------------------------------------------- running

// A scenario's first mistake, framed, and where it is, or null.
export function mistake({ source }: Read, report: Report, scenario: Scenario): Diagnostic | null {
  const found = report.scenarios.get(scenario)
  return found ? { ...found, message: framed(source, found) } : null
}

export const checked = ({ file }: Read, vocabulary: GppFile[]): Report =>
  check([...vocabulary, file], { words: testingLibraryWords(), interpolation: ComponentType, settle: leftovers })

// Where a template is in its test file: the file, and the line its gpp\` is on.
export interface Site {
  file: string
  line: number
}

// Where gpp was called from, as the stack says, which Vitest and Jest map back
// to the test file as written.
function callSite(): Site | null {
  // this, gpp, then what called it
  const frame = new Error().stack?.split('\n')[3] ?? ''
  const m = /\(?([^()\s]+):(\d+):\d+\)?$/.exec(frame)
  return m ? { file: m[1], line: Number(m[2]) } : null
}

// Runs a scenario's steps, with what the template's ${…} hold. A step that
// fails says where it is in the test file, if site says where the template is.
export async function play(
  scenario: Scenario,
  vocabulary: GppFile[],
  values: readonly unknown[],
  site: Site | null = null,
): Promise<void> {
  const ctx = { driver: testingLibrary, values, render }
  const runner = { words: testingLibraryWords(), vocabulary: vocabulary.flatMap((f) => f.vocabulary), settle }
  await runSteps(scenario, runner, ctx, async (step, body) => {
    try {
      await body()
    } catch (err) {
      throw pointAt(err, step, site)
    }
  })
}

// Adds the step to the message, with a caret under the word that failed.
function pointAt(err: unknown, step: Step, site: Site | null): unknown {
  if (!(err instanceof Error)) return err
  const pos = (err as { pos?: number }).pos ?? 0
  err.message = `${err.message}\n\n${frame(`${step.keyword}${step.text}`, step.keyword.length + pos)}`
  return located(err, site, step.line, step.column - step.keyword.length)
}

// Puts a place in the template, as line and column, on top of an error's
// stack, as a place in the test file, so a runner shows the Gherkin there.
function located(err: Error, site: Site | null, line: number, column: number): Error {
  if (!site) return err
  const frames = err.stack?.slice(err.stack.indexOf('\n    at ')) ?? ''
  err.stack = `${err.name}: ${err.message}\n    at gpp (${site.file}:${site.line + line - 1}:${column})${frames}`
  return err
}

// ---------------------------------------------------------------- the tests

type TestFn = (name: string, body: () => Promise<void>) => void

// What gpp declares tests with: Jest's globals, or Vitest's, with globals on.
interface Runner {
  describe(name: string, body: () => void): void
  test: TestFn & { skip: TestFn; only: TestFn; fails?: TestFn; failing?: TestFn }
}

function runner(): Runner {
  const { describe, test } = globalThis as Partial<Runner>
  if (typeof describe !== 'function' || typeof test !== 'function')
    throw new Error("gpp declares tests with the test runner's describe and test globals: in Vitest, set test.globals")
  return { describe, test }
}

// How a scenario's tags declare it. Any other tag goes in its name, for -t.
function declarer(test: Runner['test'], tags: string[]): TestFn {
  if (tags.includes('@skip') || tags.includes('@fixme')) return test.skip
  if (tags.includes('@only')) return test.only
  if (tags.includes('@fail')) return test.fails ?? test.failing ?? test
  return test
}

const OWN_TAGS = new Set(['@skip', '@fixme', '@only', '@fail'])

// Declares a Feature's tests, in a describe named for it.
export function gpp(strings: TemplateStringsArray, ...values: unknown[]): void {
  const { describe, test } = runner()
  const site = callSite()
  // Raw, so a string's \" reaches Gherkin++ as it was written.
  const { read: template, problem } = read(strings.raw)
  if (problem !== null) throw new GppError(problem)
  let report: Report | undefined

  for (const feature of template.file.features) {
    describe(feature.name, () => {
      for (const scenario of feature.scenarios) {
        const name = [scenario.name, ...scenario.tags.filter((t) => !OWN_TAGS.has(t))].join(' ')
        declarer(test, scenario.tags)(name, async () => {
          const vocabulary = projectDefines()
          report ??= checked(template, vocabulary)
          const wrong = mistake(template, report, scenario)
          if (wrong !== null) throw located(new GppError(wrong.message), site, wrong.line, wrong.column)
          await play(scenario, vocabulary, values, site)
        })
      }
    })
  }
}
