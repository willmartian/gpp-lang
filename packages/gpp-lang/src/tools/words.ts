// Every word a project can use: the shared words, each of its backends' own,
// and its Defines, with what each takes and what it leaves. It's read from the same forms and
// inferred Defines the checker uses, so it can't drift from what the words
// do. Run it as `gpp-lang words`; the docs site shows the same entries.
//
//     Click
//       Clicks an element.
//       Element ->    takes something on the page
//       Example: When I Click the Button "Sign in"
//
// Words that share a doc, like the ARIA roles, are listed together.

import path from 'node:path'
import type { Checked, Config, Doc, Env, Form } from '@gpp-lang/core'
import { GROUPS, keywords, words } from '@gpp-lang/core'

const KEYWORDS = keywords(async () => {})

const WIDTH = 96

// The words that share a doc, and the ways to use them.
export interface Entry {
  names: string[]
  doc: Doc
  forms: readonly Form[]
}

// The built-in words and step keywords, one entry per doc, in the order of
// GROUPS, then the order they were documented in. The tests see that every
// builtin has a doc. With own, only the words the Env itself adds, as a
// backend's add to the shared words.
export function entries(words: Env, { own = false }: { own?: boolean } = {}): Entry[] {
  const byDoc = new Map<Doc, Entry>()
  for (const scope of own ? [words] : [words, KEYWORDS]) {
    for (let env: Env | null = scope; env; env = own ? null : env.parent) {
      for (const [key, doc] of env.docs) {
        const forms = env.forms(key)
        if (!forms) continue
        const name = env.spellings.get(key) ?? key
        const entry = byDoc.get(doc)
        if (entry) entry.names.push(name)
        // A form that's always a mistake isn't a way to use the word.
        else byDoc.set(doc, { names: [name], doc, forms: forms.filter((f) => !f.mistake) })
      }
    }
  }
  return [...byDoc.values()].sort((a, b) => GROUPS.indexOf(a.doc.group) - GROUPS.indexOf(b.doc.group))
}

export function listWords(config: Config | null, checked: Checked, cwd = process.cwd()): string {
  const out = [
    'Built-in words',
    '',
    'Each line under a word is one way to use it: what it takes, in reading order, and what it',
    'leaves. The first thing a word takes is written right after it. Define is syntax, not a',
    "word, so it isn't listed.",
    '',
  ]
  const grouped = (all: Entry[]) => {
    for (const group of GROUPS) {
      const these = all.filter((e) => e.doc.group === group)
      if (!these.length) continue
      out.push(`${group}:`, '')
      for (const entry of these) out.push(...listed(entry), '')
    }
  }
  grouped(entries(words()))
  for (const backend of config?.backends ?? []) {
    const own = entries(backend.words, { own: true })
    if (!own.length) continue
    out.push(`Only in ${backend.name}'s files`, '')
    grouped(own)
  }

  // As the first backend infers them, since a Define may use its words.
  const [analysis = checked.analysisOf('')] = checked.analyses.values()
  const defines = analysis.words().filter((w) => w.kind === 'define')
  out.push('Defined in this project', '')
  if (!defines.length) out.push('None yet.', '')
  for (const w of defines) {
    out.push(w.name)
    // one line per Define, for a word with several
    w.signatures.forEach((signature, i) => {
      const at = w.places?.[i]
      const where = at ? `${path.relative(cwd, at.file)}:${at.line}` : ''
      out.push(`  ${signature.slice(w.name.length + ' : '.length)}    ${where}`.trimEnd())
    })
    out.push('')
  }
  return out.join('\n').trimEnd()
}

// An entry: its words, what they're for, a line per form and an example.
function listed({ names, doc, forms }: Entry): string[] {
  const width = Math.max(...forms.map((f) => shape(f).length))
  const [example] = doc.examples
  return [
    ...wrap(names, doc.title),
    `  ${doc.summary}`,
    ...forms.map((f) => `  ${shape(f).padEnd(width)}    ${takes(f)}`),
    ...(example ? `Example: ${example}`.split('\n').map((line) => `  ${line}`) : []),
  ]
}

// "Text | Pattern, Scope -> Element"
export function shape(f: Form): string {
  const inputs = f.inputs.map((t) => t.name).join(', ')
  return `${inputs}${inputs ? ' ' : ''}->${f.output ? ` ${f.output.name}` : ''}`
}

// 'takes a "name" to look for, then Within something'
export function takes(f: Form): string {
  return f.inputs.length ? `takes ${f.inputs.map((t) => t.phrase).join(', then ')}` : 'takes nothing'
}

// A list of names, after a title if there is one, over as many lines as it needs.
function wrap(names: string[], title?: string): string[] {
  const lines: string[] = []
  let line = title ? `${title}: ` : ''
  for (const [i, name] of names.entries()) {
    const next = i < names.length - 1 ? `${name}, ` : name
    if (line.trim() && (line + next).trimEnd().length > WIDTH) {
      lines.push(line.trimEnd())
      line = ''
    }
    line += next
  }
  lines.push(line)
  return lines
}
