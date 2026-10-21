// @gpp-lang/core/node: what needs Node, for the tools and for backends' parts
// that run there: finding a project's config and files, and reading them.

export { CONFIG_FILES, configIn, defineConfig, findConfig, findConfigs, loadConfig } from './node/config.ts'
export { discover, load, SKIP, selects } from './node/files.ts'
export { projectFiles } from './node/project.ts'
