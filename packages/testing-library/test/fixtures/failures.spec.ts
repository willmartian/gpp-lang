/*
 * Tests' gpp templates that must fail, the way @gpp-lang/playwright's
 * test/fixtures/broken.gpp must. Each scenario passes only when it fails with
 * the message in its name.
 */

import { expect, test } from 'vitest'
import { editor } from '../../../../examples/storybook/stories/editor.ts'
import { checked, mistake, play, read } from '../../src/feature.ts'

/** Like gpp, but each test passes only if its scenario fails with its name. */
function fails(strings: TemplateStringsArray, ...values: unknown[]): void {
  const { read: template, problem } = read(strings.raw)
  if (problem !== null) throw new Error(problem)
  const report = checked(template, [])
  for (const scenario of template.file.features.flatMap((f) => f.scenarios)) {
    test(scenario.name, async () => {
      const wrong = mistake(template, report, scenario)
      if (wrong !== null) expect(wrong.message).toContain(scenario.name)
      else await expect(play(scenario, [], values)).rejects.toThrow(scenario.name)
    })
  }
}

const empty = () => editor({ title: '', tags: ['a', 'b'], onSave: () => {} })

fails`
  Feature: Failures

    Scenario: Expected the status role to read "Published", but it reads "Draft saved"
      Given I Render ${empty}
      When I Fill the Field "Title" with "Hello"
      And I Click the Button "Save"
      Then the Status should Read "Published"

    Scenario: Looked for the button role named "Publish", but found nothing
      Given I Render ${empty}
      When I Click the Button "Publish"

    Scenario: found 2, and only one should match
      Given I Render ${empty}
      When I Click the Button Containing "e"

    Scenario: Render was given object, not a function that makes an element
      Given I Render ${{ not: 'a function' }}

    Scenario: Click expected something on the page, but got a
      When I Click ${empty}
`
