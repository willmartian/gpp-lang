/*
 * Gherkin++ that must fail, the way @gpp-lang/playwright's test/fixtures/broken.gpp must.
 * Each story passes only when its template fails with the message given.
 */

import type { Meta, StoryObj } from '@storybook/html-vite'
import { fn } from 'storybook/test'
import type { EditorArgs } from '../../../../examples/storybook/stories/editor.ts'
import { editor } from '../../../../examples/storybook/stories/editor.ts'
import type { Play } from '../../src/play.ts'
import { gpp } from '../../src/play.ts'

export default {
  title: 'Failures',
  render: (args) => editor(args),
  args: { title: '', tags: ['a', 'b'], onSave: fn() },
} satisfies Meta<EditorArgs>

type Story = StoryObj<EditorArgs>

/** A play function that passes only if play fails with this message. */
function fails(message: string, play: Play): Play {
  return async (context) => {
    try {
      await play(context)
    } catch (err) {
      if (err instanceof Error && err.message.includes(message)) return
      throw err
    }
    throw new Error(`Expected it to fail with "${message}", but it passed`)
  }
}

export const TheWrongText: Story = {
  play: fails(
    'Expected the status role to read "Published", but it reads "Draft saved"',
    gpp`
      When I Fill the Field "Title" with "Hello"
      And I Click the Button "Save"
      Then the Status should Read "Published"
    `,
  ),
}

export const NothingToClick: Story = {
  play: fails(
    'Looked for the button role named "Publish", but found nothing',
    gpp`
      When I Click the Button "Publish"
    `,
  ),
}

export const TwoToClick: Story = {
  play: fails(
    'found 2, and only one should match',
    gpp`
      When I Click the Button Containing "e"
    `,
  ),
}

export const NotHidden: Story = {
  play: fails(
    'Expected the heading role named "Edit post" to be hidden, but it is visible',
    gpp`
      Then the Heading "Edit post" should be Hidden
    `,
  ),
}

export const TheWrongOrder: Story = {
  play: fails(
    'Expected the listitem role to read "b", "a", but they read "a", "b"',
    gpp`
      Then the Listitem should Read
        | b |
        | a |
    `,
  ),
}

export const NotEachOne: Story = {
  play: fails(
    'Each Listitem Contain "a", but number 2 of 2 is Not Contain "a"',
    gpp`
      Then Each Listitem should Contain "a"
    `,
  ),
}

export const ADialogInAPortal: Story = {
  play: fails(
    'Expected the dialog role named "Delete post?" to be hidden, but it is visible',
    gpp`
      When I Click the Button "Delete"
      Then the Dialog "Delete post?" should be Hidden
    `,
  ),
}

export const NoKeyword: Story = {
  play: fails(
    'Each line of a gpp template is a step',
    gpp`
      I Click the Button "Save"
    `,
  ),
}

export const AnUnknownWord: Story = {
  play: fails(
    'Unknown word Clik. Did you mean Click?',
    gpp`
      When I Clik the Button "Save"
    `,
  ),
}

export const NoPageToVisit: Story = {
  play: fails(
    'Unknown word Visit',
    gpp`
      When I Visit "/"
    `,
  ),
}

export const AStepThatFails: Story = {
  play: fails(
    `Expected the status role to read "Published", but it reads ""

    Then the Status should Read "Published"
         ^`,
    gpp`
      Then the Status should Read "Published"
    `,
  ),
}
