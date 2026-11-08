# Storybook

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

## Writing

A template is a play function. Steps only, no `${…}`.

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

[Example](../examples/storybook).
