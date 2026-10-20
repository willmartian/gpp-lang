# Projects

A project is the files under the nearest `package.json`, and every Define in it can be used by
all of its files: Features, Markdown and Storybook templates alike. A package inside another
is a project of its own, with words of its own. `spp-lang` and the [editor](editors.md) check
each project that way.

## CLI

| Command | Does |
| --- | --- |
| `spp-lang check [paths...]` | checks the files under each path, or where it's run, without running them |
| `spp-lang dictionary` | lists every word, and the project's own Defines |
| `spp-lang lsp` | starts the language server |

`check` checks `.spp` files, Markdown's ` ```spp ` blocks and the `spp` templates in `.js`
and `.ts` files, whichever backend runs them.
