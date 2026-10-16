// @spp-lang/core/node: what needs Node, for the tools and for backends' parts
// that run there: spp.config, a project's files, and checking them.

export { defineConfig, findConfig, findConfigs, isConfig, loadConfig } from './node/config.ts'
export { discover, load, SKIP, selects } from './node/files.ts'
export type { Checked, ProjectFile } from './node/project.ts'
export { checkProject, projectFiles } from './node/project.ts'
