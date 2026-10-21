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
Runs as Playwright tests, Storybook play functions, or Vitest and Jest tests. [How words work](docs/words.md)

## Install

Needs Node.js 22.18 or later. Install `gpp-lang` and a backend for each kind of test, then
say which files each one runs in `gpp.config.ts`, at your project's root:

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { playwright } from '@gpp-lang/playwright/config'
import { storybook } from '@gpp-lang/storybook/config'

export default defineConfig({
  backends: [playwright({ files: ['features/**/*.gpp'] }), storybook()],
})
```

Every backend has the shared words, and some add their own: Playwright's for the page,
Testing Library's `Render`. A file only has its backend's.

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
import gpp from './gpp.config.ts'

export default defineConfig({
  ...defineGppConfig(gpp),
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

### Vitest or Jest

Runs a Feature in a test file, rendering components with Testing Library.
[Docs](docs/testing-library.md).

```sh
npm install --save-dev gpp-lang @gpp-lang/testing-library @testing-library/dom @testing-library/user-event
```

```ts
// a setup file
import { renderWith } from '@gpp-lang/testing-library'
import { render } from '@testing-library/react'

renderWith(render)
```

```tsx
// a test
import { gpp } from '@gpp-lang/testing-library'

gpp`
  Feature: The editor

    Scenario: Saving a draft
      Given I Render ${<Editor title="" />}
      When I Click the Button "Save"
      Then the Status should Read "Draft saved"
`
```

## Check

Every file in a project can use its [Defines](docs/defines.md).

```sh
npx gpp-lang check        # check every spec, without running it
npx gpp-lang words        # every word you can use
```

## Docs

| Page | Covers |
| --- | --- |
| **Words** | |
| [How words work](docs/words.md) | code and prose, right to left, types |
| [Built-in words](docs/built-in-words.md) | every word Gherkin++ has |
| [Your own words](docs/defines.md) | Defines, and which files can use them |
| **Backends** | |
| [Playwright](docs/playwright.md) | Features as Playwright tests, in `.gpp` files and Markdown |
| [Storybook](docs/storybook.md) | steps as stories' play functions |
| [Testing Library](docs/testing-library.md) | Features as Vitest or Jest tests |
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
