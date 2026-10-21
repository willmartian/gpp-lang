# Storybook

A `gpp` template is a story's [play function](https://storybook.js.org/docs/writing-stories/play-function).
The args set the story up; the template is its steps. See
[`examples/storybook`](../examples/storybook). For whole-app tests, see
[Playwright](playwright.md); for components in Vitest or Jest, [Testing Library](testing-library.md).

```ts
import { gpp } from '@gpp-lang/storybook'

export const SavingADraft: Story = {
  args: { title: '' },
  play: gpp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

Needs Storybook 10.

```sh
npm install --save-dev gpp-lang @gpp-lang/storybook
```

```ts
// .storybook/main.ts
addons: ['@gpp-lang/storybook']
```

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { storybook } from '@gpp-lang/storybook/config'

export default defineConfig({ backends: [storybook()] })
```

`storybook()` runs every `*.stories.*` file, or the globs in its `files`.

- **Each line is a step,** starting with Given, When, Then, And, But or `*`. Tables and
  DocStrings work. No `Feature:` or `Scenario:` line.
- **The Interactions panel** shows each step and what it did.
- **Mistakes fail the story before anything is clicked,** with a caret under the word.
- **No `${…}`.** Write values out, even when they repeat the args.
- **Stories run as tests** with [Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).

## Words

The shared [words](words.md), and [none of its own](words.md#each-backends-words).

- **Searches cover the whole page,** not just the canvas, so dialogs in portals are found.
- **Checks and actions retry** for Testing Library's `asyncUtilTimeout` (one second by default).
- **`Fill` sets the text at once,** as in Playwright. `Type` types it key by key.

## Defines

- Templates use the project's [Defines](defines.md#where-they-work), from its `.gpp` files.
- The addon bundles them at build time, since play functions can't read files. Editing one
  reloads the stories.
- A `Feature:` in those files only runs under Playwright.

## Checking

`gpp-lang check` checks templates in `.js` and `.ts` files. The
[language server](tools.md#language-server) checks them as you type, with hover, completion,
go to definition and references. VS Code highlights them.
