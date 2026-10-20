// Gherkin++ as a Storybook play function.
//
//     export const SavingADraft: Story = {
//       args: { title: '' },
//       play: gpp`
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
// It's checked the first time it plays, against the language's words as a
// template has them, with no page words, and the project's Defines, so a
// mistake fails its own story before anything is clicked.

import type { GppFile, Scenario, Step } from '@gpp-lang/core'
import {
  check,
  GppError,
  INTERPOLATION,
  LoadError,
  leftovers,
  loadSource,
  runSteps,
  settle,
  words,
} from '@gpp-lang/core'
import type { StoryContext } from './driver.ts'
import { testingLibrary } from './driver.ts'

// What a play function is given, as far as Gherkin++ needs it. Storybook's own
// context has all of this, so a template's type fits any renderer's play.
export interface PlayContext extends StoryContext {
  step(label: string, play: () => Promise<void>): Promise<void> | void
}

export type Play = (context: PlayContext) => Promise<void>

// The Defines every template can use, from useWords.
let defines: GppFile[] = []

// The project's Defines, for every template, from its .gpp files and
// Markdown, given as path → contents, so a mistake in one says where. Their
// scenarios are another backend's, and their mistakes are gpp-lang check's to
// report: a template fails only on one it uses. The addon's preview entry
// calls it with what its Vite plugin read (preset.ts).
export function useWords(files: Record<string, string>): void {
  defines = Object.entries(files).map(([file, src]) => ({ ...loadSource(file, src), features: [] }))
}

const template = () => words({ template: true })

// A template as a script of its own, as gpp-lang check reads it in a stories
// file (templates.ts), with room above it for the Gherkin around it, and on
// lines of its own, so a message shows only what's in it.
const FILE = 'gpp template.js'
const script = (src: string) => `\n\ngpp\`\n${src}\n\``

// What a template means, or the first thing wrong with it.
export type Prepared = { scenario: Scenario; problem: null } | { scenario: null; problem: string }

// Reads and checks a template, as written, with the Defines from useWords.
export function prepare(src: string): Prepared {
  const source = script(src)
  let file: GppFile
  try {
    file = loadSource(FILE, source)
  } catch (err) {
    if (!(err instanceof LoadError)) throw err
    return { scenario: null, problem: err.problems.map((p) => framed(source, p)).join('\n\n') }
  }
  const scenario = file.features[0]?.scenarios[0]
  if (!scenario) throw new Error('A template that loads has a scenario')
  const report = check([...defines, file], { words: template(), settle: leftovers })
  const mistake = report.scenarios.get(scenario)
  return mistake ? { scenario: null, problem: framed(source, mistake) } : { scenario, problem: null }
}

// What's wrong, then the line it's on, with a caret under where.
function framed(source: string, { line, column, message }: { line: number; column: number; message: string }): string {
  const text = source.split('\n')[line - 1] ?? ''
  const indent = text.length - text.trimStart().length
  return `${message}\n\n${frame(text.trim(), column - 1 - indent)}`
}

const frame = (text: string, index: number) => `    ${text}\n    ${' '.repeat(Math.max(0, index))}^`

export function gpp(strings: TemplateStringsArray, ...values: never[]): Play {
  if (values.length) throw new GppError(INTERPOLATION)
  // Raw, so a string's \" reaches Gherkin++ as it was written.
  const src = strings.raw.join('')
  let prepared: { for: GppFile[]; as: Prepared } | undefined

  return async (context) => {
    // Read again if useWords has been called since, as it is when preview.ts changes.
    if (prepared?.for !== defines) prepared = { for: defines, as: prepare(src) }
    const { scenario, problem } = prepared.as
    if (problem !== null) throw new GppError(problem)

    const vocabulary = defines.flatMap((f) => f.vocabulary)
    const ctx = { canvasElement: context.canvasElement, driver: testingLibrary }
    await runSteps(scenario, { words: template(), vocabulary, settle }, ctx, async (step, body) => {
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
  err.message = `${err.message}\n\n${frame(`${step.keyword}${step.text}`, step.keyword.length + pos)}`
  return err
}
