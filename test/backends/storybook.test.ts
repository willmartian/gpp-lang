// Reading and checking spp templates, without a browser. What they do in one
// is tested through Storybook itself: examples/storybook, and the fixtures in
// test/fixtures/storybook, which must fail.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prepare, spp, useWords } from '../../src/backends/storybook/play.ts'

const problem = (src: string) => prepare(src).problem

test('a template is the steps of a scenario', () => {
  const { scenario } = prepare(`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `)
  assert.deepEqual(
    scenario?.steps.map((s) => `${s.keyword}${s.text}`),
    [
      'When I Fill the Field "Title" with "Hello"',
      'And I Click the Button "Save"',
      'Then the Status should Read "Draft saved"',
    ],
  )
})

test('a table under a step reaches it', () => {
  const { scenario } = prepare(`
    Then the Listitem should Read
      | news  |
      | draft |
  `)
  assert.deepEqual(scenario?.steps[0].argument, [['news'], ['draft']])
})

test('a mistake is shown at its word, before anything runs', () => {
  assert.equal(
    problem(`
      When I Click the Button "Save"
      Then I should See the Status "Draft saved"
    `),
    [
      'Status expected Containing "some text" (a Status has no name to match exactly), but got "Draft saved"',
      '',
      '    Then I should See the Status "Draft saved"',
      '                          ^',
    ].join('\n'),
  )
})

test("a browser's words for the page say why a story has none", () => {
  assert.match(problem('When I Visit "/"') ?? '', /^A story is one page, already open, so a play function has no Visit/)
})

test('a line that is not a step says so', () => {
  assert.equal(
    problem('Click the Button "Save"'),
    [
      'Each line of an spp template is a step, starting with Given, When, Then, And, But or *',
      '',
      '    Click the Button "Save"',
      '    ^',
    ].join('\n'),
  )
})

test('a template of nothing is a mistake', () => {
  assert.match(problem('\n  # just a comment\n') ?? '', /^An spp template needs at least one step/)
})

test('a template can use the Defines from useWords', () => {
  useWords({ 'words.spp': 'Define: Retitle Text (New)\n  Fill the Field "Title" with New\n' })
  try {
    assert.equal(problem('When I Retitle the post "Hello"'), null)
  } finally {
    useWords({})
  }
  assert.match(problem('When I Retitle the post "Hello"') ?? '', /^Unknown word Retitle/)
})

test('useWords says where a mistake in a Define is', () => {
  assert.throws(
    () => useWords({ 'words.spp': 'Define: Retitle Text (New)\n  Fil the Field "Title" with New\n' }),
    /^SppError: words\.spp:2:3 \(in Define Retitle\)\n {4}Fil the Field "Title" with New\n {4}\^\n {2}Unknown word Fil/,
  )
  useWords({})
})

test('useWords takes only Defines', () => {
  assert.throws(
    () => useWords({ 'words.spp': 'Feature: F\n  Scenario: S\n    When I Click the Button "Save"\n' }),
    /words\.spp has a Feature in it, but useWords only takes Defines/,
  )
})

test('a template with a value put in it is a mistake', () => {
  const title = 'Hello'
  // @ts-expect-error: its type says so too
  assert.throws(() => spp`When I Fill the Field "Title" with "${title}"`, /can't have \$\{…\} in it/)
})
