// spp-lang/node: what needs Node, for the tools and the backends that run
// there: finding files, projects and backends, and the dictionary.

export type { Backends, Checked } from './backends.ts'
export { checkProject, findBackends } from './backends.ts'
export type { Project } from './config.ts'
export { contains, everything, findConfig, loadProjects, registry } from './config.ts'
export { discover, load, selects } from './language/files.ts'
export type { Entry } from './tools/dictionary.ts'
export { dictionary, entries, shape, takes } from './tools/dictionary.ts'
