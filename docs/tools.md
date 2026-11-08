# CLI and editors

## CLI

```sh
npx gpp-lang check [paths...]  # check specs without running them
npx gpp-lang words             # list every word the project can use
npx gpp-lang lsp               # start the language server
```

`check` covers `.gpp` files, ` ```gpp ` blocks in Markdown, and `gpp` templates in JS and
TS files.

## Language server

Diagnostics, hover, go to definition, references, completion, symbols and semantic
highlighting.

## VS Code

[The Gherkin++ extension](https://marketplace.visualstudio.com/items?itemName=gpp-lang.gpp-vscode).
Add [Playwright's](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
for run and debug buttons.

## Claude Code

```sh
claude plugin marketplace add willmartian/gpp-lang
claude plugin install gpp-lang@gpp-lang
```

## Neovim

0.11 or later:

```lua
vim.filetype.add({ extension = { gpp = 'gpp' } })
vim.lsp.config('gpp', {
  cmd = { 'npx', 'gpp-lang', 'lsp' },
  filetypes = { 'gpp' },
  root_markers = { 'gpp.config.ts', '.git' },
})
vim.lsp.enable('gpp')
```
