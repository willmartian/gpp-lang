# 🥒 Gherkin++

Gherkin without step definitions. Capitalised words are code, and type-checked.

```gherkin
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
    When I Fill the Field "Email" with "will@example.com"
    And I Fill the Field "Password" with "hunter2"
    And I Click the Button "Sign in"
    Then I should See the Heading "Welcome back"
```

No waits, conditionals or CSS selectors, so agents can write it and people can review it.

## Install

Needs Node.js 22.18+.

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

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

Gitignore `.gpp-tests/`, then `npx playwright test`.

## Docs

- [Writing specs](docs/writing-specs.md)
- [Built-in words](docs/built-in-words.md)
- [CLI and editors](docs/tools.md)
- [Playwright](docs/playwright.md)
- [Storybook](docs/storybook.md)
- [Testing Library](docs/testing-library.md)

[Contributing](CONTRIBUTING.md)
