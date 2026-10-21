// The words a Storybook play function has: the shared words (words/shared.ts)
// on core's Testing Library driver (words/dom.ts), with Testing Library as
// storybook/test gives it.
//
// Things are looked for in the whole document, not only in the story's
// canvas, so a dialog or menu rendered in a portal is found the way a user
// finds it. Checks and actions retry for as long as Testing Library's
// asyncUtilTimeout, so a story's configure() applies.
//
// Only userEvent is instrumented, so the Interactions panel shows each step
// and what it did, and not every query made while retrying.

import type { Context, Driver, Target } from '@gpp-lang/core'
import { domDriver } from '@gpp-lang/core'
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

// What the driver needs from a play function's context: the story's canvas.
export interface StoryContext extends Context {
  canvasElement: HTMLElement
}

export const testingLibrary: Driver<StoryContext, Target> = domDriver<StoryContext>({
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
  page: (ctx) => ctx.canvasElement.ownerDocument.body,
  onePage: 'A template plays on one page, already open',
})
