# Gherkin++ for VS Code

Support for Gherkin++'s `.gpp` files: Gherkin you can run, with no step definitions. The
` ```gpp ` blocks in Markdown files get the same, and so do `gpp` templates,
[Storybook play functions](https://github.com/willmartian/gpp-lang/blob/master/docs/storybook.md),
in JavaScript and TypeScript. Both are highlighted as Gherkin++.

The language, how to run it with Playwright, and this extension's source are in the
[gpp-lang repository](https://github.com/willmartian/gpp-lang).

- Mistakes show up as you type, before any test runs.
- Hover a word to see its type. For your own `Define`d words, the type is worked out from
  how they're used.
- Go to definition goes from a word to its `Define`.
- Completion offers the words that fit first: after `Click the`, things on the page.
- The capitalised words that are code are highlighted apart from the prose.
- Running and debugging come from [Playwright's own extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright).
  Gherkin++'s generated tests map back to the `.gpp` files, so it puts run and debug buttons beside
  every scenario, lists them in the Test Explorer, and shows failures at the step that failed.

## Which gpp-lang

The language server comes from your workspace's own `node_modules/gpp-lang` when it has one, so
the editor agrees with your tests. Otherwise the extension uses the one it ships with. In an
untrusted workspace it always uses its own.

Each package in the workspace, the files under a `package.json`, is a project, checked on its
own, so two can `Define` the same word.

## Settings

- `gpp.path`: a gpp-lang to use instead, as the path to its `bin/gpp-lang.js`.
- `gpp.node`: the Node.js to run your workspace's gpp-lang with. The default is `node`. It can be a
  path, relative to the workspace folder, to a script that sets up the environment first.
