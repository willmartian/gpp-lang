# Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), checked by
commitlint. Code is formatted and linted with Biome (`pnpm format`).

## Layout

A [pnpm](https://pnpm.io) workspace:

| Directory | Is |
| --- | --- |
| `packages/core` | `@gpp-lang/core`: the language, its words, the checker, and the driver contract |
| `packages/gpp-lang` | the CLI and the language server |
| `packages/playwright` | `@gpp-lang/playwright`, which runs `.gpp` files and Markdown as Playwright tests |
| `packages/storybook` | `@gpp-lang/storybook`, which runs `gpp` templates as play functions |
| `editors/vscode` | the VS Code extension |
| `examples/*` | projects that use the packages, as a user's would |
| `site` | the docs site |
| `test` | tests of the CLI and the language server |

In the workspace, each package's `exports` point at its TypeScript source, which Node runs as
it is. Published, `publishConfig` points them at `dist/`, which `pnpm build` writes.

## Setup

Run everything inside `nix develop`, which has Node and pnpm. Playwright's Chromium needs
libraries NixOS doesn't have by default.

```sh
nix develop
pnpm install
pnpm exec playwright install chromium
pnpm typecheck
pnpm test             # each package's tests, then test/: no browser
pnpm test:e2e         # the Playwright examples, plus fixtures that must fail
pnpm test:storybook   # the Storybook example, plus fixtures that must fail
pnpm build            # each package's dist/
pnpm storybook        # examples/storybook's stories, opened in a browser
```

## The VS Code extension

In `editors/vscode`:

```sh
xvfb-run -a pnpm test # opens VS Code on a scratch workspace and uses the extension
pnpm run package      # builds gpp-vscode-0.1.0.vsix
```

To try it by hand, use Run and Debug → **Run Gherkin++ extension**. Its language server runs
from source through `scripts/nix-node`. For Playwright's extension to run scenarios on NixOS,
start VS Code from the dev shell (`nix develop -c code .`).

## The docs site

`site/` builds the README and `docs/` with [Eleventy](https://www.11ty.dev/). Built-in words
comes from each word's `.doc()` in `packages/core/src/words/shared.ts` and
`packages/core/src/language/steps.ts`, as do `gpp-lang dictionary` and hover.
`packages/core/test/docs.test.ts` checks every word has docs and every example checks.

```sh
pnpm docs         # serves it on localhost:8080, rebuilding as you edit
pnpm docs:build   # writes site/_site
```
