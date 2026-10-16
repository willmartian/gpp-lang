# @spp-lang/storybook

Runs [Spec++](https://github.com/willmartian/spp-lang) `spp` templates as Storybook play
functions. Needs Storybook 10, with Vite.

```sh
npm install --save-dev spp-lang @spp-lang/storybook
```

```ts
// spp.config.ts
import storybook from '@spp-lang/storybook'
import { defineConfig } from 'spp-lang'

export default defineConfig({ backends: [storybook({ files: ['src'] })] })
```

```ts
// .storybook/main.ts
import { sppStories } from '@spp-lang/storybook'
import spp from '../spp.config.ts'

export default { ...sppStories(spp), framework: '@storybook/react-vite', stories: ['../src/**/*.stories.tsx'] }
```

```ts
// a story
import { spp } from '@spp-lang/storybook/play'

export const SavingADraft: Story = {
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

See [Storybook](https://github.com/willmartian/spp-lang/blob/master/docs/storybook.md).
