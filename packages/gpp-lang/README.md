# gpp-lang

Gherkin++: specs that run, written by agents and read by people. Gherkin without step
definitions.

This package checks your specs and gives your editor its support. A backend runs them:

- [`@gpp-lang/playwright`](https://www.npmjs.com/package/@gpp-lang/playwright) runs `.gpp`
  files and Markdown's ` ```gpp ` blocks as Playwright tests
- [`@gpp-lang/storybook`](https://www.npmjs.com/package/@gpp-lang/storybook) runs `gpp`
  templates as Storybook play functions

```sh
npx gpp-lang check        # check every spec under here, without running anything
npx gpp-lang dictionary   # every word you can use
npx gpp-lang lsp          # the language server
```

Docs, and the rest: [github.com/willmartian/gpp-lang](https://github.com/willmartian/gpp-lang).
