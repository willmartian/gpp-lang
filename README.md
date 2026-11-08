# 🥒 Gherkin++

Gherkin without step definitions. Capitalised words are code.

```gherkin
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
    When I Fill the Field "Email" with "will@example.com"
    And I Fill the Field "Password" with "hunter2"
    And I Click the Button "Sign in"
    Then I should See the Heading "Welcome back"
```

Steps are type-checked before they run. No waits, conditionals or CSS selectors, so agents
can write them and people can review them.

Runs on Playwright, Storybook, or Vitest and Jest with Testing Library.

## Getting started

Needs Node.js 22.18+. With Playwright:

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

`gpp.config.ts`, at your project root, says which files each backend runs:

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { playwright } from '@gpp-lang/playwright/config'

export default defineConfig({
  backends: [playwright({ files: ['features/**/*.gpp'] })],
})
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineGppConfig } from '@gpp-lang/playwright'
import gpp from './gpp.config.ts'

export default defineConfig({
  ...defineGppConfig(gpp),
  use: { baseURL: 'http://localhost:3000' },
})
```

Gitignore `.gpp-tests/`, save the example as `features/sign-in.gpp`, then
`npx playwright test`. For components, see [Storybook](docs/storybook.md) or
[Testing Library](docs/testing-library.md).

## Docs

- [Writing specs](docs/writing-specs.md)
- [Built-in words](docs/built-in-words.md)
- [Playwright](docs/playwright.md)
- [Storybook](docs/storybook.md)
- [Testing Library](docs/testing-library.md)
- [CLI and editors](docs/tools.md)

[Contributing](CONTRIBUTING.md)
