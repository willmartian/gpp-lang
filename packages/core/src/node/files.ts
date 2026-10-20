// Finding .gpp files on disk, loading them, and picking out scenarios as a
// command line names them. language/ works on sources already read, so it
// runs in a browser too, as Storybook's play functions do.

import fs from 'node:fs'
import path from 'node:path'
import type { GppFile, Scenario } from '../language/load.ts'
import { loadSource } from '../language/load.ts'
import { gppFences, isMarkdown } from '../language/markdown.ts'
import { isScript, templates } from '../language/templates.ts'

export const SKIP = new Set(['node_modules', 'test-results', 'playwright-report'])

// Every .gpp file under the paths, and every Markdown file with an ```gpp
// block, except under those in ignore (absolute). With scripts, every script
// with a gpp`…` template too, for the tools that check Storybook's.
export function discover(paths: string[], cwd = process.cwd(), ignore: string[] = [], scripts = false): string[] {
  const found: string[] = []
  const ignored = (p: string) => ignore.some((i) => p === i || p.startsWith(i + path.sep))
  const visit = (p: string) => {
    if (ignored(p)) return
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p).sort()) {
        if (!entry.startsWith('.') && !SKIP.has(entry)) visit(path.join(p, entry))
      }
    } else if (p.endsWith('.gpp') || (isMarkdown(p) && gppFences(fs.readFileSync(p, 'utf8')).length)) found.push(p)
    else if (scripts && isScript(p) && templates(fs.readFileSync(p, 'utf8')).length) found.push(p)
  }
  for (const p of paths) visit(path.resolve(cwd, p))
  return found
}

export function load(file: string): GppFile {
  return loadSource(file, fs.readFileSync(file, 'utf8'))
}

// Which scenarios to run, as a command line names them: a directory or file
// runs everything in it, "file.gpp:12" the scenario on line 12. An empty
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
