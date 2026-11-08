# Storybook

The Storybook backend turns a `gpp` template into a story's
[play function](https://storybook.js.org/docs/writing-stories/play-function). The story's
args set it up and the template says what to do with it.

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

## Setup

You need Storybook 10.

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

By default it covers every `*.stories.*` file. Pass `files` to narrow that down.

To run stories as tests, use
[Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).

## Templates

A template is a list of steps, without `Feature:` or `Scenario:`. Data tables and DocStrings
work. `${…}` doesn't, so write values out even if they repeat the args.

If a template has a mistake, the story fails before anything is clicked, and the error points
at the word. The Interactions panel shows each step as it runs.

Templates can use the project's [Defines](writing-specs.md#where-defines-work). Play
functions can't read files, so the addon bundles the Defines when Storybook builds, and
reloads stories when you edit one. Any `Feature:` in those files is ignored here; only
Playwright runs it.

## Differences from Playwright

Storybook has only the shared words, since the story is already rendered on an open page.

Queries search the whole page, not just the story's root, so dialogs rendered in portals are
found. Checks and actions retry until Testing Library's `asyncUtilTimeout`, which is one second
by default. `Fill` sets a field's text in one go, as Playwright does, and `Type` types it a
key at a time.

See [`examples/storybook`](../examples/storybook) for a working project.
