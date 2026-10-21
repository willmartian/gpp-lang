/*
 * How a file divides into its Defines and its Gherkin, and, for editors,
 * where on each line the code is. Every part is a copy of the whole file with
 * the other lines blanked, so line numbers in errors stay true.
 */

import { dialects } from '@cucumber/gherkin'
import { gppFences, isMarkdown } from './markdown.ts'
import { isScript, templates } from './templates.ts'

/** Something about how a file divides that makes it a mistake, and where. */
export interface Problem {
  line: number
  column: number
  message: string
}

/** A file's parts: its Defines, and its Gherkin, a Feature each. */
export interface Sections {
  preambles: string[]
  documents: string[]
  problems: Problem[]
  /**
   * For a script, what its templates are: a story's steps, or Features, as
   * a test's are. A backend says which of these its templates are.
   */
  templates?: Templates
}

export function sections(file: string, src: string): Sections {
  if (isMarkdown(file)) return markdownSections(src)
  if (isScript(file)) return scriptSections(src)
  const { preamble, gherkin } = split(src)
  return { preambles: [preamble], documents: gherkin === null ? [] : [gherkin], problems: [] }
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const featureKeywords = [...new Set(Object.values(dialects).flatMap((d) => d.feature))]
const FEATURE = new RegExp(`^\\s*(?:${featureKeywords.map(escapeRegExp).join('|')}):`)

/**
 * Splits a file at its Feature line, taking the tags and comments just above
 * it along. Both halves keep every line, blanked where they belong to the
 * other, so line numbers in errors stay true.
 */
export function split(src: string): { preamble: string; gherkin: string | null } {
  const lines = src.split('\n')
  let start = lines.findIndex((l) => FEATURE.test(l))
  if (start === -1) return { preamble: src, gherkin: null }
  while (start > 0 && /^\s*(?:@|#|$)/.test(lines[start - 1])) start--
  const comment = (l: string) => /^\s*#/.test(l)
  return {
    preamble: lines.map((l, i) => (i < start ? l : '')).join('\n'),
    gherkin: lines.map((l, i) => (i >= start || comment(l) ? l : '')).join('\n'),
  }
}

/**
 * Whether a block starts like the middle of a Feature: with any Gherkin
 * keyword but Feature, a tag or a table.
 */
function carriesOn(first: string, language: string): boolean {
  const d = dialects[language] ?? dialects.en
  const sections = [...d.background, ...d.scenario, ...d.scenarioOutline, ...d.rule, ...d.examples].map((k) => `${k}:`)
  const steps = [...d.given, ...d.when, ...d.then, ...d.and, ...d.but]
  const trimmed = first.trimStart()
  return /^[@|]/.test(trimmed) || [...sections, ...steps].some((k) => trimmed.startsWith(k))
}

/**
 * A Markdown file's ```gpp blocks, in order. A block with a Feature line
 * starts a new Feature, and anything above that line in it is Defines. A
 * block that starts like Gherkin carries on the Feature before it, so prose
 * can sit between the scenarios of one Feature. Any other block is Defines,
 * and every file shares them, as it does a .gpp file's.
 */
function markdownSections(src: string): Sections {
  const lines = src.split('\n')
  const language = /^\s*#\s*language:\s*(\S+)/m.exec(src)?.[1] ?? 'en'
  const preambles: Set<number>[] = []
  const documents: Set<number>[] = []
  const problems: Problem[] = []
  /** A block's lines that a view of it keeps, as lines of the whole file. */
  const kept = (view: string, start: number) => new Set(view.split('\n').flatMap((l, i) => (l ? [start + i] : [])))

  for (const fence of gppFences(src)) {
    const block = lines.slice(fence.start, fence.end)
    const { preamble, gherkin } = split(block.join('\n'))
    const first = block.find((l) => l.trim() && !/^\s*#/.test(l))
    if (gherkin !== null) {
      preambles.push(kept(preamble, fence.start))
      documents.push(kept(gherkin, fence.start))
    } else if (first !== undefined && carriesOn(first, language)) {
      let last = documents.at(-1)
      if (!last) {
        const message = 'This block carries on a Feature, but there is none above it'
        problems.push({ line: fence.start + 1, column: 1, message })
        last = new Set()
        documents.push(last)
      }
      for (const i of kept(preamble, fence.start)) last.add(i)
    } else {
      preambles.push(kept(preamble, fence.start))
    }
  }
  const view = (keep: Set<number>) => lines.map((l, i) => (keep.has(i) ? l : '')).join('\n')
  return { preambles: preambles.filter((p) => p.size).map(view), documents: documents.map(view), problems }
}

/**
 * A script's gpp templates. A template's view keeps its text where it is.
 *
 * Each ${…} becomes ${0}, ${1}… in order, padded to its width so what follows
 * stays where it was. One over several lines takes the rest of its last line
 * up to its first. Whether anything takes one is up to the backend's words.
 *
 * A template is either a Feature, as a test's is, or the steps of a Feature
 * of one Scenario, as a story's are, named for the story it's in, with the
 * Feature and Scenario lines on the two lines above its first step, which the
 * view has blanked.
 */
function scriptSections(src: string): Sections {
  const lines = src.split('\n')
  const starts: number[] = []
  for (let i = 0, at = 0; i < lines.length; at += lines[i].length + 1, i++) starts.push(at)
  const lineOf = (offset: number) => starts.findLastIndex((s) => s <= offset)
  const place = (offset: number) => ({ line: lineOf(offset) + 1, column: offset - starts[lineOf(offset)] + 1 })

  const documents: string[] = []
  const problems: Problem[] = []
  let features = false
  const found = templates(src)
  for (const t of found) {
    const first = lineOf(t.start)
    const last = lineOf(t.end)
    const view = lines.map(() => '')
    for (let i = first; i <= last; i++) {
      const from = i === first ? t.start - starts[i] : 0
      const to = i === last ? t.end - starts[i] : lines[i].length
      view[i] = ' '.repeat(from) + lines[i].slice(from, to)
    }
    // From the last, so each one's place is as the source has it.
    for (const [k, { start, end }] of [...t.interpolations.entries()].reverse()) {
      const line = lineOf(start)
      const lastLine = lineOf(end - 1)
      const slot = `\${${k}}`
      const rest = view[lastLine].slice(end - starts[lastLine])
      for (let i = line + 1; i <= lastLine; i++) view[i] = ''
      const width = line === lastLine ? end - start : slot.length + 1
      view[line] = view[line].slice(0, start - starts[line]) + slot.padEnd(width) + rest
    }
    if (isFeatureTemplate(view.join('\n'))) {
      documents.push(view.join('\n'))
      features = true
      continue
    }
    const top = view.findIndex((l, i) => i >= first && l.trim())
    const wrong = notAStep(view, first, last)
    if (wrong) problems.push(wrong)
    else if (!view.some((l) => STEP.test(l.trim())))
      problems.push({ ...place(t.start), message: 'A gpp template needs at least one step' })
    else if (top < 2)
      problems.push({ ...place(t.start), message: 'A gpp template needs two lines above its first step' })
    else {
      const name = storyName(src.slice(0, t.start))
      view[top - 2] = `Feature: ${name}`
      view[top - 1] = `Scenario: ${name}`
      documents.push(view.join('\n'))
    }
  }
  const kind: Templates = features ? 'features' : 'steps'
  return { preambles: [], documents, problems, ...(found.length > 0 && { templates: kind }) }
}

/** What a script's templates are: a story's steps, or Features. */
export type Templates = 'steps' | 'features'

/**
 * Whether a template is a test's, a Feature, rather than a story's steps: its
 * first line that isn't blank, a comment or a tag starts with Feature:.
 */
export function isFeatureTemplate(text: string): boolean {
  const first = text.split('\n').find((l) => l.trim() && !/^\s*[#@]/.test(l))
  return first !== undefined && FEATURE.test(first)
}

const STEP = /^(?:Given|When|Then|And|But|\*)\s/
const DOC_STRING = /^(?:"""|```)/

/**
 * The first line of a template that isn't a step, a table or DocString under
 * one, or a comment, as a Scenario's lines are. Gherkin's own message for one
 * lists its grammar.
 */
function notAStep(view: string[], first: number, last: number): Problem | null {
  let inDocString = false
  for (let i = first; i <= last; i++) {
    const line = view[i].trim()
    const fence = DOC_STRING.test(line)
    if (fence) inDocString = !inDocString
    if (fence || inDocString || !line || line.startsWith('|') || line.startsWith('#') || STEP.test(line)) continue
    return {
      line: i + 1,
      column: view[i].length - view[i].trimStart().length + 1,
      message:
        'Each line of a gpp template is a step, starting with Given, When, Then, And, But or *, unless the template starts with Feature:',
    }
  }
  return null
}

/** The story a template is in: the last export above it. */
const storyName = (before: string) => [...before.matchAll(/export\s+const\s+([\w$]+)/g)].at(-1)?.[1] ?? 'Story'

// ---------------------------------------------------------------- editors

/**
 * Where each line's code is, for editors: all of a Define line, the text after
 * a step's keyword, nothing on the rest. keyword is a step's, if it has one.
 */
export interface CodeLine {
  offset: number
  text: string
  keyword?: { offset: number; length: number }
}

export function codeLines(src: string, file = ''): (CodeLine | null)[] {
  const { preambles, documents } = sections(file, src)
  /** Each line as its part has it: a template's line without the code around it. */
  const lines = src.split('\n').map(() => '')
  const kept = (views: string[]) => {
    const keep = lines.map(() => false)
    for (const view of views) {
      for (const [i, l] of view.split('\n').entries()) {
        if (!l) continue
        keep[i] = true
        lines[i] = l
      }
    }
    return keep
  }
  const defines = kept(preambles)
  const gherkin = kept(documents)
  const language = /^\s*#\s*language:\s*(\S+)/m.exec(src)?.[1] ?? 'en'
  const d = dialects[language] ?? dialects.en
  const stepKeywords = [...new Set([...d.given, ...d.when, ...d.then, ...d.and, ...d.but])].sort(
    (a, b) => b.length - a.length,
  )
  let docString: string | null = null
  return lines.map((line, i) => {
    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length
    if (!trimmed || trimmed.startsWith('#')) return null
    if (defines[i]) return { offset: 0, text: line }
    if (!gherkin[i]) return null
    /** Doc strings can hold anything, including lines that look like steps. */
    const fence = /^("""|```)/.exec(trimmed)?.[1]
    if (fence && (docString === null || docString === fence)) {
      docString = docString === null ? fence : null
      return null
    }
    if (docString !== null) return null
    const keyword = stepKeywords.find((k) => trimmed.startsWith(k))
    if (!keyword) return null
    const offset = indent + keyword.length
    return { offset, text: line.slice(offset), keyword: { offset: indent, length: keyword.trimEnd().length } }
  })
}
