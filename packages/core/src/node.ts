// @gpp-lang/core/node: what needs Node, for the tools and for backends' parts
// that run there: finding a project's files and reading them.

export { discover, load, SKIP, selects } from './node/files.ts'
export { projectFiles, projectRoot } from './node/project.ts'
