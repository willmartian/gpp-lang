# @spp-lang/storybook

[Spec++](https://github.com/willmartian/spp-lang) as Storybook play functions.

```sh
npm install --save-dev spp-lang @spp-lang/storybook
```

```ts
import { spp } from '@spp-lang/storybook'

export const SavingADraft: Story = {
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

Needs Storybook 10. See [Storybook](https://github.com/willmartian/spp-lang/blob/master/docs/storybook.md).
