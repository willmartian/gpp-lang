// The words a Storybook play function has: the shared words (words/shared.ts)
// on a driver made of Testing Library, as storybook/test gives it.
//
// Things are looked for in the whole document, not only in the story's
// canvas, so a dialog or menu rendered in a portal is found the way a user
// finds it. Checks and actions retry, as Playwright's do, for as long as
// Testing Library's asyncUtilTimeout, so a story's configure() applies.
//
// Only userEvent is instrumented, so the Interactions panel shows each step
// and what it did, and not every query made while retrying.

import {
  getConfig,
  queryAllByAltText,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByRole,
  queryAllByTestId,
  queryAllByText,
  queryAllByTitle,
  userEvent,
} from 'storybook/test'
import type { Env } from '../../language/cognate.ts'
import { SppError } from '../../language/cognate.ts'
import type { Action, Driver, Name, Query, State } from '../../words/driver.ts'
import { settler } from '../../words/shared.ts'
import type { StoryContext } from './vocabulary.ts'
import { capabilities, storyWords } from './vocabulary.ts'

// ---------------------------------------------------------------- handles

// How to find something, done again each time it's used, as Playwright's
// locators are. Within a root, it looks inside whatever the root finds.
export class Target {
  label: string
  root: Target | null
  search: (container: HTMLElement) => HTMLElement[]

  constructor(label: string, root: Target | null, search: (container: HTMLElement) => HTMLElement[]) {
    this.label = label
    this.root = root
    this.search = search
  }
  // What it finds, inside container, as the page is now.
  in(container: HTMLElement): HTMLElement[] {
    const containers = this.root ? this.root.in(container) : [container]
    return [...new Set(containers.flatMap((c) => this.search(c)))]
  }
}

// One element, as all() gives them out.
const fixed = (element: HTMLElement, label: string) => new Target(label, null, () => [element])

const say = (name: Name) => (typeof name === 'string' ? JSON.stringify(name) : String(name))

// Text as a person reads it: whitespace runs read as one space.
const textOf = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()

const matches = (name: Name, text: string) => (typeof name === 'string' ? text === name : name.test(text))

// Playwright's hasText: part of the text, ignoring case.
const has = (name: Name, text: string) =>
  typeof name === 'string' ? text.toLowerCase().includes(name.toLowerCase()) : name.test(text)

function search(query: Query<Target>): { label: string; search: (container: HTMLElement) => HTMLElement[] } {
  if (query.by === 'role') {
    const { role, name, text, has: inside } = query
    const label = [
      `${role} role`,
      name === undefined ? [] : `named ${say(name)}`,
      text === undefined ? [] : `containing ${say(text)}`,
      inside ? `containing the ${inside.label}` : [],
    ]
    return {
      label: label.flat().join(' '),
      search: (c) =>
        queryAllByRole(c, role, name === undefined ? {} : { name })
          .filter((el) => text === undefined || has(text, textOf(el)))
          .filter((el) => !inside || inside.in(el).length > 0),
    }
  }
  const { name } = query
  switch (query.by) {
    case 'label':
      return { label: `field labelled ${say(name)}`, search: (c) => queryAllByLabelText(c, name) }
    case 'text':
      return query.loose
        ? { label: `text ${say(name)}`, search: (c) => queryAllByText(c, name, { exact: false }).slice(0, 1) }
        : { label: `text ${say(name)}`, search: (c) => queryAllByText(c, name) }
    case 'placeholder':
      return { label: `placeholder ${say(name)}`, search: (c) => queryAllByPlaceholderText(c, name) }
    case 'alt':
      return { label: `alt text ${say(name)}`, search: (c) => queryAllByAltText(c, name) }
    case 'title':
      return { label: `title ${say(name)}`, search: (c) => queryAllByTitle(c, name) }
    case 'testId':
      return { label: `test id ${say(name)}`, search: (c) => queryAllByTestId(c, name) }
  }
}

