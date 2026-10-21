/*
 * A project's config, gpp.config.ts: the backends it runs, and which of its
 * files each one runs. Every tool reads it, so each file is checked with the
 * words of the backend that runs it, and no backend's words are another's.
 *
 *     // gpp.config.ts
 *     import { defineConfig } from 'gpp-lang'
 *     import { playwright } from '@gpp-lang/playwright/config'
 *
 *     export default defineConfig({ backends: [playwright({ files: ['features/**\/*.gpp'] })] })
 *
 * Loading it is node/config.ts's job; this works on one already loaded, so it
 * runs in a browser too.
 */

import type { Env } from './language/cognate.ts'
import type { Templates } from './language/sections.ts'
import type { Type } from './language/types.ts'

/**
 * A backend, as its config entry makes it, like @gpp-lang/playwright/config's
 * playwright(). It's only what the tools need to know: running its files is
 * the backend's own job.
 */
export interface Backend {
  /** for messages, like "Playwright" */
  name: string
  /**
   * the files it runs, as globs from the config's directory, like
   * "features/**\/*.gpp". A file is the first backend's whose globs match it.
   */
  files: readonly string[]
  /** its words: the shared words, and any of its own, in an Env under them */
  words: Env
  /** for a backend that runs scripts' gpp templates, what they are */
  templates?: Templates
  /** what a template's ${…} is, for a backend with words that take one */
  interpolation?: Type<unknown>
}

export interface Config {
  backends: readonly Backend[]
  /** the config's directory, which its globs, and the project, start from */
  root: string
}

/** The backend that runs a file: the first whose globs match it, from the root. */
export function backendOf(config: Config, file: string): Backend | null {
  const root = slashes(config.root).replace(/\/$/, '')
  const path = slashes(file)
  if (!path.startsWith(`${root}/`)) return null
  const relative = path.slice(root.length + 1)
  return config.backends.find((b) => b.files.some((glob) => globToRegExp(glob).test(relative))) ?? null
}

const slashes = (path: string) => path.replaceAll('\\', '/')

/**
 * A glob as a regular expression for a path: ** is any number of directories,
 * * and ? any characters but /, and {a,b} either.
 */
export function globToRegExp(glob: string): RegExp {
  let out = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (glob.startsWith('**/', i)) {
      out += '(?:.*/)?'
      i += 2
    } else if (glob.startsWith('**', i)) {
      out += '.*'
      i += 1
    } else if (c === '*') out += '[^/]*'
    else if (c === '?') out += '[^/]'
    else if (c === '{') out += '(?:'
    else if (c === '}') out += ')'
    else if (c === ',' && glob.lastIndexOf('{', i) > glob.lastIndexOf('}', i)) out += '|'
    else out += c.replace(/[.+^$()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${out}$`)
}
