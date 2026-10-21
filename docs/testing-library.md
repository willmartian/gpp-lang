# Testing Library

Runs a `gpp` template as tests, in Vitest or Jest, with
[Testing Library](https://testing-library.com). A template is a Feature, with one test per
Scenario. See [`examples/testing-library`](../examples/testing-library). For stories, see
[Storybook](storybook.md); for whole-app tests, [Playwright](playwright.md).

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

```sh
npm install --save-dev gpp-lang @gpp-lang/testing-library @testing-library/dom @testing-library/user-event
```

## Setup

A setup file says what `Render` renders with, here React Testing Library's `render`:

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

`gpp` declares tests with the `describe` and `test` globals, and Testing Library cleans up
with `afterEach`, so `globals` must be on.

### Jest

```js
// jest.config.js
testEnvironment: 'jsdom',
setupFilesAfterEnv: ['<rootDir>/gpp.setup.ts'],
transformIgnorePatterns: ['node_modules/(?!(gpp-lang|@gpp-lang|@cucumber)/)'],
```

Gherkin++ and `@cucumber/gherkin` are ES modules only, so Jest has to compile them, with a
Babel config that makes CommonJS, like `@babel/preset-env`'s. Jest also needs
`jest-environment-jsdom`.

## Templates

- **A template is a Feature:** a `describe`, with a test for each Scenario and each row of a
  Scenario Outline. Backgrounds, Rules and tables work as in any Feature.
- **`${…}` is only for `Render`.** It holds what your renderer takes, like a React element.
  Anywhere else, it's a mistake.
- **Each test starts empty,** so each Scenario, or its Background, Renders what it tests.
- **Mistakes fail the test before anything renders,** and failures point at the step in the
  test file.

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme` | `test.skip` |
| `@only` | `test.only` |
| `@fail` | `test.fails` in Vitest, `test.failing` in Jest |
| any other | added to the test's name, for `-t` |

## Words

The same [words](words.md), minus the [page ones](words.md#on-one-page), plus `Render`.

- **Searches cover the whole page,** so dialogs in portals are found.
- **Checks and actions retry** with Testing Library's `waitFor`, for its `asyncUtilTimeout`
  (one second by default).
- **Hidden means hidden by CSS** in jsdom and happy-dom, which have no layout.

## Defines

Templates use the project's [Defines](defines.md#where-they-work): those in `.gpp` files
and Markdown under the nearest `package.json` above the test file.

## Checking

`gpp-lang check` checks templates in `.js`, `.ts`, `.jsx` and `.tsx` files, as the
[language server](tools.md#language-server) does as you type.