// ---------------------------------------------------------------- states

// The whole page, portals and all.
const page = (ctx: StoryContext) => ctx.canvasElement.ownerDocument.body

// Playwright's visible: a box with some size, and not visibility: hidden.
function visible(el: HTMLElement): boolean {
  const box = el.getBoundingClientRect()
  return box.width > 0 && box.height > 0 && el.checkVisibility({ visibilityProperty: true })
}

const isChecked = (el: HTMLElement) =>
  el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')
    ? el.checked
    : el.getAttribute('aria-checked') === 'true'

const isDisabled = (el: HTMLElement) => el.matches(':disabled') || el.closest('[aria-disabled="true"]') !== null

const isField = (el: HTMLElement) =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement

const fieldValue = (el: HTMLElement) => (isField(el) ? el.value : '')

// What a state says, after "to".
function phrase(state: State): string {
  switch (state.is) {
    case 'value':
      return `have the value ${say(state.text)}`
    case 'text':
      return `read ${say(state.text)}`
    case 'containing':
      return `contain ${say(state.text)}`
    case 'texts':
      return `read ${state.texts.map((t) => JSON.stringify(t)).join(', ')}`
    case 'count':
      return `number ${state.count}`
    default:
      return `be ${state.is}`
  }
}

// Whether a state holds of what a target finds, or null when it can't be
// told either way, like whether nothing at all is checked. saw is what was
// there instead, for the message.
function observe(ctx: StoryContext, target: Target, state: State): { holds: boolean | null; saw: string } {
  const found = target.in(page(ctx))
  if (state.is === 'count') return { holds: found.length === state.count, saw: `found ${found.length}` }
  if (state.is === 'texts') {
    const texts = found.map(textOf)
    const saw = texts.length ? `they read ${texts.map((t) => JSON.stringify(t)).join(', ')}` : 'found none'
    return { holds: texts.length === state.texts.length && texts.every((t, i) => t === state.texts[i]), saw }
  }
  if (found.length === 0) {
    const holds = state.is === 'hidden' ? true : state.is === 'visible' ? false : null
    return { holds, saw: 'found nothing' }
  }
  if (found.length > 1) return { holds: null, saw: `found ${found.length}, and only one should match` }
  const [el] = found
  switch (state.is) {
    case 'visible':
      return { holds: visible(el), saw: 'it is hidden' }
    case 'hidden':
      return { holds: !visible(el), saw: 'it is visible' }
    case 'checked':
      return { holds: isChecked(el), saw: `it is ${isChecked(el) ? '' : 'un'}checked` }
    case 'enabled':
      return { holds: !isDisabled(el), saw: 'it is disabled' }
    case 'disabled':
      return { holds: isDisabled(el), saw: 'it is enabled' }
    case 'focused':
      return { holds: el.ownerDocument.activeElement === el, saw: 'focus is elsewhere' }
    case 'empty': {
      const content = isField(el) ? fieldValue(el) : textOf(el)
      return { holds: content === '', saw: `it has ${JSON.stringify(content)}` }
    }
    case 'value':
      return { holds: matches(state.text, fieldValue(el)), saw: `its value is ${JSON.stringify(fieldValue(el))}` }
    case 'text':
      return { holds: matches(state.text, textOf(el)), saw: `it reads ${JSON.stringify(textOf(el))}` }
    case 'containing':
      return {
        holds: typeof state.text === 'string' ? textOf(el).includes(state.text) : state.text.test(textOf(el)),
        saw: `it reads ${JSON.stringify(textOf(el))}`,
      }
  }
}

