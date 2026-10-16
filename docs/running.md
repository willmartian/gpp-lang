# Running

## Config

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { defineSppConfig } from '@spp-lang/playwright'

export default defineConfig({
  ...defineSppConfig({ features: ['features'], ignore: ['features/drafts'] }),
  use: { baseURL: 'http://localhost:3000' },
})
```

| Option | Default | Is |
| --- | --- | --- |
| `features` | everything under `root` | where the `.spp` files are |
| `ignore` | nothing | files and directories to leave out |
| `outputDir` | `.spp-tests` | where the generated tests go |
| `root` | the config's directory | what the paths are relative to |

- Each time Playwright loads its config, `defineSppConfig` writes a small test per `.spp`
  file to `outputDir`. They only list the scenarios, so they can't go out of date.
- Calling `defineSppConfig` from a helper in another file? Pass `root`.
- The rest of Playwright works as usual: projects, retries, sharding, UI mode and the trace
  viewer. Failures point at the word in the `.spp` file that failed.

## Projects

Every Define in a project can be used by all of its files. For sets of features with
their own words, give each Playwright project its own `defineSppConfig` and `outputDir`:

```ts
projects: [
  { name: 'shop', ...defineSppConfig({ features: ['shop'], outputDir: '.spp-tests/shop' }) },
  { name: 'admin', ...defineSppConfig({ features: ['admin'], outputDir: '.spp-tests/admin' }) },
],
```

`spp-lang` finds the config by looking up from the current directory.

## CLI

| Command | Does |
| --- | --- |
| `spp-lang test [paths...]` | runs `playwright test` with your config |
| `spp-lang check [paths...]` | checks the files without a browser |
| `spp-lang dictionary` | lists every word the project can use |
| `spp-lang lsp` | starts the language server |

Without a Playwright config, `test` and `check` take every `.spp` file under the current
directory, and every Markdown file with a ` ```spp ` block.

### `spp-lang test`

| Argument | Is |
| --- | --- |
| `[paths...]` | directories, files, or `file:line` for a scenario or one of its steps |
| `-u, --base-url <url>` | where `Visit "/"` goes; also `$SPP_BASE_URL` |
| anything else | passed to Playwright, like `--headed`, `--ui` or `--grep @smoke` |

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme`, `@fail`, `@slow`, `@only` | what it does in Playwright |
| any other | a Playwright tag, for `--grep` |
