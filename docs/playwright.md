# Playwright

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
npx playwright install chromium
```

```ts
// gpp.config.ts
import { defineConfig } from 'gpp-lang'
import { playwright } from '@gpp-lang/playwright/config'

export default defineConfig({
  backends: [playwright({ files: ['features/**/*.gpp'] })],
})
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

Gitignore `.gpp-tests/`.

## Words

```gherkin
Given I Visit "/settings"
When I Reload
And I go Back
Then I should be At "/"
And the page should be Titled "Home"
```

## Running

```sh
npx playwright test features/sign-in.gpp:12
npx playwright test --grep @smoke
```

## Markdown

` ```gpp ` blocks in Markdown run too. A block without `Feature:` continues the one above.
[Example](../examples/demo/features/README.md).
