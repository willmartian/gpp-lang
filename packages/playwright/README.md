# @spp-lang/playwright

Runs [Spec++](https://github.com/willmartian/spp-lang) scenarios, in `.spp` files and
Markdown's ` ```spp ` blocks, as Playwright tests.

```sh
npm install --save-dev spp-lang @spp-lang/playwright @playwright/test
```

```ts
// spp.config.ts
import playwright from '@spp-lang/playwright'
import { defineConfig } from 'spp-lang'

export default defineConfig({ backends: [playwright({ files: ['features'] })] })
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { sppTests } from '@spp-lang/playwright'
import spp from './spp.config.ts'

export default defineConfig({ ...sppTests(spp), use: { baseURL: 'http://localhost:3000' } })
```

Then `npx playwright test`. See [Running](https://github.com/willmartian/spp-lang/blob/master/docs/running.md).
