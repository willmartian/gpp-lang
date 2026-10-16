import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import type { SppConfig } from '@spp-lang/core'
import { discover, loadConfig, projectFiles } from '@spp-lang/core/node'

const packages = path.join(import.meta.dirname, '..', 'packages')
const bin = path.join(packages, 'spp-lang', 'bin', 'spp-lang.ts')

// Installs Spec++'s backends in a scratch project, as links to this repo's, so
// its config imports them and the tools find them as they would in any project.
function install(dir: string) {
  const scope = path.join(dir, 'node_modules', '@spp-lang')
  fs.mkdirSync(scope, { recursive: true })
  for (const name of ['playwright', 'storybook']) fs.symlinkSync(path.join(packages, name), path.join(scope, name))
  fs.symlinkSync(path.join(packages, 'spp-lang'), path.join(dir, 'node_modules', 'spp-lang'))
}

// A project of files, given as path → contents.
function project(files: Record<string, string>): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spp-config-')))
  install(dir)
  for (const [name, src] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), src)
  }
  return dir
}

const config = (...backends: string[]) =>
  [
    "import playwright from '@spp-lang/playwright'",
    "import storybook from '@spp-lang/storybook'",
    "import { defineConfig } from 'spp-lang'",
    `export default defineConfig({ backends: [${backends.join(', ')}] })`,
  ].join('\n')

const broken = 'Feature: F\n  Scenario: S\n    When I Clik the Button "Add"\n'
const fine = 'Feature: F\n  Scenario: S\n    When I Click the Button "Add"\n'

const check = (cwd: string) => spawnSync(process.execPath, [bin, 'check'], { cwd, encoding: 'utf8' })

test('without a config, check says how to make one', () => {
  const run = check(project({ 'a.spp': fine }))
  assert.match(run.stderr, /^No spp\.config\.ts here or above/)
  assert.equal(run.status, 1)
})

test('check finds the config from below, and its backends say which files are the project', () => {
  const dir = project({
    'spp.config.mjs': config("playwright({ files: ['features'], ignore: ['features/drafts'] })"),
    'features/a.spp': fine,
    'features/drafts/b.spp': broken,
    'other/c.spp': broken,
    'features/sub/.keep': '',
  })
  const run = check(path.join(dir, 'features', 'sub'))
  assert.equal(run.stdout.trim(), 'No mistakes in 1 file')
  assert.equal(run.status, 0)
})

test("a file is the nearest config's, so each project has its own words", async () => {
  const add = (field: string) => `Define: Add Text (Item)\n  Fill the Field "${field}" with Item\n`
  const uses = 'Feature: F\n  Scenario: S\n    When I Add "Milk"\n'
  const dir = project({
    'spp.config.mjs': config('playwright()'),
    'words.spp': add('Item'),
    'a.spp': uses,
    'other/spp.config.mjs': config('playwright()'),
    'other/words.spp': add('Name'),
    'other/a.spp': uses,
  })
  const files = (config: SppConfig) => projectFiles(config).map((f) => path.relative(dir, f.file))
  assert.deepEqual(files(await loadConfig(path.join(dir, 'spp.config.mjs'))), ['a.spp', 'words.spp'])
  assert.deepEqual(files(await loadConfig(path.join(dir, 'other', 'spp.config.mjs'))), [
    'other/a.spp',
    'other/words.spp',
  ])
  assert.equal(check(dir).stdout.trim(), 'No mistakes in 2 files')
  assert.equal(check(path.join(dir, 'other')).stdout.trim(), 'No mistakes in 2 files')
})

test('ignored files and directories are left out', () => {
  const dir = project({ 'a.spp': fine, 'drafts/b.spp': fine, 'c.spp': fine })
  const found = discover([dir], dir, [path.join(dir, 'drafts'), path.join(dir, 'c.spp')])
  assert.deepEqual(found, [path.join(dir, 'a.spp')])
})

test('a config without backends says so', async () => {
  const dir = project({ 'spp.config.mjs': config() })
  await assert.rejects(loadConfig(path.join(dir, 'spp.config.mjs')), /give it the backends that run your scenarios/)
})

test('a file no backend runs says what to add', () => {
  const dir = project({ 'spp.config.mjs': config('storybook()'), 'a.spp': fine })
  const run = check(dir)
  assert.match(
    run.stdout,
    /Scenarios in \.spp files and Markdown need a backend that runs them, like @spp-lang\/playwright/,
  )
  assert.equal(run.status, 1)
})

test("check checks Storybook's spp templates with its words and the project's Defines", () => {
  const dir = project({
    'spp.config.mjs': config('playwright()', 'storybook()'),
    'words.spp': 'Define: Retitle Text (New)\n  Fill the Field "Title" with New\n',
    'visiting.spp': 'Feature: F\n  Scenario: S\n    Given I Visit "/"\n',
    'editor.stories.ts': [
      "import { spp } from '@spp-lang/storybook/play'",
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
      '  A story is one page, already open, so a play function has no Visit',
      '',
      '2 mistakes in 3 files',
    ].join('\n'),
  )
  assert.equal(run.status, 1)
})
