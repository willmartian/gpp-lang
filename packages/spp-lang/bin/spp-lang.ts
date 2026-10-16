#!/usr/bin/env node

// spp-lang test [paths...] [--base-url <url>] [playwright test options...]
// spp-lang check [paths...]
// spp-lang dictionary
// spp-lang lsp
//
// Runs the scenarios with Playwright, or just checks them, without a browser,
// or lists the words they can use. The project's Playwright config says where
// the .spp files are; without one, every .spp file, and every Markdown file's
// ```spp blocks, under the current directory. Everything else, like --headed,
// --ui or --grep, goes to Playwright.

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { styleText } from 'node:util'
import { Command, Option } from 'commander'
import { checkProject, findBackends } from '../src/backends.ts'
import type { Project } from '../src/config.ts'
import { loadProjects } from '../src/config.ts'
import type { Diagnostic } from '../src/language/check.ts'
import { analyze, format } from '../src/language/check.ts'
import { core } from '../src/language/cognate.ts'
import { discover, load } from '../src/language/files.ts'
import type { SppFile } from '../src/language/load.ts'
import { LoadError } from '../src/language/load.ts'
import { dictionary } from '../src/tools/dictionary.ts'
import { leftovers } from '../src/words/shared.ts'

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
  ${style('dim', '$')} spp-lang test features --base-url http://localhost:3000
  ${style('dim', '$')} spp-lang test features/cart.spp:12 --headed
  ${style('dim', '$')} spp-lang check

The project is what the defineSppConfig calls in the Playwright config above
the current directory say, or, without one, every .spp file, and Markdown file
with a \`\`\`spp block, under it. Every Define in a project can be used by all
of its files.`,
  )

program
  .command('test')
  .usage('[paths...] [--base-url <url>] [playwright test options...]')
  .description('Run the scenarios as Playwright tests')
  .argument('[paths...]')
  .addOption(new Option('-u, --base-url <url>', 'Where "Visit "/"" goes').env('SPP_BASE_URL'))
  .allowUnknownOption()
  .addHelpText(
    'after',
    `
Runs "playwright test" with the project's Playwright config, or, without one,
on every .spp file under the current directory. A path can be a directory, a
file, or a file and a line, like features/cart.spp:12, for the scenario on that
line, or the one a step on that line is in. The \`\`\`spp blocks in Markdown
files are scenarios too, so README.md:40 works the same.

Everything else, like --headed, --ui, --grep or --project, is passed to
"playwright test" as it is.`,
  )
  .action(async (args: string[], options: { baseUrl?: string }) => process.exit(await runTests(args, options.baseUrl)))

program
  .command('check')
  .description('Check the files without a browser')
  .argument('[paths...]')
  .addHelpText(
    'after',
    `
Checks every file under each path, or the whole project, and exits non-zero if
it finds a mistake. The rest of the project is still loaded, for its Defines.

The spp\`…\` templates in .js and .ts files are checked too, as Storybook play
functions, with the project's Defines.`,
  )
  .action(async (paths: string[]) => process.exit(await checkOnly(await loadProjects(), paths)))

program
  .command('dictionary')
  .description('List every word the project can use')
  .addHelpText(
    'after',
    `
Lists the built-in words and the project's own Defines, with what each takes
and leaves.`,
  )
  .action(async () => process.exit(await printDictionary(await loadProjects())))

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

// A project's files, and why those that don't load don't.
// With scripts, its stories' spp templates too.
function loadAll(project: Project, scripts = false): { files: SppFile[]; broken: LoadError[] } {
  const files: SppFile[] = []
  const broken: LoadError[] = []
  for (const file of discover(project.features, project.root, project.ignore, scripts)) {
    try {
      files.push(load(file))
    } catch (err) {
      if (!(err instanceof LoadError)) throw err
      broken.push(err)
    }
  }
  return { files, broken }
}

async function checkOnly(projects: Project[], paths: string[]): Promise<number> {
  const cwd = process.cwd()
  const relative = (file: string) => path.relative(cwd, file)
  const shown = named(paths, cwd)
  // Each project is checked whole, since the named files may use Defines from
  // the rest of it. A file in more than one is reported once.
  const seen = new Set<string>()
  const checked = new Set<string>()
  let problems = 0
  for (const project of projects) {
    const { files, broken } = loadAll(project, true)
    for (const err of broken) {
      if (!shown(err.file) || seen.has(err.file)) continue
      seen.add(err.file)
      checked.add(err.file)
      // A file that doesn't parse: its message already says where.
      console.log(`${relative(err.file)}\n  ${err.message}\n`)
      problems++
    }
    // Each file with the words of the backend that runs it.
    const { diagnostics: found } = checkProject(files, await findBackends(project.root), relative)
    // An Outline's rows share their steps, and so their mistakes.
    const diagnostics = found.filter((d: Diagnostic) => {
      const key = `${d.file}:${d.line}:${d.column}:${d.message}`
      return shown(d.file) && !seen.has(key) && seen.add(key)
    })
    for (const d of diagnostics) console.log(`${format(d, fs.readFileSync(d.file, 'utf8'), relative)}\n`)
    problems += diagnostics.length
    for (const f of files) if (shown(f.file)) checked.add(f.file)
  }

  const count = checked.size
  const files = `${count} file${count === 1 ? '' : 's'}`
  console.log(problems ? `${problems} mistake${problems === 1 ? '' : 's'} in ${files}` : `No mistakes in ${files}`)
  return problems ? 1 : 0
}

async function printDictionary(projects: Project[]): Promise<number> {
  const cwd = process.cwd()
  for (const [i, project] of projects.entries()) {
    // The words of the backend that runs .spp files, or else templates.
    const backends = await findBackends(project.root)
    const words = backends.pages ?? backends.templates ?? core()
    // With more than one project, each has words of its own.
    if (projects.length > 1) {
      const where = project.features.map((f) => path.relative(cwd, f) || '.').join(', ')
      console.log(`${i ? '\n' : ''}${style('bold', `Project: ${where}`)}\n`)
    }
    // A file that doesn't parse has no Defines to list; check says why.
    const { files } = loadAll(project)
    console.log(
      dictionary(words, analyze(files, { words, settle: leftovers, name: (file) => path.relative(cwd, file) }), cwd),
    )
  }
  return 0
}

// Runs the scenarios with @spp-lang/playwright, from where the project has it.
async function runTests(args: string[], baseURL: string | undefined): Promise<number> {
  const require = createRequire(path.join(process.cwd(), 'package.json'))
  let file: string
  try {
    file = require.resolve('@spp-lang/playwright/cli')
  } catch {
    console.error(
      'spp-lang test runs scenarios with @spp-lang/playwright. Install it: npm install --save-dev @spp-lang/playwright',
    )
    return 1
  }
  const cli: unknown = await import(pathToFileURL(file).href)
  if (typeof cli !== 'object' || cli === null || !('runTests' in cli) || typeof cli.runTests !== 'function')
    throw new Error("@spp-lang/playwright isn't for this spp-lang: install versions that go together")
  return cli.runTests(args, baseURL)
}
