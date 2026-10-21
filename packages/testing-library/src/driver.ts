// The words a test's gpp template has: the shared words on core's Testing
// Library driver (words/dom.ts), with the project's own @testing-library/dom
// and user-event, so a renderer's Testing Library, like React's, wraps what
// they do as it needs to.
//
// Things are looked for in the whole document, as a user finds them, portals
// and all. Checks and actions retry with Testing Library's waitFor, so they
// last as long as its asyncUtilTimeout, and work with Jest's fake timers.
//
// Render hands what a template's ${…} holds to the renderer from renderWith,
// which a test puts in its steps' context.

import type { Context, Driver, Target } from '@gpp-lang/core'
import { domDriver, GppError } from '@gpp-lang/core'
import {
  getConfig,
  queryAllByAltText,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByRole,
  queryAllByTestId,
  queryAllByText,
  queryAllByTitle,
  waitFor,
} from '@testing-library/dom'
import { userEvent } from '@testing-library/user-event'

// Renders a component, as a Testing Library's render does, like
// @testing-library/react's. It's given whatever a test's ${…} hold, which
// nothing checks, so it can take anything.
export type Renderer = (ui: never) => unknown

let renderer: Renderer | null = null

// What Render renders with, for every test. A setup file calls it:
//
//     import { render } from '@testing-library/react'
//     renderWith(render)
export function renderWith(render: Renderer): void {
  renderer = render
}

export const testingLibrary: Driver<Context, Target> = domDriver<Context>({
  library: {
    getConfig,
    queryAllByAltText,
    queryAllByLabelText,
    queryAllByPlaceholderText,
    queryAllByRole,
    queryAllByTestId,
    queryAllByText,
    queryAllByTitle,
    userEvent,
  },
  page: () => document.body,
  // As it timed out, not with the page printed after it.
  async retry(attempt) {
    await waitFor(attempt, { onTimeout: (err) => err })
  },
})

// What Render does, with the renderer from renderWith.
export async function render(ui: unknown): Promise<void> {
  if (!renderer) throw new GppError('Render needs a renderer: call renderWith in a setup file')
  // Whatever the test put in its ${…}, which only the renderer can know.
  await renderer(ui as never)
}
