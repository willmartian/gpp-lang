// spp-lang: the language, its checker, and what a backend, like
// @spp-lang/playwright or @spp-lang/storybook, builds its words from. It runs
// anywhere, a browser too; spp-lang/node has what needs Node.

export type { CheckOptions, Diagnostic, Line, Place, Report, WordInfo } from './language/check.ts'
export { Analysis, analyze, check, format } from './language/check.ts'
export type { Node, Program, Statement, Token } from './language/cognate.ts'
export { Block, call, core, Env, lex, parse, run, SppError, Stack, Sym } from './language/cognate.ts'
export type { Feature, Scenario, SppFile, Step, Vocabulary } from './language/load.ts'
export { LoadError, lineCol, loadSource } from './language/load.ts'
export type { Fence } from './language/markdown.ts'
export { fences, isMarkdown, sppFences, sppLines } from './language/markdown.ts'
export type { CodeLine, Problem, Sections } from './language/sections.ts'
export { codeLines, INTERPOLATION, sections, split } from './language/sections.ts'
export type { Runner } from './language/steps.ts'
export { keywords, runSteps } from './language/steps.ts'
export type { Template } from './language/templates.ts'
export { isScript, templates } from './language/templates.ts'
export type { Context, Doc, Form, Group, Type } from './language/types.ts'
export {
  AnyType,
  article,
  called,
  formsFor,
  GROUPS,
  mistake,
  NumberType,
  oneOf,
  signature,
  TableType,
  TextType,
  type,
} from './language/types.ts'
export type { Action, Capabilities, Driver, Name, Query, QueryKind, State } from './words/driver.ts'
export {
  ARIA_ROLES,
  actions,
  CheckType,
  checks,
  ElementType,
  Expectation,
  escapeRegExp,
  Found,
  leftovers,
  Matcher,
  MatcherType,
  NameType,
  nameOf,
  Pattern,
  PatternType,
  queries,
  ScopeType,
  say,
  settler,
  UNNAMED_ROLES,
} from './words/shared.ts'
