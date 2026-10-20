# Playwright

`@gpp-lang/playwright` runs Features as Playwright tests, against your running app. Each
Scenario is a test, in a browser of its own. For steps that run against one component, see
[Storybook](storybook.md); a project can use both.

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

## Config

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineGppConfig } from '@gpp-lang/playwright'

export default defineConfig({
  ...defineGppConfig({ features: ['features'], ignore: ['features/drafts'] }),
  use: { baseURL: 'http://localhost:3000' },
})
```

| Option | Default | Is |
| --- | --- | --- |
| `features` | everything under `root` | where the `.gpp` files and Markdown are |
| `ignore` | nothing | files and directories to leave out |
| `outputDir` | `.gpp-tests` | where the generated tests go |
| `root` | the config's directory | what the paths are relative to |

- Each time Playwright loads its config, `defineGppConfig` writes a small test per `.gpp`
  file to `outputDir`. They only list the scenarios, so they can't go out of date. Add
  `outputDir` to `.gitignore`.
- The rest of Playwright works as usual: projects, retries, sharding, UI mode and the trace
  viewer. Failures point at the word in the `.gpp` file that failed.
- For sets of features with words of their own, give each Playwright project its own
  `defineGppConfig` and `outputDir`.

## Running

```sh
npx playwright test                         # every scenario
npx playwright test features/sign-in.gpp:12 # the scenario on line 12
npx playwright test --grep @smoke           # the scenarios tagged @smoke
```

Playwright runs a `defineGppConfig`'s `features`, with the [Defines](defines.md) in them.

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme`, `@fail`, `@slow`, `@only` | what it does in Playwright |
| any other | a Playwright tag, for `--grep` |

## Markdown

` ```gpp ` blocks in Markdown files run as tests, like Rust's doctests, so your docs' examples
stay true. See [`examples/demo/features/README.md`](../examples/demo/features/README.md).

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
