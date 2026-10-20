# Gherkin++ for Claude Code

A Claude Code plugin that helps Claude write `.gpp` files. It has two parts.

**A skill, `writing-gpp`,** which Claude uses when it writes or edits `.gpp` files. It
teaches Claude:

- the language's rules
- to read `gpp-lang dictionary` first, the reference for every built-in word and your
  project's own
- to run `gpp-lang check` after every edit, and fix what it reports

**The language server, `gpp-lang lsp`.** After Claude edits a `.gpp` file, or a Markdown file
with ` ```gpp ` blocks, Claude Code hands it the mistakes the server finds, without Claude
running anything. Claude's `LSP` tool can also use the server to show a word's type, go to its
`Define`, find everywhere it's used, and list or search the project's `Define`s and scenarios.

Both come from your project's own `gpp-lang`, so install that first, with the backend that
runs your scenarios (`npm install --save-dev gpp-lang @gpp-lang/playwright`). The language server runs through `npx`, from the
directory Claude Code was started in.

## Installing

This repository is a plugin marketplace:

```sh
claude plugin marketplace add willmartian/gpp-lang
claude plugin install gpp-lang@gpp-lang
```

To install from a clone instead, give `marketplace add` its path, like
`./path/to/gpp-lang`.

To try it without installing, start Claude Code with the plugin loaded:

```sh
claude --plugin-dir ./path/to/gpp-lang/editors/claude
```

Claude uses the skill when it's working on `.gpp` files. You can also run it yourself as
`/gpp-lang:writing-gpp`.

## Limits

- The language server starts on Claude's first edit to a `.gpp` file. That edit's mistakes,
  and sometimes a later edit's, reach Claude on its next step rather than straight away.
  The skill's `gpp-lang check` covers the gap.
- Claude Code doesn't start plugin language servers in cloud sessions, so there Claude has
  only the skill.
- If `gpp-lang` isn't installed in the project, the server fails to start and the session
  carries on without it. `npx --no-install` won't install it for you. `claude --debug` logs
  why the server failed.
