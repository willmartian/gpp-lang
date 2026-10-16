// The JavaScript Spec++ reads: spp`…` templates, Storybook play functions, in
// .js and .ts files and their kin. It knows nothing of Gherkin; how a
// template becomes a scenario is in sections.ts.
//
// It reads just enough JavaScript to find them: comments, strings and
// templates, with what's in a template's ${…}, so spp` in a string or a
// comment isn't one. A regular expression with a quote or a backtick in it can
// still fool it.

export const isScript = (file: string) => /\.[cm]?[jt]sx?$/.test(file)

// A template: where its text starts and ends, after the opening backtick and
// at the closing one, and where any ${…} in it starts.
export interface Template {
  start: number
  end: number
  interpolations: number[]
}

// Every spp`…` template, in order.
export function templates(src: string): Template[] {
  const found: Template[] = []
  code(src, 0, false, found)
  // One in another's ${…} is found first.
  return found.sort((a, b) => a.start - b.start)
}

const IDENTIFIER = /[\w$]/

// Reads code from i to the end, or, inside a ${…}, to the } that closes it,
// and returns where it stopped.
function code(src: string, i: number, nested: boolean, found: Template[]): number {
  let depth = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') i = lineEnd(src, i)
    else if (c === '/' && src[i + 1] === '*') i = blockEnd(src, i)
    else if (c === '"' || c === "'") i = stringEnd(src, i)
    else if (c === '`') i = template(src, i, isTag(src, i), found)
    else if (c === '{') {
      depth++
      i++
    } else if (c === '}') {
      if (nested && depth === 0) return i
      depth--
      i++
    } else i++
  }
  return i
}

// Whether the backtick at i is spp's: spp`, or x.spp`, but not, say, myspp`.
const isTag = (src: string, i: number) => src.slice(i - 3, i) === 'spp' && !IDENTIFIER.test(src[i - 4] ?? '')

const lineEnd = (src: string, i: number) => {
  const nl = src.indexOf('\n', i)
  return nl === -1 ? src.length : nl
}

const blockEnd = (src: string, i: number) => {
  const close = src.indexOf('*/', i + 2)
  return close === -1 ? src.length : close + 2
}

// Past the quote that closes the string at i, or the end of its line.
function stringEnd(src: string, i: number): number {
  const quote = src[i]
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === '\\') j++
    else if (src[j] === quote || src[j] === '\n') return j + 1
  }
  return src.length
}

// Past the backtick that closes the template at i, noting it if it's spp's.
function template(src: string, i: number, spp: boolean, found: Template[]): number {
  const interpolations: number[] = []
  let j = i + 1
  while (j < src.length && src[j] !== '`') {
    if (src[j] === '\\') j += 2
    else if (src[j] === '$' && src[j + 1] === '{') {
      interpolations.push(j)
      j = code(src, j + 2, true, found) + 1
    } else j++
  }
  if (spp) found.push({ start: i + 1, end: j, interpolations })
  return j + 1
}
