# CLI and editors

## CLI

```sh
npx gpp-lang check [paths...]  # check specs without running them
npx gpp-lang words             # list every word the project can use
npx gpp-lang lsp               # start the language server
```

`check` finds every `gpp.config.ts` under the given paths, or under the current directory,
and checks the files each one covers: `.gpp` files, ` ```gpp ` blocks in Markdown, and `gpp`
templates in `.js`, `.ts`, `.jsx` and `.tsx` files.

## Language server

The language server reports mistakes as you type, and has hover, go to definition, find
references, completion, document symbols and semantic highlighting. Completion suggests words
that fit where the cursor is, so after `Click the` it offers elements.

All of it works in `.gpp` files and Markdown. In `gpp` templates, everything works except
symbols and semantic highlighting.

The server runs your `gpp.config.ts` to find out which words a file has. In an untrusted
workspace it won't, and only reports syntax errors.

## VS Code

Install [the Gherkin++ extension](https://marketplace.visualstudio.com/items?itemName=gpp-lang.gpp-vscode).
It uses the `gpp-lang` in your project's `node_modules` if there is one. To get run and debug
buttons on scenarios, also install
[Playwright's extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright).

## Claude Code

The plugin teaches Claude the language and gives it the language server.

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
  root_markers = { 'gpp.config.ts', '.git' },
})
vim.lsp.enable('gpp')
```
