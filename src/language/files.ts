// Finding .spp files on disk, loading them, and picking out scenarios as a
// command line names them. Everything else in language/ works on sources
// already read, so it runs in a browser too, as Storybook's play functions do.

import fs from 'node:fs'
import path from 'node:path'
import type { Scenario, SppFile } from './load.ts'
import { loadSource } from './load.ts'
import { isMarkdown, sppFences } from './markdown.ts'

const SKIP = new Set(['node_modules', 'test-results', 'playwright-report'])

// Every .spp file under the paths, and every Markdown file with an ```spp
// block, except under those in ignore (absolute).
export function discover(paths: string[], cwd = process.cwd(), ignore: string[] = []): string[] {
  const found: string[] = []
  const ignored = (p: string) => ignore.some((i) => p === i || p.startsWith(i + path.sep))
  const visit = (p: string) => {
    if (ignored(p)) return
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p).sort()) {
        if (!entry.startsWith('.') && !SKIP.has(entry)) visit(path.join(p, entry))
      }
    } else if (p.endsWith('.spp') || (isMarkdown(p) && sppFences(fs.readFileSync(p, 'utf8')).length)) found.push(p)
  }
  for (const p of paths) visit(path.resolve(cwd, p))
  return found
}

export function load(file: string): SppFile {
  return loadSource(file, fs.readFileSync(file, 'utf8'))
}

// Which scenarios to run, as a command line names them: a directory or file
// runs everything in it, "file.spp:12" the scenario on line 12. An empty
// list runs everything.
export function selects(selections: string[], scenario: Scenario, cwd = process.cwd()): boolean {
  if (!selections.length) return true
  return selections.some((selection) => {
    const lineAt = /:(\d+)$/.exec(selection)
    const where = lineAt ? selection.slice(0, lineAt.index) : selection
    const line = lineAt?.[1]
    const target = path.resolve(cwd, where)
    if (line) return scenario.file === target && scenario.lines.includes(Number(line))
    return scenario.file === target || scenario.file.startsWith(target + path.sep)
  })
}
