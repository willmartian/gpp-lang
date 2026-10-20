# @spp-lang/storybook

Runs [Spec++](https://github.com/willmartian/spp-lang) `spp` templates as Storybook play
functions. Needs Storybook 10, with Vite.

```sh
npm install --save-dev spp-lang @spp-lang/storybook
```

```ts
// .storybook/main.ts
addons: ['@spp-lang/storybook']
```

```ts
// a story
import { spp } from '@spp-lang/storybook'

export const SavingADraft: Story = {
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

The project's `.spp` files of Defines work in every template. See
[Storybook](https://github.com/willmartian/spp-lang/blob/master/docs/storybook.md).
