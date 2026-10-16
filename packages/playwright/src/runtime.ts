// What the generated tests run (see generate.ts). Each generated file declares
// its scenarios as Playwright tests and hands each one a body from here, so a
// generated file says only which tests there are, and everything they do is
// read from the .spp files when they run.
//
// The project is loaded and checked once per worker, the first time a test
// needs it. A scenario with a mistake the checker can see fails straight away,
// without starting a browser, and so does a broken Define, as a test of its own.
//
// Each Gherkin step becomes a test.step whose location is the step's line in
// the .spp or Markdown file, so reports and failures point at the Gherkin, not
// at Spec++'s own code.

import { expect, type PlaywrightTestArgs, test } from '@playwright/test'
import type { Diagnostic, Scenario, Step, Vocabulary } from '@spp-lang/core'
import { core, runSteps, SppError } from '@spp-lang/core'
import { loadConfig } from '@spp-lang/core/node'
import type { Loaded, Project } from './project.ts'
import { isPlaywright, loadProject, where } from './project.ts'
import type { BrowserContext } from './words.ts'
import { browser, settle } from './words.ts'

// Tags that mean something to Playwright itself, applied as the test starts.
// @only is the generated file's, since it changes which tests are declared.
const MODIFIERS: Record<string, () => void> = {
  '@skip': () => test.skip(),
  '@fixme': () => test.fixme(),
  '@fail': () => test.fail(),
  '@slow': () => test.slow(),
}

type Body = (args: PlaywrightTestArgs) => Promise<void>

// The project as this worker has loaded it, from its spp.config, once.
const projects = new Map<string, Promise<Loaded>>()

function loaded(project: Project): Promise<Loaded> {
  const cached = projects.get(project.config)
  if (cached) return cached
  const loading = loadConfig(project.config).then((config) => {
    const backend = config.backends.find(isPlaywright)
    if (!backend) throw new Error(`${project.config} no longer has a playwright() backend: run Playwright again`)
    return loadProject(config, backend)
  })
  projects.set(project.config, loading)
  return loading
}

// The tests a generated file can declare, for a project. Called as the file
// loads, so a base URL from the command line applies to its tests.
export function project(p: Project) {
  if (process.env.SPP_BASE_URL) test.use({ baseURL: process.env.SPP_BASE_URL })

  const stale = (what: string) =>
    new Error(`${what} isn't where the generated tests say. They're out of date: run Playwright again.`)

  return {
    test,

    // The scenario on this line of this file.
    scenario(file: string, line: number): Body {
      return async ({ page }) => {
        const project = await loaded(p)
        const scenario = project.scenarios.get(where(file, line))
        if (!scenario) throw stale(`The scenario at ${where(file, line)}`)
        for (const tag of scenario.tags) MODIFIERS[tag]?.()
        const problem = project.report.scenarios.get(scenario)
        if (problem) throw located(problem)
        await runScenario(scenario, project.vocabulary, { page, expect })
      }
    },

    // A scenario the checker found a mistake in, which fails with it, without
    // asking for a page, so no browser starts.
    mistake(file: string, line: number): Body {
      return async () => {
        const project = await loaded(p)
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
        const problem = (await loaded(p)).report.vocabulary.find((d) => d.file === file && d.line === line)
        throw problem ? located(problem) : stale(`The broken Define at ${where(file, line)}`)
      }
    },

    // A file that can't be read as Spec++, as a test that fails with why.
    broken(file: string): Body {
      return async () => {
        const err = (await loaded(p)).broken.get(file)
        if (!err) throw stale(`The mistake in ${file}`)
        const [first] = err.problems
        const message = err.problems.map((problem) => problem.message).join('\n')
        throw located({ file, line: first?.line ?? 1, column: first?.column ?? 1, message })
      }
    },
  }
}

export function runScenario(scenario: Scenario, vocabulary: Vocabulary[], ctx: BrowserContext): Promise<void> {
  return runSteps(scenario, { words: browser(core()), vocabulary, settle }, ctx, (step, body) => {
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

// Makes the error's top frame the offending word in the .spp file, which
// is where Playwright's reporters look for a code frame to show.
function pointAt(err: unknown, step: Step): unknown {
  if (!(err instanceof Error)) return err
  const column = step.column + ((err as { pos?: number }).pos ?? 0)
  const frame = `    at ${step.file}:${step.line}:${column}`
  const [head] = (err.stack ?? '').split(/\n\s+at /)
  err.stack = `${head || `${err.name}: ${err.message}`}\n${frame}`
  return err
}

function located(d: Pick<Diagnostic, 'file' | 'line' | 'column' | 'message'>): SppError {
  const err = new SppError(d.message)
  err.stack = `SppError: ${d.message}\n    at ${d.file}:${d.line}:${d.column}`
  return err
}
