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

Gherkin without step definitions. Every scenario runs as a Playwright test.

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

Needs Node.js 22.13 or later.

```sh
npm install --save-dev spp-lang @playwright/test
npx playwright install chromium
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineSppConfig } from 'spp-lang'

export default defineConfig({
  ...defineSppConfig({ features: ['features'] }),
  use: { baseURL: 'http://localhost:3000' },
})
```

Add `.spp-tests/` to `.gitignore`.

## Run

```sh
npx playwright test                         # every scenario
npx playwright test features/sign-in.spp:12 # the scenario on line 12
npx spp-lang check                          # check without running
npx spp-lang dictionary                     # every word you can use
```

## Docs

| Page | Covers |
| --- | --- |
| [Words](docs/words.md) | every built-in word |
| [Defines](docs/defines.md) | your own words |
| [Running](docs/running.md) | config, projects, the CLI, tags |
| [Markdown](docs/markdown.md) | ` ```spp ` blocks that run as tests |
| [Storybook](docs/storybook.md) | templates as stories' play functions |
| [Editors](docs/editors.md) | the language server, VS Code, Claude Code, Neovim |

## Why

- **Agents writing tests reach for sleeps, conditionals and CSS selectors** until a test
  passes. Spec++ has none of them, so a reviewer only has to ask whether a spec tests the
  right thing.
- **A spec is written in the words of whoever uses what it tests.** A web app's users click
  buttons and read headings, so those are Spec++'s words. A library's users write code, so
  its specs are best written as code.

[Contributing](CONTRIBUTING.md)
