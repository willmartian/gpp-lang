# Playwright

Runs Features against your app. One test per Scenario.

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

## Setup

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { playwright } from '@gpp-lang/playwright/config'

export default defineConfig({
  backends: [playwright({ files: ['features/**/*.gpp'] })],
})
```

`files` defaults to every `.gpp` file, and every Markdown file with a ` ```gpp ` block.

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineGppConfig } from '@gpp-lang/playwright'
import gpp from './gpp.config.ts'

export default defineConfig({
  ...defineGppConfig(gpp), // writes tests to .gpp-tests/, or { outputDir }
  use: { baseURL: 'http://localhost:3000' },
})
```

Gitignore `.gpp-tests/`. Projects, retries, sharding, UI mode and traces all work.

## Running

```sh
npx playwright test                          # everything
npx playwright test features/sign-in.gpp:12  # the scenario on line 12
npx playwright test --grep @smoke            # scenarios tagged @smoke
```

`@skip`, `@fixme`, `@fail`, `@slow` and `@only` work as in Playwright. Other tags are
Playwright tags.

## Words

```gherkin
Given I Visit "/settings"
When I Reload
And I go Back
Then I should be At "/"
And the page should be Titled "Home"
```

## Markdown

` ```gpp ` blocks in Markdown run as tests.

````markdown
Signing in takes an email and a password.

```gpp
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
```

With the wrong password, you stay where you are:

```gpp
  Scenario: The wrong password
    Given I Visit "/"
```
````

| Block starts with | Is |
| --- | --- |
| `Feature:` | a new Feature |
| `Scenario:` or a step | more of the Feature above |
| anything else | Defines |

` ```gpp ignore ` blocks are shown, not run. `npx playwright test README.md:12` works.
Example: [`examples/demo/features/README.md`](../examples/demo/features/README.md).
