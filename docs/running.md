# Running

## spp.config.ts

A project is a `spp.config.ts` and the backends it lists. Each backend runs one kind of file,
under its `files`:

```ts
// spp.config.ts
import playwright from '@spp-lang/playwright'
import storybook from '@spp-lang/storybook'
import { defineConfig } from 'spp-lang'

export default defineConfig({
  backends: [playwright({ files: ['features'], ignore: ['features/drafts'] }), storybook({ files: ['src'] })],
})
```

| Backend | Runs |
| --- | --- |
| `@spp-lang/playwright` | `.spp` files and Markdown's ` ```spp ` blocks, as Playwright tests |
| `@spp-lang/storybook` | `spp` templates, as stories' play functions ([Storybook](storybook.md)) |

- Every Define in the project's files can be used by all of them, whichever backend runs them.
- The tools find the config by looking up from where they run, and a file is the nearest
  config's. For features with words of their own, give their directory its own
  `spp.config.ts`.
- Each backend's own tool runs its scenarios. Its config imports `spp.config.ts`, so the
  project is said once.

## Playwright

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { sppTests } from '@spp-lang/playwright'
import spp from './spp.config.ts'

export default defineConfig({
  ...sppTests(spp),
  use: { baseURL: 'http://localhost:3000' },
})
```

| `playwright()` option | Default | Is |
| --- | --- | --- |
| `files` | everything under the config | where the `.spp` files and Markdown are |
| `ignore` | nothing | files and directories to leave out |
| `outputDir` | `.spp-tests` | where the generated tests go |

- Each time Playwright loads its config, `sppTests` writes a small test per `.spp` file to
  `outputDir`. They only list the scenarios, so they can't go out of date.
- `npx playwright test features/cart.spp:12` runs the scenario on line 12.
- The rest of Playwright works as usual: projects, retries, sharding, UI mode and the trace
  viewer. Failures point at the word in the `.spp` file that failed.
- For several projects in one Playwright config, import each `spp.config.ts`:
  `projects: [{ name: 'shop', ...sppTests(shop) }, { name: 'admin', ...sppTests(admin) }]`.

## CLI

| Command | Does |
| --- | --- |
| `spp-lang check [paths...]` | checks the files without running them |
| `spp-lang dictionary` | lists every word the project can use |
| `spp-lang lsp` | starts the language server |

Each file is checked with the words of the backend that runs it. Without a `spp.config.ts`,
the CLI says how to make one.

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme`, `@fail`, `@slow`, `@only` | what it does in Playwright |
| any other | a Playwright tag, for `--grep` |
