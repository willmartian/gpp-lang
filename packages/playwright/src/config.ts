// Playwright as a backend in gpp.config.ts, and the words it adds to the
// shared ones: those for the page, which only a whole app in a browser has.
//
//     // gpp.config.ts
//     import { defineConfig } from 'gpp-lang'
//     import { playwright } from '@gpp-lang/playwright/config'
//
//     export default defineConfig({ backends: [playwright({ files: ['features/**/*.gpp'] })] })
//
// Only this is loaded by the tools, so it imports nothing that runs a browser.

import type { Backend, Env } from '@gpp-lang/core'
import {
  CheckType,
  called,
  Expectation,
  escapeRegExp,
  formsFor,
  NameType,
  nameOf,
  say,
  TextType,
  Env as Words,
  words,
} from '@gpp-lang/core'
import type { BrowserContext } from './driver.ts'

export interface PlaywrightOptions {
  // The .gpp files and Markdown it runs, as globs from the config's
  // directory. By default, all of them.
  files?: string[]
}

export const NAME = 'Playwright'

export function playwright({ files = ['**/*.gpp', '**/*.md'] }: PlaywrightOptions = {}): Backend {
  return { name: NAME, files, words: playwrightWords() }
}

// ---------------------------------------------------------------- the page

let vocabulary: Env | undefined

// The shared words, and those for the page.
export function playwrightWords(): Env {
  vocabulary ??= pageChecks(navigation(new Words(words())))
  return vocabulary
}

const form = formsFor<BrowserContext>()
const Path = called(TextType, 'a "/path" or URL')

// Going somewhere on the page.
function navigation(env: Env): Env {
  return env
    .word(
      'Visit',
      form([Path], async ({ page }, where) => void (await page.goto(where))),
    )
    .word(
      'Reload',
      form([], async ({ page }) => void (await page.reload())),
    )
    .word(
      'Back',
      form([], async ({ page }) => void (await page.goBack())),
    )
    .doc({ group: 'Doing', summary: 'Goes to a path on the app, or a URL.', examples: ['Given I Visit "/"'] }, 'Visit')
    .doc({ group: 'Doing', summary: 'Reloads the page.', examples: ['When I Reload the page'] }, 'Reload')
    .doc(
      { group: 'Doing', summary: "Goes back, as the browser's back button does.", examples: ['When I go Back'] },
      'Back',
    )
}

// Checks on the page itself, retrying as Playwright's expect does.
function pageChecks(env: Env): Env {
  const expectPage = (ctx: BrowserContext, not: boolean) => (not ? ctx.expect(ctx.page).not : ctx.expect(ctx.page))
  return env
    .word(
      'At',
      form(
        [Path],
        CheckType,
        (ctx, where) =>
          new Expectation(`At ${JSON.stringify(where)}`, (not) => expectPage(ctx, not).toHaveURL(urlPattern(where))),
      ),
    )
    .word(
      'Titled',
      form(
        [NameType],
        CheckType,
        (ctx, title) =>
          new Expectation(`Titled ${say(title)}`, (not) => expectPage(ctx, not).toHaveTitle(nameOf(title))),
      ),
    )
    .doc(
      {
        group: 'Checking',
        summary: "Checks the page's path, or its whole URL.",
        examples: ['Then I should be At "/dashboard"'],
      },
      'At',
    )
    .doc(
      {
        group: 'Checking',
        summary: "Checks the page's title.",
        examples: ['Then the page should be Titled "Dashboard"'],
      },
      'Titled',
    )
}

// "/dashboard" means that path on whatever host the page is on.
function urlPattern(where: string): string | RegExp {
  if (!where.startsWith('/')) return where
  return new RegExp(`^[a-z]+://[^/]+${escapeRegExp(where)}(?:[?#].*)?$`)
}
