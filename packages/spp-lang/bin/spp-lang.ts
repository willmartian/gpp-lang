#!/usr/bin/env node

// spp-lang check [paths...]
// spp-lang dictionary
// spp-lang lsp
//
// Checks the scenarios without running them, lists the words they can use, or
// answers an editor. The project is the nearest spp.config above the current
// directory: its backends say which files are its, and each file is checked
// with the words of the backend that runs it. Running them is each backend's
// tool's job, like Playwright's.

import fs from 'node:fs'
import path from 'node:path'
import { styleText } from 'node:util'
import type { Backend, Diagnostic, SppConfig, SppFile } from '@spp-lang/core'
import { format, LoadError } from '@spp-lang/core'
import { checkProject, findConfig, load, loadConfig, projectFiles } from '@spp-lang/core/node'
import { Command, Option } from 'commander'
import { dictionary } from '../src/tools/dictionary.ts'

// Commander leaves the colour out when the output isn't a terminal, or $NO_COLOR is set.
const style = (format: Parameters<typeof styleText>[0], text: string) =>
  styleText(format, text, { validateStream: false })

// From the source, package.json is one directory up; once built, two.
const packageJson = ['../package.json', '../../package.json']
  .map((p) => path.join(import.meta.dirname, p))
  .find((p) => fs.existsSync(p))
if (!packageJson) throw new Error(`No package.json above ${import.meta.dirname}`)
const { version } = JSON.parse(fs.readFileSync(packageJson, 'utf8'))

const program = new Command('spp-lang')
  .usage('<command> [options]')
  .version(version, '-V, --version', 'Show the version')
  .helpOption('-h, --help', 'Show help')
  .helpCommand('help [command]', 'Show help for a command')
  // Set before the subcommands, which inherit it.
  .configureHelp({
    styleTitle: (s) => style('bold', s),
    styleCommandText: (s) => style('cyan', s),
    styleSubcommandText: (s) => style('cyan', s),
    styleOptionText: (s) => style('cyan', s),
  })
  .addHelpText('beforeAll', `${style(['green', 'bold'], 'Spec++')} ${style('dim', version)}\n`)
  .addHelpText('before', 'Specs that run. Written by agents, read by people.\n')
  .addHelpText(
    'after',
    `
${style('bold', 'Examples:')}
  ${style('dim', '$')} spp-lang check
  ${style('dim', '$')} spp-lang check features/cart.spp

The project is the nearest spp.config.ts above the current directory. Its
backends say which files are the project's, and every Define in a project can
be used by all of its files.`,
  )

program
  .command('check')
  .description('Check the files without running them')
  .argument('[paths...]')
  .addHelpText(
    'after',
    `
Checks every file under each path, or the whole project, and exits non-zero if
it finds a mistake. The rest of the project is still loaded, for its Defines.
Each file is checked with the words of the backend that runs it.`,
  )
  .action(async (paths: string[]) => process.exit(await checkOnly(paths)))

program
  .command('dictionary')
  .description('List every word the project can use')
  .addHelpText(
    'after',
    `
Lists the built-in words and the project's own Defines, with what each takes
and leaves: for each backend, when there's more than one.`,
  )
  .action(async () => process.exit(await printDictionary()))

program
  .command('lsp')
  .description('Language server for editors')
  .addHelpText(
    'after',
    `
A language server over stdio: mistakes as you type, signatures on hover,
completion and go to definition.`,
  )
  // What editors' language clients pass. Stdio is the only way it talks, and
  // the server reads the client's process id itself, to exit when it does.
  .addOption(new Option('--stdio').hideHelp())
  .addOption(new Option('--clientProcessId <pid>').hideHelp())
  .action(async () => {
    // Loaded only here, so running tests doesn't pay for it.
    const { startServer } = await import('../src/tools/lsp.ts')
    startServer()
  })

await program.parseAsync()

// Whether a file is one of those the paths name; with none, every file is.
function named(paths: string[], cwd: string) {
  const targets = paths.map((p) => path.resolve(cwd, p.replace(/:\d+$/, '')))
  return (file: string) => !targets.length || targets.some((t) => file === t || file.startsWith(t + path.sep))
}

// The project above the current directory, or, without one, null, having said so.
async function project(): Promise<SppConfig | null> {
  const file = findConfig(process.cwd())
  if (file) return loadConfig(file)
  console.error(`No spp.config.ts here or above. Make one that says which backends run your scenarios:

  // spp.config.ts
  import { defineConfig } from 'spp-lang'
  import playwright from '@spp-lang/playwright'

  export default defineConfig({ backends: [playwright({ files: ['features'] })] })`)
  return null
}

// A project's files, the backend that runs each, and why those that don't
// load don't.
function loadAll(config: SppConfig) {
  const files: SppFile[] = []
  const broken: LoadError[] = []
  const runners = new Map<string, Backend | null>()
  for (const { file, runner } of projectFiles(config)) {
    runners.set(file, runner)
    try {
      files.push(load(file))
    } catch (err) {
      if (!(err instanceof LoadError)) throw err
      broken.push(err)
    }
  }
  return { files, broken, runnerOf: (file: string) => runners.get(file) ?? null }
}

async function checkOnly(paths: string[]): Promise<number> {
  const config = await project()
  if (!config) return 1
  const cwd = process.cwd()
  const relative = (file: string) => path.relative(cwd, file)
  const shown = named(paths, cwd)
  const { files, broken, runnerOf } = loadAll(config)
  let problems = 0
  for (const err of broken.filter((e) => shown(e.file))) {
    // A file that doesn't parse: its message already says where.
    console.log(`${relative(err.file)}\n  ${err.message}\n`)
    problems++
  }
  // The whole project is checked, since the named files may use Defines from
  // the rest of it. An Outline's rows share their steps, and so their mistakes.
  const seen = new Set<string>()
  const diagnostics = checkProject(config, files, runnerOf, relative).diagnostics.filter((d: Diagnostic) => {
    const key = `${d.file}:${d.line}:${d.column}:${d.message}`
    return shown(d.file) && !seen.has(key) && seen.add(key)
  })
  for (const d of diagnostics) console.log(`${format(d, fs.readFileSync(d.file, 'utf8'), relative)}\n`)
  problems += diagnostics.length

  const count = [...files, ...broken].filter((f) => shown(f.file)).length
  const counted = `${count} file${count === 1 ? '' : 's'}`
  console.log(problems ? `${problems} mistake${problems === 1 ? '' : 's'} in ${counted}` : `No mistakes in ${counted}`)
  return problems ? 1 : 0
}

async function printDictionary(): Promise<number> {
  const config = await project()
  if (!config) return 1
  const cwd = process.cwd()
  // A file that doesn't parse has no Defines to list; check says why.
  const { files, runnerOf } = loadAll(config)
  const { analyses } = checkProject(config, files, runnerOf, (file) => path.relative(cwd, file))
  for (const [i, backend] of config.backends.entries()) {
    // With more than one backend, each has words of its own.
    if (config.backends.length > 1) console.log(`${i ? '\n' : ''}${style('bold', backend.name)}\n`)
    const analysis = analyses.get(backend)
    if (analysis) console.log(dictionary(backend.words(), analysis, cwd))
  }
  return 0
}
