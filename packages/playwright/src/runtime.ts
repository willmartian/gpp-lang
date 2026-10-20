// What the generated tests run (see generate.ts). Each generated file declares
// its scenarios as Playwright tests and hands each one a body from here, so a
// generated file says only which tests there are, and everything they do is
// read from the .gpp files when they run.
//
// The project is loaded and checked once per worker, the first time a test
// needs it. A scenario with a mistake the checker can see fails straight away,
// without starting a browser, and so does a broken Define, as a test of its own.
//
// Each Gherkin step becomes a test.step whose location is the step's line in
// the .gpp or Markdown file, so reports and failures point at the Gherkin, not
// at Gherkin++'s own code.

import type { Diagnostic, Scenario, Step, Vocabulary } from '@gpp-lang/core'
import { GppError, runSteps, settle, words } from '@gpp-lang/core'
import { expect, type PlaywrightTestArgs, test } from '@playwright/test'
import type { BrowserContext } from './driver.ts'
import { playwright } from './driver.ts'
import type { Loaded, Project } from './project.ts'
import { loadProject, where } from './project.ts'

// Tags that mean something to Playwright itself, applied as the test starts.
// @only is the generated file's, since it changes which tests are declared.
const MODIFIERS: Record<string, () => void> = {
  '@skip': () => test.skip(),
  '@fixme': () => test.fixme(),
  '@fail': () => test.fail(),
  '@slow': () => test.slow(),
}

type Body = (args: PlaywrightTestArgs) => Promise<void>

// The project as this worker has loaded it, once.
const projects = new Map<string, Loaded>()

function loaded(project: Project): Loaded {
  const key = JSON.stringify(project)
  const known = projects.get(key) ?? loadProject(project)
  projects.set(key, known)
  return known
}

// The tests a generated file can declare, for a project. Called as the file
// loads, so a base URL from the command line applies to its tests.
export function project(p: Project) {
  if (process.env.GPP_BASE_URL) test.use({ baseURL: process.env.GPP_BASE_URL })

  const stale = (what: string) =>
    new Error(`${what} isn't where the generated tests say. They're out of date: run Playwright again.`)

  return {
    test,

    // The scenario on this line of this file.
    scenario(file: string, line: number): Body {
      return async ({ page }) => {
        const project = loaded(p)
        const scenario = project.scenarios.get(where(file, line))
        if (!scenario) throw stale(`The scenario at ${where(file, line)}`)
        for (const tag of scenario.tags) MODIFIERS[tag]?.()
        const problem = project.report.scenarios.get(scenario)
        if (problem) throw located(problem)
        await runScenario(scenario, project.vocabulary, { page, expect, driver: playwright })
      }
    },

    // A scenario the checker found a mistake in, which fails with it, without
    // asking for a page, so no browser starts.
    mistake(file: string, line: number): Body {
      return async () => {
        const project = loaded(p)
        const scenario = project.scenarios.get(where(file, line))
        const problem = scenario && project.report.scenarios.get(scenario)
        if (!scenario || !problem) throw stale(`The mistake in the scenario at ${where(file, line)}`)
        for (const tag of scenario.tags) MODIFIERS[tag]?.()
        throw located(problem)
      }
    },

    // The broken Define on this line, as a test that fails with its mistake.
    define(file: string, line: number): Body {
      return async () => {
        const problem = loaded(p).report.vocabulary.find((d) => d.file === file && d.line === line)
        throw problem ? located(problem) : stale(`The broken Define at ${where(file, line)}`)
      }
    },

    // A file that can't be read as Gherkin++, as a test that fails with why.
    broken(file: string): Body {
      return async () => {
        const err = loaded(p).broken.get(file)
        if (!err) throw stale(`The mistake in ${file}`)
        const [first] = err.problems
        const message = err.problems.map((problem) => problem.message).join('\n')
        throw located({ file, line: first?.line ?? 1, column: first?.column ?? 1, message })
      }
    },
  }
}

export function runScenario(scenario: Scenario, vocabulary: Vocabulary[], ctx: BrowserContext): Promise<void> {
  return runSteps(scenario, { words: words(), vocabulary, settle }, ctx, (step, body) => {
    const location = { file: step.file, line: step.line, column: step.column }
    return test.step(
      `${step.keyword}${step.text}`,
      async () => {
        try {
          await body()
        } catch (err) {
          throw pointAt(err, step)
        }
      },
      { location },
    )
  })
}

// Makes the error's top frame the offending word in the .gpp file, which
// is where Playwright's reporters look for a code frame to show.
function pointAt(err: unknown, step: Step): unknown {
  if (!(err instanceof Error)) return err
  const column = step.column + ((err as { pos?: number }).pos ?? 0)
  const frame = `    at ${step.file}:${step.line}:${column}`
  const [head] = (err.stack ?? '').split(/\n\s+at /)
  err.stack = `${head || `${err.name}: ${err.message}`}\n${frame}`
  return err
}

function located(d: Pick<Diagnostic, 'file' | 'line' | 'column' | 'message'>): GppError {
  const err = new GppError(d.message)
  err.stack = `GppError: ${d.message}\n    at ${d.file}:${d.line}:${d.column}`
  return err
}
