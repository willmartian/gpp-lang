# 🥒 Gherkin++

Specs that run. Written by agents, read by people.

```gherkin
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
    When I Fill the Field "Email" with "will@example.com"
    And I Fill the Field "Password" with "hunter2"
    And I Click the Button "Sign in"
    Then I should See the Heading "Welcome back"
```

Gherkin without step definitions: capitalised words are code, the rest is prose.
Runs as Playwright tests, Storybook play functions, or both. [How words work](docs/words.md)

## Install

Needs Node.js 22.13 or later. Install `gpp-lang` and one or both backends.

### Playwright

Runs `.gpp` files and Markdown's ` ```gpp ` blocks against your app.
[Docs](docs/playwright.md).

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineGppConfig } from '@gpp-lang/playwright'

export default defineConfig({
  ...defineGppConfig({ features: ['features'] }),
  use: { baseURL: 'http://localhost:3000' },
})
```

Add `.gpp-tests/` to `.gitignore`, then `npx playwright test`.

### Storybook

Runs steps as a story's play function. [Docs](docs/storybook.md).

```sh
npm install --save-dev gpp-lang @gpp-lang/storybook
```

```ts
// .storybook/main.ts
addons: ['@gpp-lang/storybook']
```

```ts
// a story
import { gpp } from '@gpp-lang/storybook'

export const SavingADraft: Story = {
  play: gpp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

## Check

Both backends share the same words and [Defines](docs/defines.md).

```sh
npx gpp-lang check        # check every spec, without running it
npx gpp-lang dictionary   # every word you can use
```

## Docs

| Page | Covers |
| --- | --- |
| **Words** | |
| [How words work](docs/words.md) | code and prose, right to left, types |
| [Built-in words](docs/dictionary.md) | every word Gherkin++ has |
| [Your own words](docs/defines.md) | Defines, and which files can use them |
| **Backends** | |
| [Playwright](docs/playwright.md) | Features as Playwright tests, in `.gpp` files and Markdown |
| [Storybook](docs/storybook.md) | steps as stories' play functions |
| **Tools** | |
| [CLI and editors](docs/tools.md) | `gpp-lang`, the language server, VS Code, Claude Code, Neovim |

## Why

- **Agents reach for sleeps, conditionals and CSS selectors** until a test passes. Gherkin++
  has none, so review is only about whether a spec tests the right thing.
- **Mistakes are caught before anything runs.** Every word has a type.
- **Specs use the words of whoever uses the thing tested.** Web app users click buttons and
  read headings. Library users write code, so a library's specs should be code.
- **The rest is Gherkin.** Backgrounds, Scenario Outlines, Rules, data tables and tags work as
  in Cucumber.

[Contributing](CONTRIBUTING.md)
