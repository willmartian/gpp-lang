import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AnyDriver } from '../src/index.ts'
import { checkFiles, loadSource, runSteps, settle, words } from '../src/index.ts'

// A driver that writes down what it's asked to do, finding things as strings.
function recorder() {
  const done: string[] = []
  const driver: AnyDriver = {
    find: (_, root, query) => `${root ? `${root} > ` : ''}${JSON.stringify(query)}`,
    act: async (_, target, action) => void done.push(`${action.do} ${target}`),
    press: async (_, key) => void done.push(`press ${key}`),
    expect: async (_, target, state, not) => void done.push(`${not ? 'not ' : ''}${state.is} ${target}`),
    all: async () => [],
    retry: (_, attempt) => attempt(),
    visit: async (_, where) => void done.push(`visit ${where}`),
    reload: async () => void done.push('reload'),
    back: async () => void done.push('back'),
    expectPage: async (_, state, not) => void done.push(`${not ? 'not ' : ''}${state.is} page`),
  }
  return { driver, done }
}

const scenario = (...steps: string[]) => {
  const src = ['Feature: F', '  Scenario: S', ...steps.map((s) => `    ${s}`)].join('\n')
  const [found] = loadSource('a.gpp', src).features[0].scenarios
  return found
}

const play = (driver: AnyDriver | undefined, ...steps: string[]) =>
  runSteps(scenario(...steps), { words: words(), vocabulary: [], settle }, { driver }, (_, body) => body())

test("the words drive whatever driver the step's context has", async () => {
  const { driver, done } = recorder()
  await play(driver, 'Given I Visit "/"', 'When I Click the Button "Add"', 'Then I should be At "/added"')
  assert.deepEqual(done, ['visit /', 'click {"by":"role","role":"button","name":"Add"}', 'at page'])
})

test(`Render renders what the test's template has in its \${…}`, async () => {
  const { driver, done } = recorder()
  const src = `gpp\`\nFeature: F\n  Scenario: S\n    Given I Render \${<Editor />} on its own\n\``
  const [found] = loadSource('a.test.tsx', src).features[0].scenarios
  const runner = { words: words({ template: true, render: true }), vocabulary: [], settle }
  const render = (ui: unknown) => void done.push(`render ${ui}`)
  await runSteps(found, runner, { driver, values: ['the editor'], render }, (_, body) => body())
  assert.deepEqual(done, ['render the editor'])
})

test("only a test's template has Render", async () => {
  await assert.rejects(play(undefined, 'Given I Render the editor'), /^GppError: Only a test's gpp template can Render/)
  const runner = { words: words({ template: true }), vocabulary: [], settle }
  await assert.rejects(
    runSteps(scenario('Given I Render the editor'), runner, {}, (_, body) => body()),
    /^GppError: A story renders itself from its args, so its template has no Render/,
  )
})

test('the words, run with no driver, say so', async () => {
  await assert.rejects(play(undefined, 'When I Click the Button "Add"'), /ran without a driver/)
})

test("a template's words have none for the page, and say why", () => {
  const src = '\n\nexport const S = { play: gpp`Given I Visit "/"` }\n'
  const [problem] = checkFiles([loadSource('a.stories.ts', src)]).diagnostics
  assert.equal(problem.message, 'A template plays on one page, already open, so it has no Visit')
})
