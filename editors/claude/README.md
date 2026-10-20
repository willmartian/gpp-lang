# Gherkin++ for Claude Code

A Claude Code plugin that helps Claude write `.gpp` files.

- **The `writing-gpp` skill** teaches the language's rules, to read `gpp-lang words`
  first, and to run `gpp-lang check` after every edit.
- **The language server** reports mistakes to Claude after each edit, and gives its `LSP`
  tool hover, go to definition, references and symbols.

Both use your project's `gpp-lang`, so install it first, with a backend. The server runs
through `npx` from the directory Claude Code started in.

## Installing

This repository is a plugin marketplace:

```sh
claude plugin marketplace add willmartian/gpp-lang
claude plugin install gpp-lang@gpp-lang
```

From a clone, pass its path to `marketplace add`. To try it without installing:

```sh
claude --plugin-dir ./path/to/gpp-lang/editors/claude
```

Run the skill yourself with `/gpp-lang:writing-gpp`.

## Limits

- The server starts on the first `.gpp` edit, so early mistakes can arrive a step late.
  `gpp-lang check` covers the gap.
- Cloud sessions don't start plugin language servers, so only the skill works there.
- Without `gpp-lang` installed, the server fails to start and the session carries on.
  `claude --debug` logs why.
