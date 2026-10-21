import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { discover, findConfig, projectFiles } from '@gpp-lang/core/node'

const packages = path.join(import.meta.dirname, '..', 'packages')
const bin = path.join(packages, 'gpp-lang', 'bin', 'gpp-lang.ts')

// A gpp.config.mjs that runs .gpp files with Playwright and stories with
// Storybook, from this repo's packages, wherever it is.
const source = (file: string) => JSON.stringify(pathToFileURL(path.join(packages, file)).href)
const config = [
  `import { defineConfig } from ${source('core/src/node.ts')}`,
  `import { playwright } from ${source('playwright/src/config.ts')}`,
  `import { storybook } from ${source('storybook/src/config.ts')}`,
  'export default defineConfig({ backends: [playwright(), storybook()] })',
].join('\n')

// A project of files, given as path → contents, with a gpp.config.mjs.
function project(files: Record<string, string>): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gpp-project-')))
  for (const [name, src] of Object.entries({ 'gpp.config.mjs': config, ...files })) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), src)
  }
  return dir
}

const broken = 'Feature: F\n  Scenario: S\n    When I Clik the Button "Add"\n'
const fine = 'Feature: F\n  Scenario: S\n    When I Click the Button "Add"\n'

const check = (cwd: string, ...paths: string[]) =>
  spawnSync(process.execPath, [bin, 'check', ...paths], { cwd, encoding: 'utf8' })

test('a project is the files under its gpp.config.ts, but not those of a project inside it', () => {
  const dir = project({ 'a.gpp': fine, 'features/b.gpp': fine, 'other/gpp.config.mjs': config, 'other/c.gpp': fine })
  assert.equal(findConfig(path.join(dir, 'features')), path.join(dir, 'gpp.config.mjs'))
  assert.deepEqual(
    projectFiles(dir).map((f) => path.relative(dir, f)),
    ['a.gpp', 'features/b.gpp'],
  )
  assert.deepEqual(
    projectFiles(path.join(dir, 'other')).map((f) => path.relative(dir, f)),
    ['other/c.gpp'],
  )
})

test('each project has its own words, so two can Define the same one', () => {
  const add = (field: string) => `Define: Add Text (Item)\n  Fill the Field "${field}" with Item\n`
  const uses = 'Feature: F\n  Scenario: S\n    When I Add "Milk"\n'
  const dir = project({
    'words.gpp': add('Item'),
    'a.gpp': uses,
    'other/gpp.config.mjs': config,
    'other/words.gpp': add('Name'),
    'other/a.gpp': uses,
  })
  const run = check(dir)
  assert.equal(run.stdout.trim(), 'No mistakes in 4 files')
  assert.equal(run.status, 0)
})

test("check checks what's under the paths it's given, with the rest of their projects' Defines", () => {
  const dir = project({
    'words.gpp': 'Define: Add Text (Item)\n  Fill the Field "Item" with Item\n',
    'features/a.gpp': 'Feature: F\n  Scenario: S\n    When I Add "Milk"\n',
    'drafts/b.gpp': broken,
  })
  const run = check(dir, 'features')
  assert.equal(run.stdout.trim(), 'No mistakes in 1 file')
  assert.equal(run.status, 0)
})

test('without a gpp.config.ts, check says so', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gpp-loose-')))
  fs.writeFileSync(path.join(dir, 'a.gpp'), broken)
  const run = check(dir)
  assert.equal(run.stdout.trim(), 'No gpp.config.ts at or under this directory')
  assert.equal(run.status, 1)
})

test('a file no backend in the config runs is a mistake', () => {
  const dir = project({ 'notes.ts': 'export const s = gpp`Feature: F\n  Scenario: S\n    When I Click`\n' })
  const run = check(dir)
  assert.match(run.stdout, /No backend in gpp\.config\.ts runs this file/)
  assert.equal(run.status, 1)
})

test('ignored files and directories are left out', () => {
  const dir = project({ 'a.gpp': fine, 'drafts/b.gpp': fine, 'c.gpp': fine })
  const found = discover([dir], dir, [path.join(dir, 'drafts'), path.join(dir, 'c.gpp')])
  assert.deepEqual(found, [path.join(dir, 'a.gpp')])
})

test("check checks each file with its backend's words, and the project's Defines", () => {
  const dir = project({
    'words.gpp': 'Define: Retitle Text (New)\n  Fill the Field "Title" with New\n',
    'visiting.gpp': 'Feature: F\n  Scenario: S\n    Given I Visit "/"\n',
    'editor.stories.ts': [
      "import { gpp } from '@gpp-lang/storybook'",
      '',
      'export const Retitling = {',
      '  play: gpp`',
      '    When I Retitle the post "Hello"',
      '    Then I should See the Status "Saved"',
      '  `,',
      '}',
      '',
      'export const Visiting = { play: gpp`Given I Visit "/"` }',
      'export const Plain = "gpp`When I Clik`"',
    ].join('\n'),
    'plain.ts': 'export const nothing = 1\n',
  })
  const run = check(dir)
  assert.equal(
    run.stdout.trim(),
    [
      'editor.stories.ts:6:27',
      '    Then I should See the Status "Saved"',
      '                          ^',
      '  Status expected Containing "some text" (a Status has no name to match exactly), but got "Saved"',
      '',
      'editor.stories.ts:10:45',
      '    export const Visiting = { play: gpp`Given I Visit "/"` }',
      '                                                ^',
      "  Unknown word Visit. Did you mean List? Capitalised words are code; if it's prose, write it in lowercase.",
      '',
      '2 mistakes in 3 files',
    ].join('\n'),
  )
  assert.equal(run.status, 1)
})
