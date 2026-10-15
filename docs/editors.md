# Editors

`spp-lang lsp` is a language server. Everything it does also works in Markdown ` ```spp `
blocks.

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

Install [the Spec++ extension](https://marketplace.visualstudio.com/items?itemName=spp-lang.spp-vscode).
It uses your project's `node_modules/spp-lang` if there is one.

For run and debug buttons beside every scenario, add
[Playwright's extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright).

## Claude Code

The plugin teaches Claude the language and runs the language server.

```sh
claude plugin marketplace add willmartian/spp-lang
claude plugin install spp-lang@spp-lang
```

## Neovim

Neovim 0.11 or later:

```lua
vim.filetype.add({ extension = { spp = 'spp' } })
vim.lsp.config('spp', {
  cmd = { 'npx', 'spp-lang', 'lsp' },
  filetypes = { 'spp' },
  root_markers = { 'package.json', '.git' },
})
vim.lsp.enable('spp')
```
