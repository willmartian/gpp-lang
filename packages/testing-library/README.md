# @gpp-lang/testing-library

Runs [Gherkin++](https://github.com/willmartian/gpp-lang) `gpp` templates as Vitest or Jest
tests, rendering components with Testing Library.

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
// a setup file
import { renderWith } from '@gpp-lang/testing-library'
import { render } from '@testing-library/react'

renderWith(render)
```

```tsx
// a test
import { gpp } from '@gpp-lang/testing-library'

gpp`
  Feature: The editor

    Scenario: Saving a draft
      Given I Render ${<Editor title="" />}
      When I Fill the Field "Title" with "Hello"
      And I Click the Button "Save"
      Then the Status should Read "Draft saved"
`
```

[Docs](https://github.com/willmartian/gpp-lang/blob/master/docs/testing-library.md).
