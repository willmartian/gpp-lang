# Playwright

Runs Features against your app, one Playwright test per Scenario. For component tests, see
[Storybook](storybook.md).

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

## Config

`gpp.config.ts` says which files Playwright runs. They have the shared words and
[Playwright's own](words.md#each-backends-words), for the page.

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { playwright } from '@gpp-lang/playwright/config'

export default defineConfig({ backends: [playwright({ files: ['features/**/*.gpp'] })] })
```

`files` are globs from the config's directory. By default, every `.gpp` file and Markdown file.
The Playwright config hands the gpp config to `defineGppConfig`:

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

| Option | Default | Is |
| --- | --- | --- |
| `outputDir` | `.gpp-tests` | where the generated tests go, from the gpp config's directory |

- `defineGppConfig` writes a stub test per `.gpp` file to `outputDir` when Playwright loads
  its config. Stubs only list scenarios, so they never go stale. Gitignore `outputDir`.
- Projects, retries, sharding, UI mode and the trace viewer all work. Failures point at the
  word that failed.
- For sets of features with words of their own, give each its own `gpp.config.ts`, and its
  Playwright project its own `defineGppConfig`.

## Running

```sh
npx playwright test                         # every scenario
npx playwright test features/sign-in.gpp:12 # the scenario on line 12
npx playwright test --grep @smoke           # the scenarios tagged @smoke
```

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme`, `@fail`, `@slow`, `@only` | what it does in Playwright |
| any other | a Playwright tag, for `--grep` |

## Markdown

` ```gpp ` blocks in Markdown run as tests, like Rust's doctests. See [`examples/demo/features/README.md`](../examples/demo/features/README.md).

| Block | Is |
| --- | --- |
| starts with `Feature:` | a new Feature |
| starts with `Scenario:` or a step | more of the Feature above it |
| anything else | Defines, which every file can use |
| ` ```gpp ignore ` | shown, never run |

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

- Only Markdown files with a ` ```gpp ` block are part of the project.
- `npx playwright test README.md:12` runs the scenario on line 12.
- Mistakes point at lines in the Markdown file.
