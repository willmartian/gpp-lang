# ✅ Gherkin++

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

Gherkin without step definitions. Scenarios run as Playwright tests, and steps run as
Storybook stories' play functions: the same words, in either or both.

- **Capitalised words are code.** Lowercase words are prose, for people.
- **Code runs right to left.** In `Click the Button "Sign in"`, `Button` finds the button
  named "Sign in", then `Click` clicks it.
- **Elements are found as a user finds them:** by role, label and text, as in
  [Testing Library](https://testing-library.com/docs/queries/about). There are no CSS
  selectors.
- **A scenario does the same thing every run.** There are no sleeps, conditionals or loops.
- **Mistakes are caught before a browser starts.** Every word has a type.
- **The rest is Gherkin.** Backgrounds, Scenario Outlines, Rules, data tables and tags work as
  in Cucumber.

## Install

Needs Node.js 22.13 or later. `gpp-lang` checks your specs and gives your editor its support.
A backend runs them: pick either, or both.

### Playwright

Runs Features in `.gpp` files, and in Markdown's ` ```gpp ` blocks, against your running
app. See [Playwright](docs/playwright.md).

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

Runs steps as a story's play function, against one component. See
[Storybook](docs/storybook.md).

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

Both backends use the same words and the same [Defines](docs/defines.md), your own words, and `gpp-lang`
checks both before anything runs.

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

- **Agents writing tests reach for sleeps, conditionals and CSS selectors** until a test
  passes. Gherkin++ has none of them, so a reviewer only has to ask whether a spec tests the
  right thing.
- **A spec is written in the words of whoever uses what it tests.** A web app's users click
  buttons and read headings, so those are Gherkin++'s words. A library's users write code, so
  its specs are best written as code.

[Contributing](CONTRIBUTING.md)
