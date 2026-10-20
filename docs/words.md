# How words work

A step is prose with code in it. The code is a few words, each of which takes what's written
after it and leaves something for the word before it.

```gherkin
When I Fill the Field "Email" with "will@example.com"
```

## Code and prose

- **Capitalised words are code:** `Fill`, `Field`.
- **Lowercase words are prose,** there for people: `I`, `the`, `with`, `should`.
- **`"Quoted text"` and numbers are values.**
- **Given, When, Then, And and But** start a step, as in Gherkin.

So a capitalised word in a sentence, like a person's name, is read as code. Put it in quotes if
it's a value, or write it in lowercase.

## Right to left

Code runs from the end of the step to its start. In `Click the Button "Sign in"`, `"Sign in"`
comes first, `Button` turns it into the button named "Sign in", and `Click` clicks it. So a
word comes before what it acts on, as in English.

- **Things are found as a user finds them:** by role, label and text, as in
  [Testing Library](https://testing-library.com/docs/queries/about). There are no CSS
  selectors.
- **`Within` looks inside something else:**
  `Click the Button "Remove" Within the Row Containing "Kale"`.
- **A step's data table or DocString acts as if it were written at its end:**
  `When I Fill the Field "Notes" with:`, then a DocString.

## Types

Every word has a signature: what it takes, and what it leaves. Your editor shows it on hover,
and `npx spp-lang dictionary` lists them all.

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

Every step is checked before anything runs, so a word given the wrong thing is a mistake in
your editor, not a failed test.

## Using everything

A step has to use everything it makes. Anything left at its end has to be a check:

| Step | |
| --- | --- |
| `Then I should See the Heading "Welcome back"` | works: `See` leaves a Check |
| `Then the Checkbox "Terms" should be Checked` | works: `Checked` checks the Checkbox |
| `When the Button "Add"` | a mistake: the Button is never used |
| `When I click the Button "Add"` | a mistake: `click` is prose, so the Button is never used |

## On one page

Every backend runs the same words, except that a Storybook template plays on one page, already
open. It has no `Visit`, `Reload`, `Back`, `At` or `Titled`.

## More words

- [Built-in words](dictionary.md): every word Spec++ has.
- [Your own words](defines.md): Defines, written in Spec++.
