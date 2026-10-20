# CLI and editors

## CLI

| Command | Does |
| --- | --- |
| `gpp-lang check [paths...]` | checks the files under each path, or where it's run, without running them |
| `gpp-lang dictionary` | lists every word, and the project's own Defines |
| `gpp-lang lsp` | starts the language server |

`check` covers `.gpp` files, Markdown's ` ```gpp ` blocks and `gpp` templates in `.js` and
`.ts` files.

## Language server

Works in `.gpp` files and Markdown. [`gpp` templates](storybook.md) get everything but
symbols and semantic tokens.

| Feature | Does |
| --- | --- |
| diagnostics | shows mistakes as you type |
| hover | a word's types, what it does and an example |
| go to definition | a word's Define |
| find references | everywhere a word is used |
| symbols | a file's Defines and scenarios |
| completion | words that fit first: after `Click the`, elements |
| semantic tokens | marks which words are code |

## VS Code

Install [the Gherkin++ extension](https://marketplace.visualstudio.com/items?itemName=gpp-lang.gpp-vscode).
It uses your project's `node_modules/gpp-lang` when there is one. For run and debug buttons,
add [Playwright's extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright).

## Claude Code

Teaches Claude the language and runs the language server.

```sh
claude plugin marketplace add willmartian/gpp-lang
claude plugin install gpp-lang@gpp-lang
```

## Neovim

Neovim 0.11 or later:

```lua
vim.filetype.add({ extension = { gpp = 'gpp' } })
vim.lsp.config('gpp', {
  cmd = { 'npx', 'gpp-lang', 'lsp' },
  filetypes = { 'gpp' },
  root_markers = { 'package.json', '.git' },
})
vim.lsp.enable('gpp')
```
