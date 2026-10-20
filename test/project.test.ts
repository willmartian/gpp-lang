import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { discover, projectFiles, projectRoot } from '@spp-lang/core/node'

const bin = path.join(import.meta.dirname, '..', 'packages', 'spp-lang', 'bin', 'spp-lang.ts')

// A project of files, given as path → contents, with a package.json.
function project(files: Record<string, string>): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spp-project-')))
  for (const [name, src] of Object.entries({ 'package.json': '{}', ...files })) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), src)
  }
  return dir
}

const broken = 'Feature: F\n  Scenario: S\n    When I Clik the Button "Add"\n'
const fine = 'Feature: F\n  Scenario: S\n    When I Click the Button "Add"\n'

const check = (cwd: string, ...paths: string[]) =>
  spawnSync(process.execPath, [bin, 'check', ...paths], { cwd, encoding: 'utf8' })

test("a project is the files under the nearest package.json, but not a package's inside it", () => {
  const dir = project({ 'a.spp': fine, 'features/b.spp': fine, 'other/package.json': '{}', 'other/c.spp': fine })
  assert.equal(projectRoot(path.join(dir, 'features'), dir), dir)
  assert.deepEqual(
    projectFiles(dir).map((f) => path.relative(dir, f)),
    ['a.spp', 'features/b.spp'],
  )
  assert.deepEqual(
    projectFiles(path.join(dir, 'other')).map((f) => path.relative(dir, f)),
    ['other/c.spp'],
  )
})

test('each project has its own words, so two can Define the same one', () => {
  const add = (field: string) => `Define: Add Text (Item)\n  Fill the Field "${field}" with Item\n`
  const uses = 'Feature: F\n  Scenario: S\n    When I Add "Milk"\n'
  const dir = project({
    'words.spp': add('Item'),
    'a.spp': uses,
    'other/package.json': '{}',
    'other/words.spp': add('Name'),
    'other/a.spp': uses,
  })
  const run = check(dir)
  assert.equal(run.stdout.trim(), 'No mistakes in 4 files')
  assert.equal(run.status, 0)
})

test("check checks what's under the paths it's given, with the rest of their projects' Defines", () => {
  const dir = project({
    'words.spp': 'Define: Add Text (Item)\n  Fill the Field "Item" with Item\n',
    'features/a.spp': 'Feature: F\n  Scenario: S\n    When I Add "Milk"\n',
    'drafts/b.spp': broken,
  })
  const run = check(dir, 'features')
  assert.equal(run.stdout.trim(), 'No mistakes in 1 file')
  assert.equal(run.status, 0)
})

test('without a package.json, the project is where check is run', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spp-loose-')))
  fs.writeFileSync(path.join(dir, 'a.spp'), broken)
  const run = check(dir)
  assert.match(run.stdout, /Unknown word Clik/)
  assert.equal(run.status, 1)
})

test('ignored files and directories are left out', () => {
  const dir = project({ 'a.spp': fine, 'drafts/b.spp': fine, 'c.spp': fine })
  const found = discover([dir], dir, [path.join(dir, 'drafts'), path.join(dir, 'c.spp')])
  assert.deepEqual(found, [path.join(dir, 'a.spp')])
})

test("check checks templates with a template's words, and the project's Defines", () => {
  const dir = project({
    'words.spp': 'Define: Retitle Text (New)\n  Fill the Field "Title" with New\n',
    'visiting.spp': 'Feature: F\n  Scenario: S\n    Given I Visit "/"\n',
    'editor.stories.ts': [
      "import { spp } from '@spp-lang/storybook'",
      '',
      'export const Retitling = {',
      '  play: spp`',
      '    When I Retitle the post "Hello"',
      '    Then I should See the Status "Saved"',
      '  `,',
      '}',
      '',
      'export const Visiting = { play: spp`Given I Visit "/"` }',
      'export const Plain = "spp`When I Clik`"',
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
      '    export const Visiting = { play: spp`Given I Visit "/"` }',
      '                                                ^',
      '  A template plays on one page, already open, so it has no Visit',
      '',
      '2 mistakes in 3 files',
    ].join('\n'),
  )
  assert.equal(run.status, 1)
})
