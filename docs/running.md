# Running

## Playwright

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
| `features` | everything under `root` | where the `.spp` files and Markdown are |
| `ignore` | nothing | files and directories to leave out |
| `outputDir` | `.spp-tests` | where the generated tests go |
| `root` | the config's directory | what the paths are relative to |

- Each time Playwright loads its config, `defineSppConfig` writes a small test per `.spp`
  file to `outputDir`. They only list the scenarios, so they can't go out of date.
- `npx playwright test features/cart.spp:12` runs the scenario on line 12.
- The rest of Playwright works as usual: projects, retries, sharding, UI mode and the trace
  viewer. Failures point at the word in the `.spp` file that failed.
- For sets of features with words of their own, give each Playwright project its own
  `defineSppConfig` and `outputDir`.

Storybook runs `spp` templates as play functions: see [Storybook](storybook.md).

## Projects

A project is the files under the nearest `package.json`, and every Define in it can be used by
all of its files. A package inside another is a project of its own, with words of its own.
`spp-lang` and the editor check each project that way; Playwright runs a `defineSppConfig`'s
`features`, with the Defines in them.

## CLI

| Command | Does |
| --- | --- |
| `spp-lang check [paths...]` | checks the files under each path, or where it's run, without running them |
| `spp-lang dictionary` | lists every word, and the project's own Defines |
| `spp-lang lsp` | starts the language server |

The words are the same for every file and every backend, except that a template, which plays
on one page, has no `Visit`, `Reload`, `Back`, `At` or `Titled`.

## Tags

| Tag | Does |
| --- | --- |
| `@skip`, `@fixme`, `@fail`, `@slow`, `@only` | what it does in Playwright |
| any other | a Playwright tag, for `--grep` |
