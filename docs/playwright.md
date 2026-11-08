# Playwright

The Playwright backend runs Features against your app, with one Playwright test per Scenario.

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

`files` are globs relative to `gpp.config.ts`. Leave it out to run every `.gpp` file and every
Markdown file with a ` ```gpp ` block in it.

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

`defineGppConfig` writes a small test file for each spec into `.gpp-tests/`, which you should
add to `.gitignore`. Pass `{ outputDir }` as its second argument to put them somewhere else.

Everything else about Playwright works as usual: projects, retries, sharding, UI mode and the
trace viewer. If you have groups of features that need different Defines, give each group its
own `gpp.config.ts` and its own Playwright project.

## Running

```sh
npx playwright test                          # everything
npx playwright test features/sign-in.gpp:12  # the scenario on line 12
npx playwright test --grep @smoke            # scenarios tagged @smoke
```

`@skip`, `@fixme`, `@fail`, `@slow` and `@only` do what they do in Playwright. Any other tag
becomes a Playwright tag you can `--grep` for.

## Words

Besides the shared words, Playwright files can use `Visit`, `Reload` and `Back` to move
around, and `At` and `Titled` to check the page's URL and title:

```gherkin
Given I Visit "/settings"
Then I should be At "/settings"
And the page should be Titled "Settings"
```

## Markdown

` ```gpp ` blocks in Markdown files run as tests, the way Rust's doctests do. A block that
starts with `Feature:` begins a new Feature. A block that starts with `Scenario:` or a step
carries on the Feature above it. Anything else is Defines. Write ` ```gpp ignore ` for a
block that's shown but never run.

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

Line numbers and errors refer to the Markdown file, so `npx playwright test README.md:12`
works. [`examples/demo/features/README.md`](../examples/demo/features/README.md) is a full
example.
