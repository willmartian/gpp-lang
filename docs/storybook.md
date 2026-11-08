# Storybook

A `gpp` template as a story's
[play function](https://storybook.js.org/docs/writing-stories/play-function).

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

export default defineConfig({ backends: [storybook()] }) // *.stories.*, or { files }
```

## Writing

- Steps only: no `Feature:` or `Scenario:`.
- No `${…}`. Write values out.
- [Defines](writing-specs.md#where-defines-work) work.

## Running

Open the story, or run stories as tests with
[Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).

## Tags

None. Use the story's own `tags`.

## Behaviour

- No words of its own.
- Queries search the whole page, so portals are found.
- Checks and actions retry for `asyncUtilTimeout`.

Example: [`examples/storybook`](../examples/storybook).
