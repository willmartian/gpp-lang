import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LoadError, loadSource, templates } from '../../src/index.ts'

/** The text of each gpp template in some JavaScript. */
const texts = (src: string) => templates(src).map((t) => src.slice(t.start, t.end))

test('gpp templates are found, and other templates are not', () => {
  assert.deepEqual(texts('a = gpp`When I Click` + html`<p>` + s.gpp`Then I See "x"`'), [
    'When I Click',
    'Then I See "x"',
  ])
  assert.deepEqual(texts('mygpp`When I Click`'), [])
})

test("gpp in a string or a comment isn't a template", () => {
  assert.deepEqual(texts('"gpp`a`" + \'gpp`b`\' // gpp`c`\n/* gpp`d` */ gpp`e`'), ['e'])
})

test("a template's escapes and what's put in it don't end it", () => {
  const src = `gpp\`a \\\` b\` + \`\${ { x: \`}\` } } gpp\` + gpp\`c \${ gpp\`d\` } e\``
  assert.deepEqual(texts(src), ['a \\` b', `c \${ gpp\`d\` } e`, 'd'])
  assert.deepEqual(
    templates(src).map((t) => t.interpolations.length),
    [0, 1, 0],
  )
})

const stories = [
  "import { gpp } from '@gpp-lang/storybook'", //  1
  '', //                                           2
  'export const Saving = {', //                    3
  '  play: gpp`', //                               4
  '    When I Click the Button "Save"', //         5
  '    Then the Status should Read "Saved"', //    6
  '  `,', //                                       7
  '}', //                                          8
  '', //                                           9
  'export const Empty = { play: gpp`Then the Status should be Empty` }', // 10
].join('\n')

test('each template is a scenario, named for its story, with its steps where they are', () => {
  const [saving, empty] = loadSource('editor.stories.ts', stories).features.flatMap((f) => f.scenarios)
  assert.equal(saving.name, 'Saving')
  assert.deepEqual(
    saving.steps.map((s) => [s.line, s.column, `${s.keyword}${s.text}`]),
    [
      [5, 10, 'When I Click the Button "Save"'],
      [6, 10, 'Then the Status should Read "Saved"'],
    ],
  )
  assert.equal(empty.name, 'Empty')
  assert.deepEqual(
    empty.steps.map((s) => [s.line, s.column]),
    [[10, 39]],
  )
})

/** The problems a script that can't be read has, as line:column message. */
function problems(src: string): string[] {
  try {
    loadSource('a.stories.ts', src)
    return []
  } catch (err) {
    if (!(err instanceof LoadError)) throw err
    return err.problems.map((p) => `${p.line}:${p.column} ${p.message}`)
  }
}

test("a template that isn't steps says where", () => {
  assert.deepEqual(problems('\n\nconst a = gpp`\n  When I Click the Button "Save"\n  Click the Button "Save"\n`'), [
    '5:3 Each line of a gpp template is a step, starting with Given, When, Then, And, But or *, unless the template starts with Feature:',
  ])
  assert.deepEqual(problems('\n\nconst a = gpp`\n  # nothing\n`'), ['3:15 A gpp template needs at least one step'])
})

const tests = [
  "import { gpp } from '@gpp-lang/testing-library'", // 1
  '', //                                                2
  'gpp`', //                                           3
  '  Feature: Editor', //                              4
  '', //                                                5
  '    Scenario: Saving', //                           6
  `    Given I Render \${<Editor title="" />} on its own`, // 7
  '    When I Click the Button "Save"', //             8
  '', //                                                9
  '    @skip', //                                       10
  '    Scenario: Retitling', //                       11
  '    Given I Render ${<Editor', //                  12
  '      title="Old"', //                              13
  '    />} with a title', //                           14
  '    When I Fill the Field "Title" with "New"', //   15
  '`', //                                               16
].join('\n')

test(`a test's template is a Feature, its \${…} numbered in their place`, () => {
  const [feature] = loadSource('editor.test.tsx', tests).features
  assert.equal(feature.name, 'Editor')
  const [saving, retitling] = feature.scenarios
  assert.deepEqual(
    saving.steps.map((s) => [s.line, s.column, `${s.keyword}${s.text}`]),
    [
      // padded to the width of ${<Editor title="" />}
      [7, 11, `Given I Render \${0}${' '.repeat(18)} on its own`],
      [8, 10, 'When I Click the Button "Save"'],
    ],
  )
  assert.deepEqual(retitling.tags, ['@skip'])
  assert.deepEqual(
    retitling.steps.map((s) => [s.line, `${s.keyword}${s.text}`]),
    [
      [12, `Given I Render \${1}  with a title`],
      [15, 'When I Fill the Field "Title" with "New"'],
    ],
  )
})

test(`a story's template's \${…} are numbered too, for its backend's words to take or not`, () => {
  const [story] = loadSource('a.stories.ts', `\n\nexport const S = { play: gpp\`When I Click \${x}\` }`).features
  assert.deepEqual(
    story.scenarios[0].steps.map((s) => `${s.keyword}${s.text}`),
    [`When I Click \${0}`],
  )
})
