# gpp-lang

The CLI and language server for [Gherkin++](https://github.com/willmartian/gpp-lang), Gherkin
without step definitions. A backend runs the specs:

- [`@gpp-lang/playwright`](https://www.npmjs.com/package/@gpp-lang/playwright) runs `.gpp`
  files and Markdown's ` ```gpp ` blocks as Playwright tests
- [`@gpp-lang/storybook`](https://www.npmjs.com/package/@gpp-lang/storybook) runs `gpp`
  templates as Storybook play functions

```sh
npx gpp-lang check        # check every spec under here, without running anything
npx gpp-lang dictionary   # every word you can use
npx gpp-lang lsp          # the language server
```

[Docs](https://github.com/willmartian/gpp-lang).
