/*
 * The words Playwright adds to the shared ones: each has a doc, and its
 * examples check.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check, leftovers, loadSource, words } from '@gpp-lang/core'
import { playwrightWords } from '../src/config.ts'

const own = [...playwrightWords().words.keys()]

test("the words for the page are only Playwright's", () => {
  assert.deepEqual(own.sort(), ['at', 'back', 'reload', 'titled', 'visit'])
  for (const word of own) assert.equal(words().lookup(word), undefined)
})

test('each has a doc, and its examples check', () => {
  for (const word of own) {
    const doc = playwrightWords().docOf(word)
    assert.ok(doc, word)
    for (const example of doc.examples) {
      const src = ['Feature: F', '  Scenario: S', ...example.split('\n').map((line) => `    ${line}`)].join('\n')
      const report = check([loadSource('example.gpp', src)], { words: playwrightWords(), settle: leftovers })
      assert.deepEqual(
        [...report.scenarios.values()].map((d) => d.message),
        [],
        `${word}: ${example}`,
      )
    }
  }
})
