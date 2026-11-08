# Testing Library

```sh
npm install --save-dev gpp-lang @gpp-lang/testing-library @testing-library/dom @testing-library/user-event
```

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { testingLibrary } from '@gpp-lang/testing-library/config'

export default defineConfig({ backends: [testingLibrary()] })
```

```ts
// gpp.setup.ts
import { renderWith } from '@gpp-lang/testing-library'
import { render } from '@testing-library/react'

renderWith(render)
```

```ts
// vitest.config.ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['gpp.setup.ts'],
}
```

```js
// jest.config.js
testEnvironment: 'jsdom',
setupFilesAfterEnv: ['<rootDir>/gpp.setup.ts'],
transformIgnorePatterns: ['node_modules/(?!(gpp-lang|@gpp-lang|@cucumber)/)'],
```

## Writing

A template is a Feature. `${…}` is what `Render` renders.

```tsx
// Editor.test.tsx
import { gpp } from '@gpp-lang/testing-library'
import { Editor } from './Editor'

gpp`
  Feature: The editor

    Scenario: Saving a draft
      Given I Render ${<Editor title="" />}
      When I Click the Button "Save"
      Then the Status should Read "Draft saved"
`
```

[Example](../examples/testing-library).
