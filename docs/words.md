# How words work

A step is prose with code in it. Each word of code takes what comes after it and leaves
something for the word before it.

```gherkin
When I Fill the Field "Email" with "will@example.com"
```

## Code and prose

- **Capitalised words are code:** `Fill`, `Field`.
- **Lowercase words are prose,** there for people: `I`, `the`, `with`, `should`.
- **`"Quoted text"` and numbers are values.**
- **Given, When, Then, And and But** start a step, as in Gherkin.

A capitalised name in prose is code too: quote it or lowercase it.

## Right to left

Code runs from the end of a step to its start. In `Click the Button "Sign in"`, `Button`
finds the button named "Sign in", then `Click` clicks it. Verbs come first, as in English.

- **Things are found as a user finds them:** by role, label and text, as in
  [Testing Library](https://testing-library.com/docs/queries/about). There are no CSS
  selectors.
- **`Within` looks inside something else:**
  `Click the Button "Remove" Within the Row Containing "Kale"`.
- **A data table or DocString counts as the step's last word:**
  `When I Fill the Field "Notes" with:`, then a DocString.

## Types

Every word has a signature. Hover shows it; `npx gpp-lang words` lists them all.

```
Button : Text | Pattern, Scope -> Element
```

- **Left of `->`:** what a word takes, in reading order. The first is written right after it.
- **Right of `->`:** what it leaves.
- **`|`:** either.

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

Steps are type-checked before anything runs.

## Using everything

A step must use everything it makes. Anything left at the end must be a check.

| Step | |
| --- | --- |
| `Then I should See the Heading "Welcome back"` | works: `See` leaves a Check |
| `Then the Checkbox "Terms" should be Checked` | works: `Checked` checks the Checkbox |
| `When the Button "Add"` | a mistake: the Button is never used |
| `When I click the Button "Add"` | a mistake: `click` is prose, so the Button is never used |

## On one page

Storybook templates run on one page that's already open, so they have no `Visit`, `Reload`,
`Back`, `At` or `Titled`.

## More words

- [Built-in words](built-in-words.md)
- [Your own words](defines.md)
