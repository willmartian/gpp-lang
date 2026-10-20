# spp-lang

Spec++: specs that run, written by agents and read by people. Gherkin without step
definitions.

This package checks your specs and gives your editor its support. A backend runs them:

- [`@spp-lang/playwright`](https://www.npmjs.com/package/@spp-lang/playwright) runs `.spp`
  files and Markdown's ` ```spp ` blocks as Playwright tests
- [`@spp-lang/storybook`](https://www.npmjs.com/package/@spp-lang/storybook) runs `spp`
  templates as Storybook play functions

```sh
npx spp-lang check        # check every spec under here, without running anything
npx spp-lang dictionary   # every word you can use
npx spp-lang lsp          # the language server
```

Docs, and the rest: [github.com/willmartian/spp-lang](https://github.com/willmartian/spp-lang).
