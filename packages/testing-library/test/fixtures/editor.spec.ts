// The plain DOM editor Storybook's example tests, tested in jsdom instead.
import { editor } from '../../../../examples/storybook/stories/editor.ts'
import { gpp } from '../../src/index.ts'

const onSave = () => {}

gpp`
  Feature: The editor

    Scenario: Saving a draft
      Given I Render ${() => editor({ title: '', tags: ['news'], onSave })}
      When I Fill the Field "Title" with "Hello"
      And I Click the Button "Save"
      Then the Status should Read "Draft saved"
      And I should Not See the Alert

    Scenario: Saving with no title
      Given I Render ${() => editor({ title: '', tags: [], onSave })}
      When I Click the Button "Save"
      Then the Alert should Read "Give it a title"

    Scenario: A title to start with
      Given I Render ${() => editor({ title: 'Old', tags: ['news', 'draft'], onSave })}
      Then the Field "Title" should have the Value "Old"
      And the Listitem should Read
        | news  |
        | draft |

    Scenario: The confirmation, in a portal
      Given I Render ${() => editor({ title: '', tags: [], onSave })}
      When I Click the Button "Delete"
      Then I should See the Dialog "Delete post?"
      When I Click the Button "Cancel" Within the Dialog "Delete post?"
      Then I should Not See the Dialog "Delete post?"

    @skip
    Scenario: Skipped, so it never runs
      Given I Render ${() => editor({ title: '', tags: [], onSave })}
      Then the Status should Read "Never"

    @fail
    Scenario: Failing, as it says it will
      Given I Render ${() => editor({ title: '', tags: [], onSave })}
      Then the Status should Read "Never"

    @smoke
    Scenario: Tagged, with the tag in its name
      Given I Render ${() => editor({ title: '', tags: [], onSave })}
      Then I should See the Heading "Edit post"
`
