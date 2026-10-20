# Storybook

An `spp` template is a story's [play function](https://storybook.js.org/docs/writing-stories/play-function).
The story is the scenario: its args set it up, and the template is its steps. See
[`examples/storybook`](../examples/storybook). For Features that run against your whole app,
see [Playwright](playwright.md); a project can use both.

```ts
import { spp } from '@spp-lang/storybook'

export const SavingADraft: Story = {
  args: { title: '' },
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

Needs Storybook 10.

```sh
npm install --save-dev spp-lang @spp-lang/storybook
```

Add it to `.storybook/main.ts` as an addon:

```ts
addons: ['@spp-lang/storybook']
```

- **Each line is a step**, starting with Given, When, Then, And, But or `*`. Tables and
  DocStrings go under a step, as in a Scenario. There's no `Feature:` or `Scenario:` line.
- **The Interactions panel** shows each step, with what it did under it.
- **Mistakes fail the story before anything is clicked,** with the step and a caret under the
  word.
- **There's no `${…}`.** What a spec checks is written out, so it reads as it runs. Repeat the
  text that's in the args.
- **Stories run as tests** with [Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon),
  like any other play function.

## Words

The [words](words.md) are the same, less the ones for a page: a template plays
[on one page](words.md#on-one-page), already open.

- **Things are looked for in the whole page,** not only the story's canvas, so a dialog in a
  portal is found as a user finds it.
- **Checks and actions retry** for as long as Testing Library's `asyncUtilTimeout`, a second
  unless you `configure` it.
- **`Fill` puts the text in at once,** as Playwright does, and `Type` types it key by key.

## Defines

[Defines](defines.md) go in the project's `.spp` files, under the nearest `package.json`
([Where they work](defines.md#where-they-work)), and every template can use them. The addon reads them as
Storybook builds, since a play function runs in a browser, which can't, and changing one
reloads the stories. A `Feature:` in one is Playwright's to run.

## Checking

`spp-lang check` checks every template in a project's `.js` and `.ts` files, with the words
above and the project's Defines, and says where each mistake is in the stories file.

The [language server](tools.md#language-server) does the same as you type, and hover, completion, go to
definition and references work inside templates. VS Code's extension also highlights them as
Spec++.
