/*
 * Checking a project's files with its config: each file with the words of the
 * backend that runs it, and only those.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Backend, Config } from '../src/index.ts'
import {
  backendOf,
  checkFiles,
  Env,
  formsFor,
  globToRegExp,
  Interpolated,
  loadSource,
  type,
  words,
} from '../src/index.ts'

const form = formsFor()

/**
 * A backend with a word of its own, Wave, whose templates are Features, with
 * a ${…} that Wave takes.
 */
const Thing = type('Thing', `a thing, as \${…}`, (v): v is Interpolated => v instanceof Interpolated)
const waving: Backend = {
  name: 'Waving',
  files: ['tests/**'],
  words: new Env(words())
    .word(
      'Wave',
      form([Thing], () => {}),
      form([], () => {}),
    )
    .doc({ group: 'Doing', summary: 'Waves.', examples: ['When I Wave'] }, 'Wave'),
  templates: 'features',
  interpolation: Thing,
}
const stories: Backend = { name: 'Stories', files: ['**/*.stories.ts'], words: words(), templates: 'steps' }
const specs: Backend = { name: 'Specs', files: ['features/*.gpp'], words: words() }
const config: Config = { root: '/p', backends: [waving, stories, specs] }

/** Each mistake in these files, as file:line:column message. */
function mistakes(files: Record<string, string>): string[] {
  const loaded = Object.entries(files).map(([file, src]) => loadSource(`/p/${file}`, src))
  return checkFiles(loaded, config).diagnostics.map(
    (d) => `${d.file.slice('/p/'.length)}:${d.line}:${d.column} ${d.message}`,
  )
}

const feature = (...steps: string[]) => ['Feature: F', '  Scenario: S', ...steps.map((s) => `    ${s}`)].join('\n')
const featureTemplate = (...steps: string[]) => `gpp\`\n${feature(...steps)}\n\``
const storyTemplate = (...steps: string[]) => `\n\nexport const S = { play: gpp\`${steps.join('\n')}\` }\n`

test('globs match paths from the root', () => {
  assert.ok(globToRegExp('**/*.gpp').test('a.gpp'))
  assert.ok(globToRegExp('**/*.gpp').test('a/b/c.gpp'))
  assert.ok(!globToRegExp('*.gpp').test('a/b.gpp'))
  assert.ok(globToRegExp('**/*.{test,spec}.ts').test('src/a.spec.ts'))
  assert.equal(backendOf(config, '/p/features/a.gpp'), specs)
  assert.equal(backendOf(config, '/p/tests/a.ts'), waving)
  assert.equal(backendOf(config, '/elsewhere/features/a.gpp'), null)
})

test("a backend's own words are only in its files", () => {
  assert.deepEqual(mistakes({ 'tests/a.ts': featureTemplate('When I Wave') }), [])
  assert.deepEqual(mistakes({ 'features/a.gpp': feature('When I Wave') }), [
    "features/a.gpp:3:12 Unknown word Wave. Capitalised words are code; if it's prose, write it in lowercase.",
  ])
})

test(`a \${…} is for a backend whose words take one`, () => {
  assert.deepEqual(mistakes({ 'tests/a.ts': featureTemplate(`When I Wave \${x}`) }), [])
  assert.deepEqual(mistakes({ 'a.stories.ts': storyTemplate(`When I Click \${x}`) }), [
    `a.stories.ts:3:43 Nothing here takes a \${…}: this file's backend has no words for one`,
  ])
})

test('a file no backend runs says so', () => {
  assert.deepEqual(mistakes({ 'other/a.gpp': feature('When I Click the Button "Add"') }), [
    "other/a.gpp:1:1 No backend in gpp.config.ts runs this file: none of their files' globs match it",
  ])
})

test("a template that isn't what its backend's are says so", () => {
  assert.deepEqual(mistakes({ 'tests/a.stories.ts': storyTemplate('When I Wave') }), [
    "tests/a.stories.ts:1:1 Waving's gpp templates are Features, starting with Feature:",
  ])
  assert.deepEqual(mistakes({ 'features/a.gpp': '' }), [])
})

test('a Define is a mistake only if it is with every backend', () => {
  const defines = 'Define: Greet\n  Wave\n\nDefine: Broken\n  Clik the Button "Add"\n'
  assert.deepEqual(
    mistakes({ 'words.gpp': defines }).map((m) => m.split(' ').slice(0, 3).join(' ')),
    ['words.gpp:5:3 Unknown word'],
  )
})
