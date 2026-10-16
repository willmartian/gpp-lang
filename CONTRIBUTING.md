# Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), checked by
commitlint. Code is formatted and linted with Biome (`pnpm format`).

## Layout

A [pnpm](https://pnpm.io) workspace:

| Directory | Is |
| --- | --- |
| `packages/core` | `@spp-lang/core`: the language, the checker, and the `Backend` interface |
| `packages/spp-lang` | the CLI, the language server, and `defineConfig` for `spp.config.ts` |
| `packages/playwright` | `@spp-lang/playwright`, which runs `.spp` files and Markdown as Playwright tests |
| `packages/storybook` | `@spp-lang/storybook`, which runs `spp` templates as play functions |
| `editors/vscode` | the VS Code extension |
| `examples/*` | projects that use the packages, as a user's would |
| `site` | the docs site |
| `test` | tests of the CLI and language server with both backends |

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
pnpm test:e2e         # examples/demo and examples/todomvc against their apps, plus packages/playwright/test/fixtures, which must all fail
pnpm test:storybook   # examples/storybook's play functions, plus packages/storybook/test/fixtures, which must fail
pnpm build            # each package's dist/
```

## The VS Code extension

In `editors/vscode`:

```sh
xvfb-run -a pnpm test # opens VS Code on a scratch workspace and uses the extension
pnpm run package      # builds spp-vscode-0.1.0.vsix
```

To try it by hand, use Run and Debug → **Run Spec++ extension**, which opens a second window
on this repo with the extension loaded. Its language server runs from source on Node, through
`scripts/nix-node`. For Playwright's extension to run scenarios on NixOS, start VS Code from
the dev shell (`nix develop -c code .`) so Chromium finds its libraries.

## The docs site

`site/` builds the README and `docs/` into a site with [Eleventy](https://www.11ty.dev/). The
Words page is generated from each built-in word's doc: its `.doc()` in
`packages/core/src/words/shared.ts`, `packages/playwright/src/words.ts` and
`packages/core/src/language/steps.ts`. `spp-lang dictionary` and hover show the same docs,
and `packages/playwright/test/docs.test.ts` checks every word has one and every example checks.

```sh
pnpm docs         # serves it on localhost:8080, rebuilding as you edit
pnpm docs:build   # writes site/_site
```
