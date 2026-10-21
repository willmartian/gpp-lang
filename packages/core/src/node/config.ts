/*
 * Finding a project's gpp.config.ts and loading it. The config is code, so
 * loading it runs it, and whatever it imports: a backend's config entry, like
 * `@gpp-lang/playwright/config`, has only its words, not what runs them.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Backend, Config } from '../config.ts'
import { SKIP } from './files.ts'

export const CONFIG_FILES = ['gpp.config.ts', 'gpp.config.mts', 'gpp.config.js', 'gpp.config.mjs']

/**
 * A project's config, for gpp.config.ts's default export. Its root is the
 * directory of the file that calls it, read from the stack, so a config
 * imported from elsewhere, like a Playwright config, still knows where it is.
 */
export function defineConfig(config: { backends: readonly Backend[] }): Config {
  return { backends: config.backends, root: callerDir() }
}

function callerDir(): string {
  const prepare = Error.prepareStackTrace
  let caller: string | null | undefined
  try {
    Error.prepareStackTrace = (_err, frames) => {
      caller = frames[0]?.getFileName()
      return ''
    }
    const holder: { stack?: string } = {}
    Error.captureStackTrace(holder, defineConfig)
    // Reading the stack is what runs prepareStackTrace.
    if (holder.stack === undefined) caller = undefined
  } finally {
    Error.prepareStackTrace = prepare
  }
  if (!caller) throw new Error("defineConfig couldn't tell which file called it")
  return path.dirname(caller.startsWith('file:') ? fileURLToPath(caller) : caller)
}

/** The config file in a directory, if there is one. */
export const configIn = (dir: string): string | null =>
  CONFIG_FILES.map((name) => path.join(dir, name)).find((file) => fs.existsSync(file)) ?? null

/** The nearest config at or above a file or directory. */
export function findConfig(from: string): string | null {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    const found = configIn(dir)
    if (found) return found
    if (dir === path.dirname(dir)) return null
  }
}

/** Loads a config, as it is on disk now: a changed one is loaded again. */
export async function loadConfig(file: string): Promise<Config> {
  const url = `${pathToFileURL(file).href}?t=${fs.statSync(file).mtimeMs}`
  const loaded: unknown = (await import(url)).default
  if (!isConfig(loaded)) {
    throw new Error(`${file} should export default defineConfig({ backends: [...] }), with backends like playwright()`)
  }
  return { backends: loaded.backends, root: path.dirname(file) }
}

const isConfig = (v: unknown): v is Config =>
  typeof v === 'object' && v !== null && 'backends' in v && Array.isArray(v.backends)

/**
 * Every config for these paths: the nearest at or above each, and every one
 * under it, leaving out node_modules and the like.
 */
export function findConfigs(paths: string[], cwd = process.cwd()): string[] {
  const found = new Set<string>()
  const visit = (dir: string) => {
    const here = configIn(dir)
    if (here) found.add(here)
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !SKIP.has(entry.name)) visit(path.join(dir, entry.name))
    }
  }
  for (const p of paths.map((p) => path.resolve(cwd, p))) {
    const above = findConfig(fs.existsSync(p) && fs.statSync(p).isDirectory() ? p : path.dirname(p))
    if (above) found.add(above)
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) visit(p)
  }
  return [...found].sort()
}
