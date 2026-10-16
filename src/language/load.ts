// Turning .spp files into vocabulary and scenarios.
//
// Reading them from disk is files.ts's job; this works on sources already
// read, so it runs in a browser too.
//
// A .spp file is Gherkin with an optional preamble: Defines above the
// Feature line. Either half may be missing, so a file of nothing but Defines
// is shared vocabulary. Every Define is visible to every scenario.
//
// A Markdown file's ```spp blocks are Spec++ too, so a README's examples
// can be tests (see markdown.ts, and sections.ts for how a file divides).
//
// Gherkin does the Gherkin: Backgrounds, Rules and Scenario Outlines are
// compiled into flat "pickles" by @cucumber/gherkin, so an Outline's <email>
// is already substituted by the time a step reaches the Cognate parser.

import { AstBuilder, compile, Errors, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin'
import type { Step as AstStep, FeatureChild, PickleStepArgument, RuleChild } from '@cucumber/messages'
import { IdGenerator } from '@cucumber/messages'
import type { Program } from './cognate.ts'
import { parse, SppError } from './cognate.ts'
import { sections } from './sections.ts'

export interface Step {
  keyword: string
  // Gherkin's name for it, in any language: Context, Action, Outcome,
  // Conjunction, or Unknown for *
  keywordType?: string
  text: string
  file: string
  line: number
  // where the step's text starts, after "Given "
  column: number
  argument?: string | string[][]
  program?: Program
  error?: unknown
}

export interface Scenario {
  name: string
  tags: string[]
  steps: Step[]
  file: string
  // Its line: the Scenario's, or, for a row of an Outline, the row's.
  line: number
  // Every line that picks it out: its own, its Scenario's, its steps'.
  lines: number[]
  // For a row of an Outline: the Outline, and the row's values.
  outline?: { name: string; line: number; row: string }
}

export interface Feature {
  name: string
  file: string
  line: number
  scenarios: Scenario[]
}

export interface Vocabulary {
  file: string
  // the file's Defines, with the Gherkin blanked out, so positions line up
  src: string
  program: Program
}

export interface SppFile {
  file: string
  // a .spp file's preamble; in Markdown, each block's Defines
  vocabulary: Vocabulary[]
  // a .spp file's Feature; in Markdown, any number
  features: Feature[]
}

// A file that can't be read as Spec++ at all, and where.
export class LoadError extends Error {
  file: string
  problems: { line: number; column: number; message: string }[]

  constructor(file: string, problems: LoadError['problems']) {
    super(problems.map((p) => `${p.message}\n    at ${file}:${p.line}:${p.column}`).join('\n'))
    this.name = 'LoadError'
    this.file = file
    this.problems = problems
  }
}

// Loads a file as it is right now, which in an editor may not be saved.
export function loadSource(file: string, src: string): SppFile {
  const { preambles, documents, problems } = sections(file, src)
  if (problems.length) throw new LoadError(file, problems)
  return {
    file,
    vocabulary: preambles.flatMap((p) => loadVocabulary(file, p) ?? []),
    features: documents.flatMap((d) => loadFeature(file, d) ?? []),
  }
}

function loadVocabulary(file: string, src: string): Vocabulary | null {
  try {
    const program = parse(src)
    return program.length ? { file, src, program } : null
  } catch (err) {
    if (!(err instanceof SppError)) throw err
    throw new LoadError(file, [{ ...lineCol(src, err.pos ?? 0), message: err.message }])
  }
}

export function lineCol(src: string, pos: number): { line: number; column: number } {
  const before = src.slice(0, pos).split('\n')
  return { line: before.length, column: before[before.length - 1].length + 1 }
}

function loadFeature(file: string, src: string): Feature | null {
  const newId = IdGenerator.uuid()
  const doc = parseGherkin(file, src, newId)
  if (!doc.feature) return null

  // Pickles point back at AST steps by id; the AST knows keyword and position.
  const astSteps = new Map<string, AstStep>()
  const scenarioLines = new Map<string, number>()
  const exampleRows = new Map<string, { line: number; values: string }>()
  const collect = (children: readonly (FeatureChild | RuleChild)[]) => {
    for (const child of children) {
      const node = child.background ?? child.scenario
      if (node) for (const step of node.steps) astSteps.set(step.id, step)
      if (child.scenario) scenarioLines.set(child.scenario.id, child.scenario.location.line)
      for (const examples of child.scenario?.examples ?? []) {
        const header = examples.tableHeader?.cells.map((c) => c.value) ?? []
        for (const row of examples.tableBody) {
          const values = row.cells.map((c, i) => `${header[i]}: ${c.value}`).join(', ')
          exampleRows.set(row.id, { line: row.location.line, values })
        }
      }
      if ('rule' in child && child.rule) collect(child.rule.children)
    }
  }
  collect(doc.feature.children)

  // Gherkin compiles each pickle from nodes of this document.
  const node = <V>(nodes: Map<string, V>, id: string): V => {
    const found = nodes.get(id)
    if (found === undefined) throw new Error(`${file} has no node ${id}`)
    return found
  }
  const scenarios = compile(doc, file, newId).map((pickle): Scenario => {
    const scenarioLine = node(scenarioLines, pickle.astNodeIds[0])
    // Outline rows share a name; tell them apart by their values.
    const row = exampleRows.get(pickle.astNodeIds[1])
    const ownSteps = pickle.steps.flatMap((ps) => {
      const ast = node(astSteps, ps.astNodeIds[0])
      // A Background's steps belong to every scenario, so don't pick one out.
      return ast.location.line > scenarioLine ? [ast.location.line] : []
    })
    return {
      name: row ? `${pickle.name} (${row.values})` : pickle.name,
      file,
      line: row?.line ?? scenarioLine,
      lines: [scenarioLine, ...(row ? [row.line] : []), ...ownSteps],
      outline: row && { name: pickle.name, line: scenarioLine, row: row.values },
      tags: pickle.tags.map((t) => t.name),
      steps: pickle.steps.map((ps): Step => {
        const ast = node(astSteps, ps.astNodeIds[0])
        const step: Step = {
          keyword: ast.keyword,
          keywordType: ast.keywordType,
          text: ps.text,
          file,
          line: ast.location.line,
          column: (ast.location.column ?? 1) + ast.keyword.length,
          argument: argument(ps.argument),
        }
        try {
          step.program = parse(ps.text)
        } catch (err) {
          // Reported when the step runs, so one typo fails one scenario.
          step.error = err
        }
        return step
      }),
    }
  })

  return { name: doc.feature.name, file, line: doc.feature.location.line, scenarios }
}

function parseGherkin(file: string, src: string, newId: () => string) {
  try {
    return new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher()).parse(src)
  } catch (err) {
    if (!(err instanceof Errors.GherkinException)) throw err
    // Gherkin collects several; each says where, and repeats it as "(3:5): ".
    const each = err.errors?.length ? err.errors : [err]
    throw new LoadError(
      file,
      each.map((e) => {
        const { line = 1, column = 1 } = (e as Errors.GherkinException).location ?? {}
        return { line, column, message: e.message.replace(/^\(\d+:\d+\): /, '') }
      }),
    )
  }
}

// A DocString arrives as a string, a DataTable as a list of rows, as if either
// had been written at the end of the step.
function argument(arg: PickleStepArgument | undefined): string | string[][] | undefined {
  if (arg?.docString) return arg.docString.content
  if (arg?.dataTable) return arg.dataTable.rows.map((row) => row.cells.map((c) => c.value))
}
