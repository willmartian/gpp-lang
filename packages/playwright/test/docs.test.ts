import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check, core, keywords, leftovers, loadSource } from 'spp-lang'
import { browser } from '../src/index.ts'

const words = browser(core())
const steps = keywords(async () => {})

test('every built-in word and step keyword has a doc', () => {
  const missing = [...words.names(), ...steps.names()].filter((name) => !(words.docOf(name) ?? steps.docOf(name)))
  assert.deepEqual(missing, [])
})

test("every doc's examples check", () => {
  for (const env of [words, steps]) {
    for (const name of new Set(env.names())) {
      for (const example of env.docOf(name)?.examples ?? []) {
        const src = ['Feature: F', '  Scenario: S', ...example.split('\n').map((line) => `    ${line}`)].join('\n')
        const report = check([loadSource('example.spp', src)], { words, settle: leftovers })
        const mistakes = [...report.scenarios.values()].map((d) => d.message)
        assert.deepEqual(mistakes, [], `${name}: ${example}`)
      }
    }
  }
})
