# Gherkin++ for VS Code

[Gherkin++](https://github.com/willmartian/gpp-lang) support for `.gpp` files, Markdown's
` ```gpp ` blocks, and `gpp` templates
([Storybook play functions](https://github.com/willmartian/gpp-lang/blob/master/docs/storybook.md))
in JavaScript and TypeScript.

- Mistakes show up as you type, before any test runs.
- Hover shows a word's type, inferred for your own `Define`s.
- Go to definition goes from a word to its `Define`.
- Completion offers the words that fit first: after `Click the`, things on the page.
- Code is highlighted apart from prose.
- [Playwright's extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
  adds run and debug buttons beside each scenario, and shows failures at the failing step.

## Which gpp-lang

The extension uses your workspace's `node_modules/gpp-lang` when it has one, so the editor
agrees with your tests, and its own copy otherwise. Untrusted workspaces always get its own.

Each `gpp.config.ts` starts a separate project, so two can `Define` the same word. Loading it
runs it, so in an untrusted workspace Gherkin++ only shows files that don't parse.

## Settings

- `gpp.path`: a gpp-lang to use instead, as the path to its `bin/gpp-lang.js`.
- `gpp.node`: the Node.js to run your workspace's gpp-lang with (default `node`). Can be a
  path, relative to the workspace, to a script that sets up the environment first.
