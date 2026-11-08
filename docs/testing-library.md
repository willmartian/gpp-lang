# Testing Library

A `gpp` template as Vitest or Jest tests, with [Testing Library](https://testing-library.com).
One test per Scenario.

```tsx
// Editor.test.tsx
import { gpp } from '@gpp-lang/testing-library'
import { Editor } from './Editor'

gpp`
  Feature: The editor

    Scenario: Saving a draft
      Given I Render ${<Editor title="" />}
      When I Fill the Field "Title" with "Hello"
      And I Click the Button "Save"
      Then the Status should Read "Draft saved"
`
```

## Setup

```sh
npm install --save-dev gpp-lang @gpp-lang/testing-library @testing-library/dom @testing-library/user-event
```

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { testingLibrary } from '@gpp-lang/testing-library/config'

export default defineConfig({ backends: [testingLibrary()] }) // *.test.*, *.spec.*, or { files }
```

```ts
// gpp.setup.ts
import { renderWith } from '@gpp-lang/testing-library'
import { render } from '@testing-library/react'

renderWith(render)
```

### Vitest

```ts
// vitest.config.ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['gpp.setup.ts'],
}
```

### Jest

Needs `jest-environment-jsdom` and a Babel config that outputs CommonJS.

```js
// jest.config.js
testEnvironment: 'jsdom',
setupFilesAfterEnv: ['<rootDir>/gpp.setup.ts'],
transformIgnorePatterns: ['node_modules/(?!(gpp-lang|@gpp-lang|@cucumber)/)'],
```

## Templates

- Each test starts empty. `Render` something in each Scenario or the Background.
- `${…}` only after `Render`.
- Mistakes fail the test before it renders.
- [Defines](writing-specs.md#where-defines-work) work.

## Tags

| Tag | Is |
| --- | --- |
| `@skip`, `@fixme` | `test.skip` |
| `@only` | `test.only` |
| `@fail` | `test.fails` (Vitest), `test.failing` (Jest) |
| other | part of the test name, for `-t` |

## Behaviour

- Queries search the whole document, so portals are found.
- Checks and actions retry for `asyncUtilTimeout` (1s by default).
- jsdom has no layout, so `Hidden` only sees CSS.

Example: [`examples/testing-library`](../examples/testing-library).
