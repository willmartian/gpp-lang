# spp-lang

Spec++: specs that run, written by agents and read by people. Gherkin without step
definitions.

This package is the `spp-lang` command, the language server, and `defineConfig`, for a
project's `spp.config.ts`, which lists the backends that run its scenarios:

```ts
// spp.config.ts
import playwright from '@spp-lang/playwright'
import storybook from '@spp-lang/storybook'
import { defineConfig } from 'spp-lang'

export default defineConfig({ backends: [playwright({ files: ['features'] }), storybook({ files: ['src'] })] })
```

- [`@spp-lang/playwright`](https://www.npmjs.com/package/@spp-lang/playwright) runs `.spp`
  files and Markdown's ` ```spp ` blocks as Playwright tests
- [`@spp-lang/storybook`](https://www.npmjs.com/package/@spp-lang/storybook) runs `spp`
  templates as Storybook play functions

```sh
npx spp-lang check        # check every file with the words of the backend that runs it
npx spp-lang dictionary   # every word you can use
npx spp-lang lsp          # the language server
```

Docs, and the rest: [github.com/willmartian/spp-lang](https://github.com/willmartian/spp-lang).
