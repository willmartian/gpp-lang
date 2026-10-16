import type { Capabilities, Context, Driver } from 'spp-lang'
import { ARIA_ROLES, actions, checks, core, Env, mistake, queries } from 'spp-lang'
// The words a Storybook play function has, apart from what runs them
// (words.ts), so spp-lang check and the language server can check templates
// without Storybook installed.

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
export function storybookWords(parent: Env | null = null): Env {
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

// The words, for spp-lang check and the language server, which check templates
// with them.
export const words = () => storybookWords(core())
