# Storybook

An `spp` template is a story's [play function](https://storybook.js.org/docs/writing-stories/play-function).
The story is the scenario: its args set it up, and the template is its steps. See
[`examples/storybook`](../examples/storybook).

```ts
import { spp } from 'spp-lang/storybook'

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
npm install --save-dev spp-lang
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

The [words](words.md) are the same, less the ones for a page: a story is one page, already open,
so there's no `Visit`, `Reload`, `Back`, `At` or `Titled`.

- **Things are looked for in the whole page,** not only the story's canvas, so a dialog in a
  portal is found as a user finds it.
- **Checks and actions retry** for as long as Testing Library's `asyncUtilTimeout`, a second
  unless you `configure` it.
- **`Fill` puts the text in at once,** as Playwright does, and `Type` types it key by key.

## Defines

[Defines](defines.md) for every template go in `.spp` files of their own, loaded in
`.storybook/preview.ts`:

```ts
import { useWords } from 'spp-lang/storybook'

useWords(import.meta.glob('../words/*.spp', { query: '?raw', import: 'default', eager: true }))
```

A file with a `Feature:` in it is a mistake: scenarios are templates.

## Not yet

- `spp-lang check` and the language server don't read templates yet, so their mistakes show
  when the story plays.
- Editors show a template as a plain string.
