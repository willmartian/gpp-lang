// Which files are a project: those under the nearest package.json, as tools
// usually draw the line, so a workspace's packages each have their own
// Defines.

import fs from 'node:fs'
import path from 'node:path'
import { discover } from './files.ts'

// The directory of the nearest package.json at or above a file or directory,
// or, when there's none, otherwise: where the tool was asked to look.
export function projectRoot(from: string, otherwise: string): string {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir
    if (dir === path.dirname(dir)) return path.resolve(otherwise)
  }
}

// Every Spec++ file of the project at root: .spp files, Markdown with ```spp
// blocks, and scripts with spp templates, but not those of a package inside it.
export function projectFiles(root: string): string[] {
  return discover([root], root, [], true).filter((file) => projectRoot(path.dirname(file), root) === root)
}
