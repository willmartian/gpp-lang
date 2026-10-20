# @gpp-lang/playwright

Runs [Gherkin++](https://github.com/willmartian/gpp-lang) scenarios, in `.gpp` files and
Markdown's ` ```gpp ` blocks, as Playwright tests.

```sh
npm install --save-dev gpp-lang @gpp-lang/playwright @playwright/test
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

Then `npx playwright test`. [Docs](https://github.com/willmartian/gpp-lang/blob/master/docs/playwright.md).
