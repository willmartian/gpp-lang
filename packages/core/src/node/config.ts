// spp.config.ts: a project's backends.
//
//     // spp.config.ts
//     import { defineConfig } from 'spp-lang'
//     import playwright from '@spp-lang/playwright'
//
//     export default defineConfig({ backends: [playwright({ files: ['features'] })] })
//
// The tools find it by looking up from where they're run, or from a file, as
// TypeScript finds a tsconfig.json, and the nearest one is the file's project.
// Each tool's own config imports it, so it's said once.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Backend, SppConfig } from '../backend.ts'
import { SKIP } from './files.ts'

const NAMES = ['ts', 'mts', 'js', 'mjs'].map((ext) => `spp.config.${ext}`)

export const isConfig = (file: string) => NAMES.includes(path.basename(file))

// A project's backends. Their paths are relative to the config: the file
// that calls defineConfig.
export function defineConfig(config: { backends: Backend[] }): SppConfig {
  if (!Array.isArray(config?.backends) || !config.backends.length)
    throw new Error('defineConfig: give it the backends that run your scenarios, as backends: [playwright()]')
  const file = callerFile()
  return { root: path.dirname(file), file, backends: config.backends }
}

// The spp.config file at or above a directory.
export function findConfig(from: string): string | undefined {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    const file = NAMES.map((name) => path.join(dir, name)).find((f) => fs.existsSync(f))
    if (file) return file
    if (dir === path.dirname(dir)) return undefined
  }
}

// What a config file exports. Loading it runs it.
export async function loadConfig(file: string): Promise<SppConfig> {
  // A new URL each time, so a config that's changed is read again.
  const loaded: unknown = await import(`${pathToFileURL(file).href}?spp=${Date.now()}`)
  const config = typeof loaded === 'object' && loaded !== null && 'default' in loaded ? loaded.default : undefined
  if (!isSppConfig(config)) throw new Error(`${file} should export defineConfig({ backends: [...] }) as its default`)
  return config
}

const isSppConfig = (v: unknown): v is SppConfig =>
  typeof v === 'object' && v !== null && 'root' in v && 'backends' in v && Array.isArray(v.backends)

// The file that called defineConfig: the config. Read from the stack, as
// Playwright reads where each test is declared.
function callerFile(): string {
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
  return caller.startsWith('file:') ? fileURLToPath(caller) : caller
}

// Every spp.config file under a directory, for an editor's workspace.
export function findConfigs(root: string): string[] {
  const found: string[] = []
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !SKIP.has(entry.name)) visit(path.join(dir, entry.name))
      else if (entry.isFile() && NAMES.includes(entry.name)) found.push(path.join(dir, entry.name))
    }
  }
  visit(path.resolve(root))
  return found.sort()
}
