# Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), checked by
commitlint. Code is formatted and linted with Biome (`npm run format`).

## Setup

Run everything inside `nix develop`. Playwright's Chromium needs libraries NixOS doesn't
have by default.

```sh
nix develop
npm install
npx playwright install chromium
npm run typecheck
npm test               # the language, no browser
npm run test:e2e       # examples/demo and examples/todomvc against their apps, plus test/fixtures, which must all fail
npm run test:storybook # examples/storybook's play functions, plus test/fixtures/storybook, which must fail
```

## The VS Code extension

The extension is its own package:

```sh
cd editors/vscode
npm install
xvfb-run -a npm test # opens VS Code on a scratch workspace and uses the extension
npm run package      # builds spp-vscode-0.1.0.vsix
```

To try it by hand, use Run and Debug → **Run Spec++ extension**, which opens a second window
on this repo with the extension loaded. Its language server runs from source on Node, through
`scripts/nix-node`. For Playwright's extension to run scenarios on NixOS, start VS Code from
the dev shell (`nix develop -c code .`) so Chromium finds its libraries.

## The docs site

`site/` builds the README and `docs/` into a site with [Eleventy](https://www.11ty.dev/). The
Words page is generated from each built-in word's doc: its `.doc()` in `src/words/shared.ts`,
`src/backends/playwright/words.ts` and `src/language/steps.ts`. `spp-lang dictionary` and hover
show the same docs, and `test/words/docs.test.ts` checks every word has one and every example
checks.

```sh
npm run docs         # serves it on localhost:8080, rebuilding as you edit
npm run docs:build   # writes site/_site
```
