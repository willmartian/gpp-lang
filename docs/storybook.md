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

Run stories as tests with
[Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).

## Templates

- Steps only: no `Feature:` or `Scenario:`.
- No `${…}`. Write values out.
- Mistakes fail the story before it runs.
- [Defines](writing-specs.md#where-defines-work) work. Edit one and stories reload.

## Behaviour

- Queries search the whole page, so portals are found.
- Checks and actions retry for `asyncUtilTimeout` (1s by default).
- `Fill` sets text at once. `Type` types key by key.

Example: [`examples/storybook`](../examples/storybook).
