// @gpp-lang/core: the language, its words and its checker, and the driver a
// backend, like @gpp-lang/playwright or @gpp-lang/storybook, implements to run
// them. It runs anywhere, a browser too; @gpp-lang/core/node has what needs Node.

export type { CheckOptions, Diagnostic, Line, Place, Report, WordInfo } from './language/check.ts'
export { Analysis, analyze, check, format } from './language/check.ts'
export type { Node, Program, Statement, Token } from './language/cognate.ts'
export { Block, call, core, Env, GppError, lex, parse, run, Stack, Sym } from './language/cognate.ts'
export type { Feature, GppFile, Scenario, Step, Vocabulary } from './language/load.ts'
export { LoadError, lineCol, loadSource } from './language/load.ts'
export type { Fence } from './language/markdown.ts'
export { fences, gppFences, gppLines, isMarkdown } from './language/markdown.ts'
export type { CodeLine, Problem, Sections } from './language/sections.ts'
export { codeLines, INTERPOLATION, isFeatureTemplate, sections, split } from './language/sections.ts'
export type { Runner } from './language/steps.ts'
export { keywords, runSteps } from './language/steps.ts'
export type { Template } from './language/templates.ts'
export { isScript, templates } from './language/templates.ts'
export type { Context, Doc, Form, Group, Type } from './language/types.ts'
export {
  AnyType,
  article,
  Component,
  ComponentType,
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
export type { Checked } from './project.ts'
export { checkFiles } from './project.ts'
export type { DomBackend, TestingLibrary } from './words/dom.ts'
export { domDriver, Target } from './words/dom.ts'
export type { Action, AnyDriver, Driver, Name, PageState, Query, QueryKind, State } from './words/driver.ts'
export {
  ARIA_ROLES,
  CheckType,
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
  ScopeType,
  say,
  settle,
  UNNAMED_ROLES,
  words,
} from './words/shared.ts'
