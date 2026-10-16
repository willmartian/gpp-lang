import type { Backend, Capabilities, Context, Driver } from '@spp-lang/core'
import { ARIA_ROLES, actions, checks, core, Env, mistake, queries } from '@spp-lang/core'
// The backend, for a project's spp.config, and the words a play function has,
// apart from what runs them (words.ts), so spp-lang check and the language
// server can check templates without Storybook, or a browser.

export interface StoryContext extends Context {
  canvasElement: HTMLElement
}

// What words.ts's Testing Library driver can do.
export const capabilities: Capabilities = {
  roles: ARIA_ROLES,
  queries: ['label', 'text', 'placeholder', 'alt', 'title', 'testId'],
  actions: ['click', 'double-click', 'hover', 'focus', 'check', 'uncheck', 'clear', 'fill', 'type', 'select', 'press'],
  states: [
    'visible',
    'hidden',
    'checked',
    'enabled',
    'disabled',
    'focused',
    'empty',
    'value',
    'text',
    'containing',
    'texts',
    'count',
  ],
}

// The words, on a driver.
export function storyWords<H>(driver: Driver<StoryContext, H>, parent: Env | null = null): Env {
  const env = queries(new Env(parent), driver)
  actions(env, driver)
  checks(env, driver)
  // The browser's words for the page, which say why they aren't here
  // rather than being unknown.
  for (const word of ['Visit', 'Reload', 'Back', 'At', 'Titled'])
    env.word(
      word,
      mistake([], () => `A story is one page, already open, so a play function has no ${word}`),
    )
  return env
}

const unrunnable = (): never => {
  throw new Error("These Storybook words are for checking. A play function runs words.ts's.")
}

// The words for the checker, which reads their forms and never runs them.
function storybookWords(parent: Env | null = null): Env {
  return storyWords(
    {
      ...capabilities,
      find: unrunnable,
      act: unrunnable,
      press: unrunnable,
      expect: unrunnable,
      all: unrunnable,
      retry: unrunnable,
    },
    parent,
  )
}

const NAME = '@spp-lang/storybook'

export interface StorybookOptions {
  // Where the stories are, and the project's .spp files of Defines. By
  // default, everything under the config.
  files?: string[]
  // Files and directories to leave out.
  ignore?: string[]
}

// Runs spp`…` templates as stories' play functions.
export function storybook(options: StorybookOptions = {}): Backend {
  return {
    name: NAME,
    runs: 'templates',
    files: options.files ?? ['.'],
    ignore: options.ignore ?? [],
    words: () => storybookWords(core()),
  }
}

export const isStorybook = (b: Backend): boolean => b.name === NAME
