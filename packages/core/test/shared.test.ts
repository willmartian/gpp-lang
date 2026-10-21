import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AnyDriver } from '../src/index.ts'
import { loadSource, runSteps, settle, words } from '../src/index.ts'

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
  await play(driver, 'When I Click the Button "Add"', 'Then I should See the Heading "Added"')
  assert.deepEqual(done, [
    'click {"by":"role","role":"button","name":"Add"}',
    'visible {"by":"role","role":"heading","name":"Added"}',
  ])
})

test('the words, run with no driver, say so', async () => {
  await assert.rejects(play(undefined, 'When I Click the Button "Add"'), /ran without a driver/)
})
