# ✅ Spec++

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

Needs Node.js 22.13 or later. `spp-lang` checks your specs and gives your editor its support.
A backend runs them: pick either, or both.

### Playwright

Runs Features in `.spp` files, and in Markdown's ` ```spp ` blocks, against your running
app. See [Playwright](docs/playwright.md).

```sh
npm install --save-dev spp-lang @spp-lang/playwright @playwright/test
npx playwright install chromium
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineSppConfig } from '@spp-lang/playwright'

export default defineConfig({
  ...defineSppConfig({ features: ['features'] }),
  use: { baseURL: 'http://localhost:3000' },
})
```

Add `.spp-tests/` to `.gitignore`, then `npx playwright test`.

### Storybook

Runs steps as a story's play function, against one component. See
[Storybook](docs/storybook.md).

```sh
npm install --save-dev spp-lang @spp-lang/storybook
```

```ts
// .storybook/main.ts
addons: ['@spp-lang/storybook']
```

```ts
// a story
import { spp } from '@spp-lang/storybook'

export const SavingADraft: Story = {
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

## Check

Both backends use the same words and the same [Defines](docs/defines.md), and `spp-lang`
checks both before anything runs.

```sh
npx spp-lang check        # check every spec, without running it
npx spp-lang dictionary   # every word you can use
```

## Docs

| Page | Covers |
| --- | --- |
| **The language** | |
| [Words](docs/words.md) | every built-in word |
| [Defines](docs/defines.md) | your own words |
| **Backends** | |
| [Playwright](docs/playwright.md) | Features as Playwright tests, in `.spp` files and Markdown |
| [Storybook](docs/storybook.md) | steps as stories' play functions |
| **Tools** | |
| [Projects](docs/projects.md) | what a project is, and the CLI |
| [Editors](docs/editors.md) | the language server, VS Code, Claude Code, Neovim |

## Why

- **Agents writing tests reach for sleeps, conditionals and CSS selectors** until a test
  passes. Spec++ has none of them, so a reviewer only has to ask whether a spec tests the
  right thing.
- **A spec is written in the words of whoever uses what it tests.** A web app's users click
  buttons and read headings, so those are Spec++'s words. A library's users write code, so
  its specs are best written as code.

[Contributing](CONTRIBUTING.md)
