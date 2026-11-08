# Testing Library

The Testing Library backend runs a `gpp` template as tests in Vitest or Jest, using
[Testing Library](https://testing-library.com). Each template is a Feature, and each Scenario
is a test.

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

export default defineConfig({ backends: [testingLibrary()] })
```

By default it covers every `*.test.*` and `*.spec.*` file. Pass `files` to narrow that down.

A setup file tells `Render` how to render. With React Testing Library:

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
  globals: true, // gpp uses the describe, test and afterEach globals
  setupFiles: ['gpp.setup.ts'],
}
```

### Jest

Install `jest-environment-jsdom`, and a Babel config that compiles to CommonJS, such as
`@babel/preset-env`. Gherkin++ is ES modules only, so Jest has to compile it.

```js
// jest.config.js
testEnvironment: 'jsdom',
setupFilesAfterEnv: ['<rootDir>/gpp.setup.ts'],
transformIgnorePatterns: ['node_modules/(?!(gpp-lang|@gpp-lang|@cucumber)/)'],
```

## Templates

A template becomes a `describe`, with a test for each Scenario and for each row of a Scenario
Outline. Backgrounds, Rules and tables work as they do anywhere else.

Every test starts with nothing rendered, so each Scenario or its Background has to `Render`
something. `${…}` is only allowed after `Render`, and holds whatever your render function
takes, like a React element.

If a template has a mistake, the test fails before anything renders, and the error points at
the step in your test file. Templates can use the project's
[Defines](writing-specs.md#where-defines-work).

## Tags

`@skip` and `@fixme` become `test.skip`, and `@only` becomes `test.only`. `@fail` becomes
`test.fails` in Vitest and `test.failing` in Jest. Any other tag is added to the test's name,
so you can pick it out with `-t`.

## Differences from Playwright

Testing Library files can't use Playwright's page words, and get `Render` instead.

Queries search the whole document, so dialogs rendered in portals are found. Checks and actions
retry with `waitFor` until Testing Library's `asyncUtilTimeout`, which is one second by
default. jsdom and happy-dom don't do layout, so `Hidden` only sees elements hidden by CSS.

See [`examples/testing-library`](../examples/testing-library) for a working project.
