/*
 * Opens VS Code on a small workspace with this extension loaded, and runs
 * test/suite.cjs inside it. Without a display (CI, or to keep the window out
 * of the way), run it under xvfb-run -a.
 *
 * It uses the VS Code on PATH when it can find its Electron binary, which is
 * how NixOS lays it out, or $GPP_VSCODE; otherwise it downloads one.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { runTests } from '@vscode/test-electron'

const here = import.meta.dirname
const packages = path.join(here, '..', '..', '..', 'packages')

/**
 * A gpp.config.mjs that runs .gpp files and Markdown with Playwright and
 * stories with Storybook, from this repo's packages, wherever it is.
 */
const source = (file) => JSON.stringify(pathToFileURL(path.join(packages, file)).href)
const config = [
  `import { defineConfig } from ${source('core/src/node.ts')}`,
  `import { playwright } from ${source('playwright/src/config.ts')}`,
  `import { storybook } from ${source('storybook/src/config.ts')}`,
  'export default defineConfig({ backends: [playwright(), storybook()] })',
].join('\n')

function installedVSCode() {
  if (process.env.GPP_VSCODE) return process.env.GPP_VSCODE
  try {
    const launcher = fs.realpathSync(execFileSync('which', ['code'], { encoding: 'utf8' }).trim())
    const electron = path.join(path.dirname(launcher), '..', 'lib', 'vscode', 'code')
    return fs.existsSync(electron) ? electron : undefined
  } catch {
    return undefined
  }
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'gpp-vscode-'))
fs.writeFileSync(path.join(workspace, 'gpp.config.mjs'), config)
fs.writeFileSync(
  path.join(workspace, 'words.gpp'),
  ['Define: Add Text (Item)', '  Fill the Field "Item" with Item', '  Click the Button "Add"', ''].join('\n'),
)
fs.writeFileSync(
  path.join(workspace, 'a.gpp'),
  ['Feature: Groceries', '  Scenario: Adding', '    When I Add "Milk"', '    And I Click "Add"', ''].join('\n'),
)
// A Storybook play function with a mistake.
fs.writeFileSync(
  path.join(workspace, 'editor.stories.ts'),
  ['export const Saving = {', '  play: gpp`', '    When I Visit "/"', '  `,', '}', ''].join('\n'),
)
// Markdown, with two Features: one carried on across blocks, one with a mistake.
fs.writeFileSync(
  path.join(workspace, 'guide.md'),
  [
    '# A guide', //                                     1
    '', //                                              2
    '```gpp', //                                        3
    'Feature: Guide', //                                4
    '  Scenario: Passes', //                            5
    '    Given I Visit "data:text/html,<h1>Hi</h1>"', // 6
    '    Then I should See the Heading "Hi"', //        7
    '```', //                                           8
    '', //                                              9
    'Some prose.', //                                   10
    '', //                                              11
    '```gpp', //                                        12
    '  Scenario: Also passes', //                       13
    '    Given I Visit "data:text/html,<h1>Hi</h1>"', // 14
    '```', //                                           15
    '', //                                              16
    '```gpp', //                                        17
    'Feature: Another', //                              18
    '  Scenario: A mistake', //                         19
    '    When I Click "Add"', //                        20
    '```', //                                           21
    '',
  ].join('\n'),
)
// This repo's gpp-lang, from source, since there's no node_modules/gpp-lang here.
fs.mkdirSync(path.join(workspace, '.vscode'))
fs.writeFileSync(
  path.join(workspace, '.vscode', 'settings.json'),
  JSON.stringify({ 'gpp.path': path.join(packages, 'gpp-lang', 'bin', 'gpp-lang.ts') }),
)

try {
  await runTests({
    vscodeExecutablePath: installedVSCode(),
    extensionDevelopmentPath: path.join(here, '..'),
    extensionTestsPath: path.join(here, 'suite.cjs'),
    launchArgs: [
      workspace,
      '--disable-extensions',
      '--disable-workspace-trust',
      '--skip-welcome',
      '--skip-release-notes',
      `--user-data-dir=${path.join(workspace, '.vscode-user')}`,
    ],
  })
} catch (err) {
  console.error(err)
  process.exit(1)
}
