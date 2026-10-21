# @gpp-lang/storybook

Runs [Gherkin++](https://github.com/willmartian/gpp-lang) `gpp` templates as Storybook play
functions. Needs Storybook 10, with Vite.

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

```ts
// a story
import { gpp } from '@gpp-lang/storybook'

export const SavingADraft: Story = {
  play: gpp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

[Docs](https://github.com/willmartian/gpp-lang/blob/master/docs/storybook.md).
