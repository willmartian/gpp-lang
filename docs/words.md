# Words

Every built-in word. `npx spp-lang dictionary` lists the same entries in a terminal, with
your project's [Defines](defines.md).

## Reading a signature

```
Button : Text | Pattern, Scope -> Element
```

- **Left of `->`:** what a word takes, in reading order. The first is written right after it.
- **Right of `->`:** what it leaves.
- **`|`:** either.
- A step has to use everything it makes. Anything left at its end has to be a check.

| Type | Is |
| --- | --- |
| `Element` | something on the page |
| `Text` | `"quoted text"` |
| `Number` | `3` |
| `Table` | the step's data table |
| `Pattern` | `Containing "some text"` |
| `Holding` | `Containing` an element |
| `Scope` | `Within` an element |
| `Matcher` | a check waiting for an element, like `Checked` |
| `Check` | a check, like `See the Button "Save"` |
| `Step`, `Mode` | a step, and the Given, When or Then above it |

## On one page

Every backend runs the same words, except that a Storybook template plays on one page, already
open. It has no `Visit`, `Reload`, `Back`, `At` or `Titled`.
