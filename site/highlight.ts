/*
 * Code blocks for the site, coloured by Shiki. Gherkin++ blocks use the VS Code
 * extension's grammar for the Gherkin around the code, and Gherkin++'s own lexer
 * for which words are code, as the language server's semantic tokens do. So
 * the site and the editor agree on what runs.
 */

import { readFileSync } from 'node:fs'
import { lex } from '@gpp-lang/core'
import { createCssVariablesTheme, createHighlighter, type DecorationItem, type LanguageRegistration } from 'shiki'

const grammar: LanguageRegistration = JSON.parse(
  readFileSync(new URL('../editors/vscode/syntaxes/gpp.tmLanguage.json', import.meta.url), 'utf8'),
)

/** Every colour is a CSS variable, set in style.css for light and dark. */
const theme = createCssVariablesTheme({ name: 'site', variablePrefix: '--code-', fontStyle: true })

const LANGS = ['typescript', 'shellscript', 'lua', 'markdown']

/** Gherkin++'s README uses ```gherkin blocks so GitHub colours them; here they're Gherkin++. */
const ALIASES: Record<string, string> = { gherkin: 'gpp', ts: 'typescript', sh: 'shellscript' }

const highlighter = await createHighlighter({ themes: [theme], langs: [{ ...grammar, name: 'gpp' }, ...LANGS] })

export function highlight(code: string, info: string): string {
  const name = info.split(/[\s,]+/)[0] ?? ''
  const lang = ALIASES[name] ?? (highlighter.getLoadedLanguages().includes(name) ? name : 'text')
  return highlighter.codeToHtml(code.replace(/\n$/, ''), {
    lang,
    theme: 'site',
    decorations: lang === 'gpp' ? words(code) : [],
    transformers: [
      {
        pre(node) {
          this.addClassToHast(node, `language-${lang}`)
        },
      },
    ],
  })
}

const STEP = /^\s*(?:Given|When|Then|And|But|\*)\s/
const DEFINE = /^(\s*)Define:/

/** The capitalised words and numbers in steps and Defines: the code. */
function words(code: string): DecorationItem[] {
  const found: DecorationItem[] = []
  let define: number | null = null
  let docString: string | null = null
  for (const [line, text] of code.split('\n').entries()) {
    const indent = text.search(/\S|$/)
    const fence = /^\s*("""|```)/.exec(text)?.[1]
    if (fence && (docString === null || docString === fence)) docString = docString === null ? fence : null
    if (fence || docString !== null) continue

    const header = DEFINE.exec(text)
    if (header) define = header[1].length
    else if (define !== null && text.trim() && indent <= define) define = null
    const offset = header || define !== null ? 0 : STEP.exec(text)?.[0].length
    if (offset === undefined) continue

    for (const t of tokens(text.slice(offset))) {
      const kind = t.type === 'word' && !/^define$/i.test(t.name) ? 'word' : t.type === 'num' ? 'number' : null
      if (!kind) continue
      const start = offset + t.pos
      found.push({
        start: { line, character: start },
        end: { line, character: start + t.length },
        properties: { style: `color:var(--gpp-${kind})` },
      })
    }
  }
  return found
}

/** An example can be wrong on purpose, as the error messages in the README are. */
function tokens(text: string) {
  try {
    return lex(text)
  } catch {
    return []
  }
}
