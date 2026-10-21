import { gpp } from '@gpp-lang/testing-library'
import { Editor } from './Editor.tsx'

const onSave = () => {}

gpp`
  Feature: The editor

    Scenario: Saving a draft
      Given I Render ${<Editor title="" tags={[]} onSave={onSave} />}
      When I Fill the Field "Title" with "Hello"
      And I Click the Button "Save"
      Then the Status should Read "Draft saved"
      And I should Not See the Alert Containing "title"

    Scenario: A title is required
      Given I Render ${<Editor title="" tags={[]} onSave={onSave} />}
      When I Click the Button "Save"
      Then I should See the Alert Containing "Give it a title"
      And the Status should be Empty

    Scenario: Tags
      Given I Render ${<Editor title="" tags={['news', 'draft', 'urgent']} onSave={onSave} />}
      Then the Listitem Within the List "Tags" should Read
        | news   |
        | draft  |
        | urgent |
      And I should Count 3 Listitem

    Scenario Outline: An existing title, <title>
      Given I Render ${<Editor title="Hello" tags={[]} onSave={onSave} />}
      Then the Field "Title" should have the Value "Hello"
      When I Retitle the post "<title>"
      Then the Field "Title" should have the Value "<title>"

      Examples:
        | title   |
        | Goodbye |
        | Hi      |

    Scenario: Confirming a delete
      Given I Render ${<Editor title="" tags={[]} onSave={onSave} />}
      When I Click the Button "Delete"
      Then I should See the Dialog "Delete post?"
      When I Click the Button "Cancel" Within the Dialog "Delete post?"
      Then I should Not See the Dialog "Delete post?"
`
