/*
 * Reading and checking tests' gpp templates, without a DOM. What they do in
 * one is tested through Vitest itself: test/fixtures, and
 * examples/testing-library.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { testingLibraryWords } from '../src/config.ts'
import type { Read } from '../src/feature.ts'
import { checked, mistake, read } from '../src/feature.ts'

/** A template as a tag would be given it: its strings, around each ${…}. */
const strings = (src: string) => src.split(`\${…}`)

function readOk(src: string): Read {
  const { read: template, problem } = read(strings(src))
  if (problem !== null) throw new Error(problem)
  return template
}

const problem = (src: string) => read(strings(src)).problem

/** Each scenario's first mistake, or null. */
function mistakes(src: string): (string | null)[] {
  const template = readOk(src)
  const report = checked(template, [])
  return template.file.features.flatMap((f) => f.scenarios).map((s) => mistake(template, report, s)?.message ?? null)
}

test('a template is a Feature, with a test for each Scenario and Outline row', () => {
  const template = readOk(`
    Feature: Editor

      Scenario: Saving
        Given I Render \${…}
        When I Click the Button "Save"

      @skip
      Scenario Outline: Titled <title>
        Given I Render \${…}
        Then the Field "Title" should have the Value "<title>"

        Examples:
          | title |
          | One   |
          | Two   |
  `)
  const [feature] = template.file.features
  assert.equal(feature.name, 'Editor')
  assert.deepEqual(
    feature.scenarios.map((s) => [s.name, s.tags]),
    [
      ['Saving', []],
      ['Titled One (title: One)', ['@skip']],
      ['Titled Two (title: Two)', ['@skip']],
    ],
  )
  assert.deepEqual(
    feature.scenarios[1].steps.map((s) => `${s.keyword}${s.text}`),
    [`Given I Render \${1}`, 'Then the Field "Title" should have the Value "One"'],
  )
})

test('a template with no Feature says what a test needs', () => {
  assert.match(problem('When I Click the Button "Save"') ?? '', /^A test's gpp template is a Feature/)
})

test('a mistake is shown at its word, before anything runs', () => {
  assert.deepEqual(
    mistakes(`
      Feature: Editor
        Scenario: Saving
          Given I Render \${…}
          Then I should See the Status "Draft saved"
    `),
    [
      [
        'Status expected Containing "some text" (a Status has no name to match exactly), but got "Draft saved"',
        '',
        '    Then I should See the Status "Draft saved"',
        '                          ^',
      ].join('\n'),
    ],
  )
})

test(`only Render takes what a \${…} holds`, () => {
  const [clicked, left] = mistakes(`
    Feature: Editor
      Scenario: Clicking it
        When I Click \${…}
      Scenario: Leaving it
        Given the editor \${…}
  `)
  assert.match(clicked ?? '', /^Click expected something on the page, but got a \$\{…\}/)
  assert.match(left ?? '', /a \$\{…\}/)
})

test("Playwright's words for the page aren't a test's", () => {
  const [visit] = mistakes(`
    Feature: Editor
      Scenario: Going somewhere
        Given I Visit "/"
  `)
  assert.match(visit ?? '', /^Unknown word Visit/)
})

test("Render's docs example checks", () => {
  const [example] = testingLibraryWords().docOf('Render')?.examples ?? []
  const steps = example.replace(/\$\{[^}]*\}/, `\${…}`)
  assert.deepEqual(mistakes(`\n    Feature: Docs\n      Scenario: The example\n        ${steps}\n  `), [null])
})
