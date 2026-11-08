# CLI and editors

```sh
npx gpp-lang check   # check specs without running them
npx gpp-lang words   # list every word
npx gpp-lang lsp     # start the language server
```

## VS Code

[The Gherkin++ extension](https://marketplace.visualstudio.com/items?itemName=gpp-lang.gpp-vscode).

## Claude Code

```sh
claude plugin marketplace add willmartian/gpp-lang
claude plugin install gpp-lang@gpp-lang
```

## Neovim 0.11+

```lua
vim.filetype.add({ extension = { gpp = 'gpp' } })
vim.lsp.config('gpp', {
  cmd = { 'npx', 'gpp-lang', 'lsp' },
  filetypes = { 'gpp' },
  root_markers = { 'gpp.config.ts', '.git' },
})
vim.lsp.enable('gpp')
```
