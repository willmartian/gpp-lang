// What `spp-lang test` runs: Playwright, with the project's config, or this
// package's own, which runs every .spp file under where it was run.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { SppFile } from 'spp-lang'
import { findConfig, load } from 'spp-lang/node'

// Runs Playwright with the project's config, or Spec++'s own without one.
// Every argument goes to Playwright, but a .spp or Markdown file and a step's
// line becomes its scenario's line, which is what Playwright knows the test by.
export function runTests(args: string[], baseURL: string | undefined): number {
  const require = createRequire(import.meta.url)
  // .ts when run from source, .js once built
  const config =
    findConfig(process.cwd()) ??
    path.join(import.meta.dirname, `runner/playwright.config${path.extname(import.meta.filename)}`)

  const result = spawnSync(
    process.execPath,
    [require.resolve('@playwright/test/cli'), 'test', '--config', config, ...args.map(scenarioLine)],
    {
      stdio: 'inherit',
      env: { ...process.env, SPP_CWD: process.cwd(), ...(baseURL ? { SPP_BASE_URL: baseURL } : {}) },
    },
  )
  return result.status ?? 1
}

// "features/cart.spp:14", where line 14 is a step, as "features/cart.spp:12",
// the line of its scenario. Anything else is left as it is.
function scenarioLine(arg: string): string {
  const m = /^(.+\.(?:spp|md)):(\d+)$/.exec(arg)
  if (!m || !fs.existsSync(m[1])) return arg
  const [, file, line] = m
  let loaded: SppFile
  try {
    loaded = load(path.resolve(file))
  } catch {
    return arg
  }
  const n = Number(line)
  const scenario = loaded.features.flatMap((f) => f.scenarios).find((s) => s.lines.includes(n))
  if (!scenario) return arg
  // A step of an Outline is in every row, so it names the Outline, and all of them.
  const target = scenario.outline && n !== scenario.line ? scenario.outline.line : scenario.line
  return target === n ? arg : `${file}:${target}`
}
