# Playwright

`@spp-lang/playwright` runs Features as Playwright tests, against your running app. Each
Scenario is a test, in a browser of its own. For steps that run against one component, see
[Storybook](storybook.md); a project can use both.

```sh
npm install --save-dev spp-lang @spp-lang/playwright @playwright/test
npx playwright install chromium
```

## Config

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineSppConfig } from '@spp-lang/playwright'

export default defineConfig({
  ...defineSppConfig({ features: ['features'], ignore: ['features/drafts'] }),
  use: { baseURL: 'http://localhost:3000' },
})
```

| Option | Default | Is |
| --- | --- | --- |
| `features` | everything under `root` | where the `.spp` files and Markdown are |
| `ignore` | nothing | files and directories to leave out |
| `outputDir` | `.spp-tests` | where the generated tests go |
| `root` | the config's directory | what the paths are relative to |

- Each time Playwright loads its config, `defineSppConfig` writes a small test per `.spp`
  file to `outputDir`. They only list the scenarios, so they can't go out of date. Add
  `outputDir` to `.gitignore`.
- The rest of Playwright works as usual: projects, retries, sharding, UI mode and the trace
  viewer. Failures point at the word in the `.spp` file that failed.
- For sets of features with words of their own, give each Playwright project its own
  `defineSppConfig` and `outputDir`.

## Running

```sh
npx playwright test                         # every scenario
npx playwright test features/sign-in.spp:12 # the scenario on line 12
npx playwright test --grep @smoke           # the scenarios tagged @smoke
```

Playwright runs a `defineSppConfig`'s `features`, with the [Defines](defines.md) in them.

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme`, `@fail`, `@slow`, `@only` | what it does in Playwright |
| any other | a Playwright tag, for `--grep` |

## Markdown

` ```spp ` blocks in Markdown files run as tests, like Rust's doctests, so your docs' examples
stay true. See [`examples/demo/features/README.md`](../examples/demo/features/README.md).

| Block | Is |
| --- | --- |
| starts with `Feature:` | a new Feature |
| starts with `Scenario:` or a step | more of the Feature above it |
| anything else | Defines, which every file can use |
| ` ```spp ignore ` | shown, never run |

````markdown
Signing in takes an email and a password.

```spp
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
```

With the wrong password, you stay where you are:

```spp
  Scenario: The wrong password
    Given I Visit "/"
```
````

- Only Markdown files with a ` ```spp ` block are part of the project.
- `npx playwright test README.md:12` runs the scenario on line 12.
- Mistakes point at lines in the Markdown file.
