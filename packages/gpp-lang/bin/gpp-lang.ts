#!/usr/bin/env node

/*
 * gpp-lang check [paths...]
 * gpp-lang words
 * gpp-lang lsp
 *
 * Checks the scenarios without running them, lists the words they can use, or
 * answers an editor. A project is the files under a gpp.config.ts, which share
 * their Defines, and the config says which backend runs each, and so which
 * words it has. Running them is each backend's tool's job, like Playwright's.
 */

import fs from 'node:fs'
import path from 'node:path'
import { styleText } from 'node:util'
import type { Config, Diagnostic, GppFile } from '@gpp-lang/core'
import { checkFiles, format, LoadError } from '@gpp-lang/core'
import { findConfig, findConfigs, load, loadConfig, projectFiles } from '@gpp-lang/core/node'
import { Command, Option } from 'commander'
import { listWords } from '../src/tools/words.ts'

/** Commander leaves the colour out when the output isn't a terminal, or $NO_COLOR is set. */
const style = (format: Parameters<typeof styleText>[0], text: string) =>
  styleText(format, text, { validateStream: false })

/** From the source, package.json is one directory up; once built, two. */
const packageJson = ['../package.json', '../../package.json']
  .map((p) => path.join(import.meta.dirname, p))
  .find((p) => fs.existsSync(p))
if (!packageJson) throw new Error(`No package.json above ${import.meta.dirname}`)
const { version } = JSON.parse(fs.readFileSync(packageJson, 'utf8'))

const program = new Command('gpp-lang')
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
  .addHelpText('beforeAll', `${style(['green', 'bold'], 'Gherkin++')} ${style('dim', version)}\n`)
  .addHelpText('before', 'Specs that run. Written by agents, read by people.\n')
  .addHelpText(
    'after',
    `
${style('bold', 'Examples:')}
  ${style('dim', '$')} gpp-lang check
  ${style('dim', '$')} gpp-lang check features/cart.gpp

A project is the .gpp files, Markdown with \`\`\`gpp blocks and gpp templates under
a gpp.config.ts, which says which backend runs each. Every Define in a project
can be used by all of its files.`,
  )

program
  .command('check')
  .description('Check the files without running them')
  .argument('[paths...]')
  .addHelpText(
    'after',
    `
Checks every file under each path, or under the current directory, and exits
non-zero if it finds a mistake. The rest of each file's project is still
loaded, for its Defines.`,
  )
  .action(async (paths: string[]) => process.exit(await checkOnly(paths)))

program
  .command('words')
  .description('List every word the project can use')
  .addHelpText(
    'after',
    `
Lists the shared words, each backend's own in the project's gpp.config.ts, and
the project's Defines, with what each takes and leaves.`,
  )
  .action(async () => process.exit(await printWords()))

program
  .command('lsp')
  .description('Language server for editors')
  .addHelpText(
    'after',
    `
A language server over stdio: mistakes as you type, signatures on hover,
completion and go to definition.`,
  )
  /*
   * What editors' language clients pass. Stdio is the only way it talks, and
   * the server reads the client's process id itself, to exit when it does.
   */
  .addOption(new Option('--stdio').hideHelp())
  .addOption(new Option('--clientProcessId <pid>').hideHelp())
  .action(async () => {
    /** Loaded only here, so running tests doesn't pay for it. */
    const { startServer } = await import('../src/tools/lsp.ts')
    startServer()
  })

await program.parseAsync()

/** Whether a file is one of those the paths name; with none, every file is. */
function named(paths: string[], cwd: string) {
  const targets = paths.map((p) => path.resolve(cwd, p.replace(/:\d+$/, '')))
  return (file: string) => !targets.length || targets.some((t) => file === t || file.startsWith(t + path.sep))
}

/** A project's files, and why those that don't load don't. */
function loadProject(root: string): { files: GppFile[]; broken: LoadError[] } {
  const files: GppFile[] = []
  const broken: LoadError[] = []
  for (const file of projectFiles(root)) {
    try {
      files.push(load(file))
    } catch (err) {
      if (!(err instanceof LoadError)) throw err
      broken.push(err)
    }
  }
  return { files, broken }
}

async function checkOnly(paths: string[]): Promise<number> {
  const cwd = process.cwd()
  const relative = (file: string) => path.relative(cwd, file)
  const shown = named(paths, cwd)
  /**
   * Each project with a named file, checked whole, since the named files may
   * use Defines from the rest of it.
   */
  const configs = findConfigs(paths.length ? paths : [cwd], cwd)
  if (!configs.length) {
    console.log(`No gpp.config.ts at or under ${paths.length ? paths.join(', ') : 'this directory'}`)
    return 1
  }
  let problems = 0
  let count = 0
  for (const file of configs) {
    const config = await loadConfig(file)
    const { files, broken } = loadProject(config.root)
    for (const err of broken.filter((e) => shown(e.file))) {
      // A file that doesn't parse: its message already says where.
      console.log(`${relative(err.file)}\n  ${err.message}\n`)
      problems++
    }
    /** An Outline's rows share their steps, and so their mistakes. */
    const seen = new Set<string>()
    const diagnostics = checkFiles(files, config, relative).diagnostics.filter((d: Diagnostic) => {
      const key = `${d.file}:${d.line}:${d.column}:${d.message}`
      return shown(d.file) && !seen.has(key) && seen.add(key)
    })
    for (const d of diagnostics) console.log(`${format(d, fs.readFileSync(d.file, 'utf8'), relative)}\n`)
    problems += diagnostics.length
    count += [...files, ...broken].filter((f) => shown(f.file)).length
  }
  const counted = `${count} file${count === 1 ? '' : 's'}`
  console.log(problems ? `${problems} mistake${problems === 1 ? '' : 's'} in ${counted}` : `No mistakes in ${counted}`)
  return problems ? 1 : 0
}

async function printWords(): Promise<number> {
  const cwd = process.cwd()
  const file = findConfig(cwd)
  const config: Config | null = file ? await loadConfig(file) : null
  /** A file that doesn't parse has no Defines to list; check says why. */
  const { files } = config ? loadProject(config.root) : { files: [] }
  const checked = checkFiles(files, config, (f) => path.relative(cwd, f))
  console.log(listWords(config, checked, cwd))
  return 0
}
