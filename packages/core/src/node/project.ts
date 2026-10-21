/*
 * Which files are a project: those under its gpp.config.ts, but not those of
 * a project inside it, with a config of its own.
 */

import path from 'node:path'
import { findConfig } from './config.ts'
import { discover } from './files.ts'

/**
 * Every Gherkin++ file of the project at root: .gpp files, Markdown with ```gpp
 * blocks, and scripts with gpp templates.
 */
export function projectFiles(root: string): string[] {
  return discover([root], root, [], true).filter((file) => {
    const config = findConfig(path.dirname(file))
    return config !== null && path.dirname(config) === root
  })
}
