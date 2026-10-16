// Spec++ as a Storybook play function.
//
//     export const SavingADraft: Story = {
//       args: { title: '' },
//       play: spp`
//         When I Fill the Field "Title" with "Hello"
//         And I Click the Button "Save"
//         Then I should See the Status "Draft saved"
//       `,
//     }
//
// A template is a scenario's steps. The story is the scenario, so there's no
// Feature or Scenario line, and its args are its setup. Each step is a
// Storybook step, so the Interactions panel shows the Gherkin, with what each
// step did under it.
//
// A template can't have ${…} in it: what a spec checks is written out, so it
// reads the same as it runs, and the checker can see all of it.
//
// It's checked the first time it plays, against the words a play function has
// (words.ts) and any Defines from useWords, so a mistake fails its own story
// before anything is clicked.

import type { Diagnostic } from '../../language/check.ts'
import { check, format } from '../../language/check.ts'
import type { Env } from '../../language/cognate.ts'
import { core, SppError } from '../../language/cognate.ts'
import type { Scenario, SppFile, Step } from '../../language/load.ts'
import { LoadError, loadSource } from '../../language/load.ts'
import { runSteps } from '../../language/steps.ts'
import { leftovers } from '../../words/shared.ts'
import type { StoryContext } from './words.ts'
import { settle, storybook } from './words.ts'

// What a play function is given, as far as Spec++ needs it. Storybook's own
// context has all of this, so a template's type fits any renderer's play.
export interface PlayContext extends StoryContext {
  step(label: string, play: () => Promise<void>): Promise<void> | void
}

export type Play = (context: PlayContext) => Promise<void>

// The Defines every template can use, from useWords.
let defines: SppFile[] = []

// Defines for every template, as .spp files given as path → contents, so a
// mistake in one says where. Called in .storybook/preview.ts, where Vite can
// read them:
//
//     useWords(import.meta.glob('../features/*.spp', { query: '?raw', import: 'default', eager: true }))
export function useWords(files: Record<string, string>): void {
  defines = Object.entries(files).map(([file, src]) => {
    const loaded = loadSource(file, src)
    if (loaded.features.length)
      throw new SppError(`${file} has a Feature in it, but useWords only takes Defines. Scenarios are spp templates.`)
    return loaded
  })
  const report = check(defines, { words: words(), settle: leftovers })
  if (report.vocabulary.length) throw new SppError(report.vocabulary.map((d) => format(d, files[d.file])).join('\n\n'))
}

let builtins: Env | undefined
const words = () => {
  builtins ??= storybook(core())
  return builtins
}

// Where a template is, for messages. Its own lines come after these.
const FILE = 'spp template'
const HEADER = 'Feature: Story\nScenario: Story\n'

const KEYWORD = /^(?:Given|When|Then|And|But|\*)\s/
const DOC_STRING = /^(?:"""|```)/

// What a template means, or the first thing wrong with it.
export type Prepared = { scenario: Scenario; problem: null } | { scenario: null; problem: string }

// Reads and checks a template, as written, with the Defines from useWords.
export function prepare(src: string): Prepared {
  const wrong = notSteps(src)
  if (wrong) return { scenario: null, problem: wrong }
  let file: SppFile
  try {
    file = loadSource(FILE, HEADER + src)
  } catch (err) {
    if (!(err instanceof LoadError)) throw err
    return { scenario: null, problem: err.problems.map((p) => p.message).join('\n') }
  }
  const scenario = file.features[0]?.scenarios[0]
  if (!scenario?.steps.length) return { scenario: null, problem: 'An spp template needs at least one step' }
  const report = check([...defines, file], { words: words(), settle: leftovers })
  const vocabulary = report.vocabulary[0]
  if (vocabulary) return { scenario: null, problem: vocabulary.message }
  const mistake = report.scenarios.get(scenario)
  return mistake ? { scenario: null, problem: framed(mistake, scenario) } : { scenario, problem: null }
}

// Each line is a step, a table or DocString under one, or a comment, as in a
// Scenario. Gherkin's own message for a line that isn't lists its grammar.
function notSteps(src: string): string | null {
  let inDocString = false
  for (const raw of src.split('\n')) {
    const line = raw.trim()
    if (DOC_STRING.test(line)) inDocString = !inDocString
    if (inDocString || DOC_STRING.test(line) || !line || line.startsWith('|') || line.startsWith('#')) continue
    if (!KEYWORD.test(line))
      return `Each line of an spp template is a step, starting with Given, When, Then, And, But or *, but this isn't:\n    ${line}`
  }
  return null
}

// A step, with a caret under where it went wrong: index, from its keyword.
const frame = (step: Step, index: number) => `    ${step.keyword}${step.text}\n    ${' '.repeat(Math.max(0, index))}^`

function framed(d: Diagnostic, scenario: Scenario): string {
  const step = scenario.steps.find((s) => s.line === d.line)
  if (!step) return d.message
  return `${d.message}\n\n${frame(step, d.column - step.column + step.keyword.length)}`
}

export function spp(strings: TemplateStringsArray, ...values: never[]): Play {
  if (values.length)
    throw new SppError(
      `An spp template can't have \${…} in it. Write what it checks out in full, so it reads as it runs.`,
    )
  // Raw, so a string's \" reaches Spec++ as it was written.
  const src = strings.raw.join('')
  let prepared: { for: SppFile[]; as: Prepared } | undefined

  return async (context) => {
    // Read again if useWords has been called since, as it is when preview.ts changes.
    if (prepared?.for !== defines) prepared = { for: defines, as: prepare(src) }
    const { scenario, problem } = prepared.as
    if (problem !== null) throw new SppError(problem)

    const vocabulary = defines.flatMap((f) => f.vocabulary)
    await runSteps(scenario, { words: words(), vocabulary, settle }, context, async (step, body) => {
      await context.step(`${step.keyword}${step.text}`, async () => {
        try {
          await body()
        } catch (err) {
          throw pointAt(err, step)
        }
      })
    })
  }
}

// Adds the step to the message, with a caret under the word that failed.
function pointAt(err: unknown, step: Step): unknown {
  if (!(err instanceof Error)) return err
  const pos = (err as { pos?: number }).pos ?? 0
  err.message = `${err.message}\n\n${frame(step, step.keyword.length + pos)}`
  return err
}
