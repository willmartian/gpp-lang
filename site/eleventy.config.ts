// The docs site. Its pages are the repo's own Markdown, so there's one copy
// of the docs, read on GitHub or here. Links between pages are rewritten to
// the site, and links to anything else in the repo go to GitHub. The Built-in
// words page adds an entry for each built-in word, from the docs the words declare.
//
//     pnpm docs        # serve on localhost:8080, rebuilding on change
//     pnpm docs:build  # write site/_site
//
// It runs in site/, so paths here are relative to it.
//
// GitHub Pages serves it under /gpp-lang/, which CI passes as --pathprefix;
// HtmlBasePlugin adds it to every absolute URL in the HTML.

import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { HtmlBasePlugin } from '@11ty/eleventy'
import { fences, GROUPS, words as vocabulary } from '@gpp-lang/core'
import { playwright } from '@gpp-lang/playwright/config'
import { testingLibrary } from '@gpp-lang/testing-library/config'
import type { Entry } from 'gpp-lang'
import { entries, shape, takes } from 'gpp-lang'
import type MarkdownIt from 'markdown-it'
import { highlight } from './highlight.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const REPO = 'https://github.com/willmartian/gpp-lang'

const PAGES = [
  { file: 'README.md', url: '/', nav: 'Overview' },
  { file: 'docs/words.md', url: '/words/', nav: 'How words work', section: 'Words' },
  { file: 'docs/built-in-words.md', url: '/built-in-words/', nav: 'Built-in words', layout: 'words.njk' },
  { file: 'docs/defines.md', url: '/defines/', nav: 'Your own words' },
  { file: 'docs/playwright.md', url: '/playwright/', nav: 'Playwright', section: 'Backends' },
  { file: 'docs/storybook.md', url: '/storybook/', nav: 'Storybook' },
  { file: 'docs/testing-library.md', url: '/testing-library/', nav: 'Testing Library' },
  { file: 'docs/tools.md', url: '/tools/', nav: 'CLI and editors', section: 'Tools' },
]

const FONTS = [
  'iosevka/files/iosevka-latin-400-normal.woff2',
  'iosevka/files/iosevka-latin-400-italic.woff2',
  'iosevka/files/iosevka-latin-600-normal.woff2',
  'iosevka-aile/files/iosevka-aile-latin-400-normal.woff2',
  'iosevka-aile/files/iosevka-aile-latin-600-normal.woff2',
]

// The parts of Eleventy's config API this file uses.
interface EleventyConfig {
  addTemplate(file: string, content: string, data: Record<string, unknown>): void
  addGlobalData(name: string, value: unknown): void
  addPassthroughCopy(paths: string | Record<string, string>): void
  addWatchTarget(path: string): void
  amendLibrary(engine: 'md', amend: (md: MarkdownIt) => void): void
  addPlugin(plugin: unknown): void
}

export default function (config: EleventyConfig) {
  const groups = words()
  for (const page of PAGES) {
    const content = readFileSync(path.join(ROOT, page.file), 'utf8')
    const title = /^# (.*)$/m.exec(content)?.[1] ?? page.nav
    // The page's sections, for the sidebar; the Built-in words page's groups are sections too.
    const toc = headings(content)
    if (page.layout === 'words.njk') toc.push(...groups.map(({ name, id }) => ({ text: name, id })))
    config.addTemplate(page.file, content, {
      permalink: page.url,
      layout: page.layout ?? 'page.njk',
      title,
      source: page.file,
      toc,
    })
    config.addWatchTarget(path.join(ROOT, page.file))
  }
  config.addGlobalData('pages', PAGES)
  config.addGlobalData('repo', REPO)
  config.addGlobalData('version', version())
  config.addGlobalData('groups', groups)

  config.addPlugin(HtmlBasePlugin)
  config.addPassthroughCopy('style.css')
  for (const font of FONTS) {
    config.addPassthroughCopy({ [`node_modules/@fontsource/${font}`]: `fonts/${path.basename(font)}` })
  }

  config.amendLibrary('md', (md) => {
    md.set({ highlight: (code, lang, attrs) => highlight(code, [lang, attrs].join(' ')) })

    const renderLink =
      md.renderer.rules.link_open ?? ((tokens, i, options, _env, self) => self.renderToken(tokens, i, options))
    md.renderer.rules.link_open = (tokens, i, options, env, self) => {
      const href = tokens[i].attrGet('href')
      const source: unknown = env.source
      if (href && typeof source === 'string') tokens[i].attrSet('href', link(href, source))
      return renderLink(tokens, i, options, env, self)
    }

    const renderHeading =
      md.renderer.rules.heading_open ?? ((tokens, i, options, _env, self) => self.renderToken(tokens, i, options))
    md.renderer.rules.heading_open = (tokens, i, options, env, self) => {
      tokens[i].attrSet('id', slug(tokens[i + 1].content))
      return renderHeading(tokens, i, options, env, self)
    }
  })

  return {
    dir: { input: '.', includes: '_includes', output: '_site' },
    // The pages are plain Markdown, and the docs show {{ }} as they are.
    markdownTemplateEngine: false,
  }
}

// The version users install, from the CLI's package: every package shares it.
function version(): string {
  const pkg: unknown = JSON.parse(readFileSync(path.join(ROOT, 'packages/gpp-lang/package.json'), 'utf8'))
  if (typeof pkg === 'object' && pkg && 'version' in pkg && typeof pkg.version === 'string') return pkg.version
  throw new Error('packages/gpp-lang/package.json has no version')
}

// The built-in words, by group, for words.njk: the shared words, and those
// only a backend has, saying which.
function words() {
  const all = [
    ...entries(vocabulary()),
    ...[playwright(), testingLibrary()].flatMap((b) =>
      entries(b.words, { own: true }).map((e) => ({ ...e, backend: b.name })),
    ),
  ]
  return GROUPS.map((name) => ({
    name,
    id: slug(name),
    entries: all
      .filter((e) => e.doc.group === name)
      .map(({ names, doc, forms, backend }: Entry & { backend?: string }) => ({
        // * has no letters to make an id of.
        id: slug(doc.title ?? names[0]) || 'asterisk',
        title: doc.title,
        backend,
        names,
        summary: doc.summary,
        forms: forms.map((f) => ({ shape: shape(f), takes: takes(f) })),
        examples: highlight(doc.examples.join('\n'), 'gpp'),
      })),
  })).filter((g) => g.entries.length)
}

// A page's level-two headings, outside its code blocks.
function headings(content: string) {
  const code = new Set<number>()
  for (const f of fences(content)) for (let i = f.start - 1; i <= f.end; i++) code.add(i)
  return content.split('\n').flatMap((line, i) => {
    const text = code.has(i) ? undefined : /^## (.*)$/.exec(line)?.[1]
    return text ? [{ text: text.replace(/`/g, ''), id: slug(text) }] : []
  })
}

// An id as GitHub makes one, so a link to a heading works in both places.
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-')
}

// A link in a page, from where it is on the site. Pages link to each other as
// files in the repo do.
function link(href: string, source: string): string {
  if (/^([a-z]+:|#|\/)/i.test(href)) return href
  const [target, anchor] = href.split('#')
  const file = path.posix.normalize(path.posix.join(path.posix.dirname(source), target))
  const hash = anchor ? `#${anchor}` : ''
  const linked = PAGES.find((p) => p.file === file)
  if (linked) return linked.url + hash
  const full = path.join(ROOT, file)
  const kind = existsSync(full) && statSync(full).isDirectory() ? 'tree' : 'blob'
  return `${REPO}/${kind}/master/${file}${hash}`
}
