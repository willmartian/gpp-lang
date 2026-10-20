# @spp-lang/playwright

Runs [Spec++](https://github.com/willmartian/spp-lang) scenarios, in `.spp` files and
Markdown's ` ```spp ` blocks, as Playwright tests.

```sh
npm install --save-dev spp-lang @spp-lang/playwright @playwright/test
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

Then `npx playwright test`. See [Playwright](https://github.com/willmartian/spp-lang/blob/master/docs/playwright.md).
