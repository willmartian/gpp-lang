import { spp } from '@spp-lang/storybook/play'
import type { Meta, StoryObj } from '@storybook/html-vite'
import { fn } from 'storybook/test'
import type { EditorArgs } from './editor.ts'
import { editor } from './editor.ts'

const meta = {
  title: 'Editor',
  render: (args) => editor(args),
  args: { title: '', tags: [], onSave: fn() },
} satisfies Meta<EditorArgs>
export default meta

type Story = StoryObj<EditorArgs>

export const Empty: Story = {}

export const SavingADraft: Story = {
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
    And I should Not See the Alert Containing "title"
  `,
}

export const TitleIsRequired: Story = {
  play: spp`
    When I Click the Button "Save"
    Then I should See the Alert Containing "Give it a title"
    And the Status should be Empty
  `,
}

export const Tags: Story = {
  args: { tags: ['news', 'draft', 'urgent'] },
  play: spp`
    Then the Listitem Within the List "Tags" should Read
      | news   |
      | draft  |
      | urgent |
    And I should Count 3 Listitem
  `,
}

export const AnExistingTitle: Story = {
  args: { title: 'Hello' },
  play: spp`
    Then the Field "Title" should have the Value "Hello"
    When I Clear the Field "Title"
    Then the Field "Title" should be Empty
  `,
}

export const UsingADefine: Story = {
  play: spp`
    When I Retitle the post "Hello"
    And I Press "Enter" in the Field "Title"
    Then I should See "Draft saved"
  `,
}

export const ConfirmingADelete: Story = {
  play: spp`
    When I Click the Button "Delete"
    Then I should See the Dialog "Delete post?"
    When I Click the Button "Cancel" Within the Dialog "Delete post?"
    Then the Dialog "Delete post?" should be Hidden
  `,
}
