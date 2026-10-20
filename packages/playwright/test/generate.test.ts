// Generating Playwright tests from .gpp files, checked through Playwright
// itself: where it says each test is, and how the ones that fail without a
// browser fail.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const cli = createRequire(import.meta.url).resolve('@playwright/test/cli')
const packages = path.join(import.meta.dirname, '..', '..')

// Installs this package in a scratch project, as a link to this repo's, so its
// config imports it as any project's would.
function install(dir: string) {
  const scope = path.join(dir, 'node_modules', '@gpp-lang')
  fs.mkdirSync(scope, { recursive: true })
  fs.symlinkSync(path.join(packages, 'playwright'), path.join(scope, 'playwright'))
}

const cart = [
  'Define: Add Text (Item)', //                      1
  '  Fill the Field "Item" with Item', //            2
  '', //                                             3
  'Feature: Cart', //                                4
  '', //                                             5
  '  @smoke', //                                     6
  '  Scenario: Adding', //                           7
  '    When I Add "Milk"', //                        8
  '', //                                             9
  '  Scenario: A mistake', //                        10
  '    When I Click "Add"', //                       11
  '', //                                             12
  '  Scenario Outline: Rows', //                     13
  '    When I Add "<item>"', //                      14
  '', //                                             15
  '    Examples:', //                                16
  '      | item |', //                               17
  '      | Tea  |', //                               18
  '      | Jam  |', //                               19
  '',
].join('\n')

const brokenDefine = 'Define: Wipe\n  Clik the Button "Wipe"\n'
// A table whose rows don't line up isn't Gherkin.
const unreadable =
  'Feature: Broken\n  Scenario: S\n    Given I Fill in the form:\n      | Email |\n      | Email | a@b |\n'

function scratch(): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gpp-generate-')))
  install(dir)
  const files: Record<string, string> = {
    'playwright.config.mjs': [
      "import { defineGppConfig } from '@gpp-lang/playwright'",
      "export default { ...defineGppConfig({ features: ['features'] }) }",
    ].join('\n'),
    'features/cart.gpp': cart,
    'features/words.gpp': brokenDefine,
    'features/unreadable.gpp': unreadable,
  }
  for (const [name, src] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), src)
  }
  return dir
}

const playwright = (dir: string, args: string[], env: NodeJS.ProcessEnv = {}) =>
  spawnSync(process.execPath, [cli, 'test', ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env } })

interface Spec {
  title: string
  file: string
  line: number
  tags: string[]
  tests: {
    results: { status: string; errors: { message?: string; location?: { line: number; column: number } }[] }[]
  }[]
}
interface Suite {
  title: string
  specs?: Spec[]
  suites?: Suite[]
}

// Every test in a JSON report, by its titles below the file.
function specs(json: string): Map<string, Spec> {
  const report = JSON.parse(json) as { suites: Suite[] }
  const found = new Map<string, Spec>()
  const walk = (suite: Suite, titles: string[]) => {
    for (const spec of suite.specs ?? []) found.set([...titles, spec.title].join(' › '), spec)
    for (const child of suite.suites ?? []) walk(child, [...titles, child.title])
  }
  for (const file of report.suites) walk(file, [])
  return found
}

test('each scenario is a Playwright test, on its line in the .gpp file', () => {
  const dir = scratch()
  const run = playwright(dir, ['--list', '--reporter=json'])
  assert.equal(run.status, 0, run.stderr)
  const found = specs(run.stdout)
  const at = (title: string) => {
    const spec = found.get(title)
    return spec && `${spec.file}:${spec.line}`
  }
  assert.equal(at('Cart › Adding'), 'features/cart.gpp:7')
  assert.equal(found.get('Cart › Adding')?.tags.join(), 'smoke')
  assert.equal(at('Cart › A mistake'), 'features/cart.gpp:10')
  assert.equal(at('Cart › Rows › item: Tea'), 'features/cart.gpp:18')
  assert.equal(at('Cart › Rows › item: Jam'), 'features/cart.gpp:19')
  assert.equal(at('Define Wipe'), 'features/words.gpp:2')
  assert.equal(at('unreadable.gpp'), 'features/unreadable.gpp:5')
})

test('mistakes the checker finds fail where they are, without a browser', () => {
  const dir = scratch()
  // Browsers are looked for where there are none, so any test that started one would fail to.
  const nowhere = fs.mkdtempSync(path.join(os.tmpdir(), 'gpp-no-browsers-'))
  const run = playwright(dir, ['--reporter=json', '--grep-invert', 'Adding|Rows'], {
    PLAYWRIGHT_BROWSERS_PATH: nowhere,
  })
  const found = specs(run.stdout)
  const failure = (title: string) => {
    const [result] = found.get(title)?.tests[0]?.results ?? []
    const [error] = result?.errors ?? []
    return result && `${result.status} ${error?.location?.line}:${error?.location?.column} ${error?.message}`
  }
  assert.match(failure('Cart › A mistake') ?? '', /^failed 11:12 .*Click expected something on the page/)
  assert.match(failure('Define Wipe') ?? '', /^failed 2:3 .*Unknown word Clik/)
  assert.match(failure('unreadable.gpp') ?? '', /^failed 5:7 .*inconsistent cell count/)
})

test("generated files go when their .gpp file does, and nothing else's does", () => {
  const dir = scratch()
  assert.equal(playwright(dir, ['--list']).status, 0)
  const generated = path.join(dir, '.gpp-tests', 'features')
  assert.ok(fs.existsSync(path.join(generated, 'unreadable.gpp.spec.js')))
  fs.writeFileSync(path.join(generated, 'mine.spec.js'), "// someone else's\n")
  fs.rmSync(path.join(dir, 'features', 'unreadable.gpp'))
  assert.equal(playwright(dir, ['--list']).status, 0)
  assert.deepEqual(fs.readdirSync(generated).sort(), [
    'cart.gpp.spec.js',
    'cart.gpp.spec.js.map',
    'mine.spec.js',
    'words.gpp.spec.js',
    'words.gpp.spec.js.map',
  ])
})
