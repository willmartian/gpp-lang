import assert from 'node:assert/strict'
import { test } from 'node:test'
import { INTERPOLATION, LoadError, loadSource, templates } from '../../src/index.ts'

// The text of each gpp template in some JavaScript.
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

// The problems a script that can't be read has, as line:column message.
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
    '5:3 Each line of a gpp template is a step, starting with Given, When, Then, And, But or *',
  ])
  assert.deepEqual(problems('\n\nconst a = gpp`\n  # nothing\n`'), ['3:15 A gpp template needs at least one step'])
  assert.deepEqual(problems(`const a = gpp\`When I Click "\${x}"\``), [`1:29 ${INTERPOLATION}`])
})
