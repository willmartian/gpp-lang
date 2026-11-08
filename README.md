# 🥒 Gherkin++

Gherkin++ is Gherkin without step definitions. In a step, capitalised words are code and
lowercase words are there for the reader.

```gherkin
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
    When I Fill the Field "Email" with "will@example.com"
    And I Fill the Field "Password" with "hunter2"
    And I Click the Button "Sign in"
    Then I should See the Heading "Welcome back"
```

`Click the Button "Sign in"` finds the button labelled "Sign in" and clicks it. Every step is
type-checked before it runs, so `When I Click "Sign in"` is an error in your editor rather than
a failing test.

There are no waits, conditionals or CSS selectors. That makes it a good format for agents to
write tests in: whoever reviews a spec only has to decide whether it tests the right thing.

Specs run as Playwright tests, Storybook play functions, or Vitest and Jest tests with
Testing Library.

## Getting started

You need Node.js 22.18 or later. With Playwright:

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

`gpp.config.ts`, at the root of your project, says which files each backend runs:

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

Add `.gpp-tests/` to `.gitignore`, put the example above in `features/sign-in.gpp`, and run
`npx playwright test`.

To test components instead, see [Storybook](docs/storybook.md) or
[Testing Library](docs/testing-library.md). A project can use several backends at once.

`npx gpp-lang check` checks every spec without running it, and `npx gpp-lang words` lists
the words you can use.

## Docs

- [Writing specs](docs/writing-specs.md)
- [Built-in words](docs/built-in-words.md)
- [Playwright](docs/playwright.md)
- [Storybook](docs/storybook.md)
- [Testing Library](docs/testing-library.md)
- [CLI and editors](docs/tools.md)

Backgrounds, Scenario Outlines, Rules, data tables and tags all work as they do in Cucumber.

[Contributing](CONTRIBUTING.md)
