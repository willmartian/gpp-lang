# Writing specs

```gherkin
When I Fill the Field "Email" with "will@example.com"
```

Capitalised words are code. `Fill` and `Field` are words, and `"Email"` and
`"will@example.com"` are values. Lowercase words like `the` and `with` are ignored. `I` is a
word too, but it does nothing.

Because capitalisation matters, a name in the middle of a sentence has to be quoted or written
in lowercase.

## Reading a step

A step runs from right to left. In `Click the Button "Sign in"`, `Button` takes `"Sign in"`
and finds the button with that name, then `Click` clicks it.

Elements are found the way a user would find them: by role, label or text, as in
[Testing Library](https://testing-library.com/docs/queries/about). To look inside another
element, use `Within`:

```gherkin
When I Click the Button "Remove" Within the Row Containing "Kale"
```

A data table or DocString goes at the end of the step, after everything else:

```gherkin
When I Fill the Field "Notes" with:
  """
  Leave it on the porch.
  """
```

See [Built-in words](built-in-words.md) for the full list.

## Types

Each word takes some values and leaves one behind. Its signature says which:

```
Button : Text | Pattern, Scope -> Element
```

`Button` takes some text or a pattern, then a scope, and leaves an element. Most words have
more than one signature, and `Button` has others without the scope. Hover a
word in your editor to see its signature, or run `npx gpp-lang words`.

| Type | Example |
| --- | --- |
| `Text` | `"Sign in"` |
| `Number` | `3` |
| `Table` | the step's data table |
| `Element` | `the Button "Save"` |
| `Pattern` | `Containing "Kale"` |
| `Holding` | `Containing the Button "Remove"` |
| `Scope` | `Within the Dialog` |
| `Matcher` | `Checked`, a check waiting for an element |
| `Check` | `See the Button "Save"` |

A step has to use everything it makes, and the only thing allowed to be left over is a check.
These work, because `See` leaves a check and `Checked` uses the checkbox:

```gherkin
Then I should See the Heading "Welcome back"
Then the Checkbox "Terms" should be Checked
```

These are errors. Nothing uses the button, and in the second step `click` is lowercase, so
it's ignored:

```gherkin
When the Button "Add"
When I click the Button "Add"
```

All of this is checked before anything runs.

## Your own words

`Define:` makes a new word out of existing ones:

```gherkin
Define: Add Text (Item)
  Fill the Field "Item" with Item
  Click the Button "Add"

Feature: The grocery list

  Scenario: Adding things
    When I Add "Milk" to the list
    Then I should See the Cell "Milk"
```

After the name come the types the word takes. `Text (Item)` takes some text and calls it
`Item` in the body; a bare `Text` would be called `Text`. Two arguments of the same type need
names, as in `Define: Move Element (Source) to Element (Target)`. Arguments can be `Text`,
`Number`, `Element`, `Table`, `Any`, or a noun (see below).

The body is indented steps without `Given`, `When` or `Then`. Defines go above the
`Feature:` line, or in a file with no Feature.

Types are inferred from the body. `Add` passes `Item` to `Fill`, which wants text, so
`When I Add the Button "Milk"` is an error. A Define with a mistake in its body fails as a
test of its own.

### Nouns

A Define that leaves a single value is a noun, and its name becomes a type:

```gherkin
Define: Cart
  the Region "Shopping cart"

Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart
```

Now `When I Add "Milk" to the Cart` works and so does `When I Click the Cart`, since a Cart is
still an element. `When I Add "Milk" to the Region "Shopping cart"` is an error, because `Add`
wants a Cart. A noun can only be defined once.

### Overloads

The same word can be defined more than once if each Define takes different things:

```gherkin
Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart

Define: Add Text (Email) to Settings
  Fill Email into the Field "Email" Within Settings
```

If more than one fits a step, the one that takes more arguments wins, and then the one with
narrower types: a Cart over an Element, and anything over `Any`. Two Defines that would always
both fit are an error.

### Where Defines work

A project is everything under a `gpp.config.ts`. Every file in it can use every Define in it,
whether that's a `.gpp` file, a Markdown file or a template. A directory with its own
`gpp.config.ts` is a separate project.

Some words only exist in one backend, like Playwright's `Visit`. A Define that uses one of
them can only be used in that backend's files.

## Words only some backends have

Every backend has the shared words. Playwright adds `Visit`, `Reload`, `Back`, `At` and
`Titled` for the page, and Testing Library adds `Render`. Storybook adds none, since a story
renders itself. `gpp.config.ts` decides which backend runs each file, so it also decides
which words that file can use.