// Runs attempt until it doesn't throw, or Testing Library's timeout passes,
// and then throws what it last threw.
async function retry(attempt: () => unknown): Promise<void> {
  const end = Date.now() + getConfig().asyncUtilTimeout
  for (;;) {
    try {
      await attempt()
      return
    } catch (err) {
      if (Date.now() >= end) throw err
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

// The one element an action acts on, once it's there and a person could use
// it, as Playwright waits for before acting.
async function one(ctx: StoryContext, target: Target, enabled: boolean): Promise<HTMLElement> {
  let element: HTMLElement | undefined
  await retry(() => {
    const found = target.in(page(ctx))
    if (found.length !== 1) {
      const saw = found.length ? `found ${found.length}, and only one should match` : 'found nothing'
      throw new SppError(`Looked for the ${target.label}, but ${saw}`)
    }
    const [el] = found
    if (!visible(el)) throw new SppError(`The ${target.label} is hidden`)
    if (enabled && isDisabled(el)) throw new SppError(`The ${target.label} is disabled`)
    element = el
  })
  if (!element) throw new Error(`No element for the ${target.label}`)
  return element
}

// ---------------------------------------------------------------- keys

// A key as Playwright names it, like "Enter" or "Control+Shift+A", as
// userEvent.keyboard spells it: {Control>}{Shift>}{A}{/Shift}{/Control}.
function keystroke(key: string): string {
  const parts = key.length > 1 ? key.split(/\+(?=.)/) : [key]
  const last = parts.pop() ?? key
  const modifiers = parts.map((m) => (m === 'ControlOrMeta' ? 'Control' : m))
  const pressed = last === 'Space' ? '[Space]' : last === '{' || last === '[' ? last + last : `{${last}}`
  return `${modifiers.map((m) => `{${m}>}`).join('')}${pressed}${modifiers
    .reverse()
    .map((m) => `{/${m}}`)
    .join('')}`
}

// Text to type, with what userEvent reads as keys escaped.
const typed = (text: string) => text.replace(/[{[]/g, '$&$&')

// ---------------------------------------------------------------- the driver

export const testingLibrary: Driver<StoryContext, Target> = {
  ...capabilities,

  find(_, root, query) {
    const { label, search: find } = search(query)
    return new Target(root ? `${label} within the ${root.label}` : label, root, find)
  },

  async act(ctx, target, action: Action) {
    const el = await one(ctx, target, action.do !== 'hover' && action.do !== 'focus')
    switch (action.do) {
      case 'click':
        return userEvent.click(el)
      case 'double-click':
        return userEvent.dblClick(el)
      case 'hover':
        return userEvent.hover(el)
      case 'focus':
        return el.focus()
      case 'check':
      case 'uncheck': {
        const want = action.do === 'check'
        if (isChecked(el) !== want) await userEvent.click(el)
        if (isChecked(el) !== want) throw new SppError(`Clicked the ${target.label}, but it didn't ${action.do}`)
        return
      }
      case 'clear':
        return userEvent.clear(el)
      case 'fill':
        // All at once, as Playwright's fill does, rather than key by key.
        await userEvent.clear(el)
        if (action.text) await userEvent.paste(action.text)
        return
      case 'type':
        return userEvent.type(el, typed(action.text))
      case 'select':
        return userEvent.selectOptions(el, action.text)
      case 'press':
        el.focus()
        await userEvent.keyboard(keystroke(action.key))
        return
    }
  },

  async press(_, key) {
    await userEvent.keyboard(keystroke(key))
  },

  async expect(ctx, target, state, not, once) {
    const attempt = () => {
      const { holds, saw } = observe(ctx, target, state)
      if (holds !== null && holds !== not) return
      throw new SppError(`Expected the ${target.label} ${not ? 'not ' : ''}to ${phrase(state)}, but ${saw}`)
    }
    if (once) attempt()
    else await retry(attempt)
  },

  async all(ctx, target) {
    return target.in(page(ctx)).map((el, i) => fixed(el, `${target.label}, number ${i + 1}`))
  },

  retry(_, attempt) {
    return retry(attempt)
  },
}

export const settle = settler(testingLibrary)

// The words a play function can use.
export function storybook(parent: Env | null = null): Env {
  return storyWords(testingLibrary, parent)
}
