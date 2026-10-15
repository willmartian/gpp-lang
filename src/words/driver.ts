// What a backend does for the shared words: find things, act on them and
// check them. Playwright is one backend (backends/playwright); anything that
// can find things by role and accessible name, the way Testing Library does,
// can be another.
//
// A driver also says what it can do. The shared words are made from that
// (shared.ts), so a backend that can't hover has no Hover, and the checker
// says so before anything runs, without a device or a browser.

import type { Context } from '../language/types.ts'

// A name to look for: exact text, or a pattern for Containing.
export type Name = string | RegExp

export type QueryKind = 'label' | 'text' | 'placeholder' | 'alt' | 'title' | 'testId'

// How to find something. Names match exactly. A loose query matches part of
// the text, ignoring case, and takes the first match: what See "some text"
// looks for. A role query can match its name, the text inside it (for roles
// with no name: UNNAMED_ROLES in shared.ts), something found inside it, or
// none of these, to find every element with the role.
export type Query<H = unknown> =
  | { by: 'role'; role: string; name?: Name; text?: Name; has?: H }
  | { by: QueryKind; name: Name; loose?: boolean }

export type Action =
  | { do: 'click' | 'double-click' | 'hover' | 'focus' | 'check' | 'uncheck' | 'clear' }
  | { do: 'fill' | 'type' | 'select'; text: string }
  | { do: 'press'; key: string }

export type State =
  | { is: 'visible' | 'hidden' | 'checked' | 'enabled' | 'disabled' | 'focused' | 'empty' }
  | { is: 'value' | 'text' | 'containing'; text: Name }
  // Of everything a handle finds: their texts, in order, and how many there are.
  | { is: 'texts'; texts: string[] }
  | { is: 'count'; count: number }

export interface Capabilities {
  // The roles it can find things by, as ARIA spells them.
  roles: readonly string[]
  queries: readonly QueryKind[]
  actions: readonly Action['do'][]
  states: readonly State['is'][]
}

// C is the context words run with, like a page; H is a handle on something
// found, like a Playwright locator.
export interface Driver<C extends Context, H> extends Capabilities {
  // Handles are lazy, as Playwright's locators are: finding does nothing until
  // the handle is used, so Within and the deferred checks can hold onto one.
  // A null root means the whole screen.
  find(ctx: C, root: H | null, query: Query<H>): H
  act(ctx: C, target: H, action: Action): Promise<void>
  // A key pressed wherever focus is.
  press(ctx: C, key: string): Promise<void>
  // Retries until the state holds, or doesn't when not is true, or times out.
  // Once, it checks a single time instead, for retry to repeat.
  expect(ctx: C, target: H, state: State, not: boolean, once?: boolean): Promise<void>
  // Everything a handle finds, as it is now, without waiting.
  all(ctx: C, target: H): Promise<H[]>
  // Runs attempt until it doesn't throw, or times out as expect does, and then
  // throws what it last threw.
  retry(ctx: C, attempt: () => Promise<void>): Promise<void>
}
