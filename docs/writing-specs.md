# Writing specs

```gherkin
When I Fill the Field "Email" with "will@example.com"
```

Capitalised words are code, quoted text and numbers are values, and lowercase words are
ignored. Quote or lowercase any other capitalised name.

## Reading a step

Steps run right to left: `Button` finds the button, then `Click` clicks it.

```gherkin
When I Click the Button "Sign in"
```

`Within` looks inside another element:

```gherkin
When I Click the Button "Remove" Within the Row Containing "Kale"
```

A data table or DocString comes last:

```gherkin
When I Fill the Field "Notes" with:
  """
  Leave it on the porch.
  """
```

Elements are found by role, label or text, as in
[Testing Library](https://testing-library.com/docs/queries/about). All words:
[Built-in words](built-in-words.md).

## Types

```
Button : Text | Pattern, Scope -> Element
```

Takes text or a pattern, then a scope, and leaves an element. Hover a word or run
`npx gpp-lang words` to see its signatures.

| Type | Example |
| --- | --- |
| `Text` | `"Sign in"` |
| `Number` | `3` |
| `Table` | the step's data table |
| `Element` | `the Button "Save"` |
| `Pattern` | `Containing "Kale"` |
| `Holding` | `Containing the Button "Remove"` |
| `Scope` | `Within the Dialog` |
| `Matcher` | `Checked` |
| `Check` | `See the Button "Save"` |

A step must use everything it makes. Only a check can be left over.

```gherkin
# Fine
Then I should See the Heading "Welcome back"
Then the Checkbox "Terms" should be Checked

# Errors: nothing uses the button
When the Button "Add"
When I click the Button "Add"
```

## Defines

```gherkin
Define: Add Text (Item)
  Fill the Field "Item" with Item
  Click the Button "Add"

Feature: The grocery list

  Scenario: Adding things
    When I Add "Milk" to the list
    Then I should See the Cell "Milk"
```

- `Text (Item)` takes text, called `Item` in the body. Plain `Text` is called `Text`.
- Arguments can be `Text`, `Number`, `Element`, `Table`, `Any` or a noun.
- Two of the same type need names: `Move Element (Source) to Element (Target)`.
- The body is steps without `Given`, `When` or `Then`.
- Defines go above `Feature:`, or in a file without one.
- Types are inferred from the body, so `When I Add the Button "Milk"` is an error.

## Nouns

A Define that leaves one value is a noun. Its name is a type.

```gherkin
Define: Cart
  the Region "Shopping cart"

Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart
```

```gherkin
# Fine
When I Add "Milk" to the Cart
When I Click the Cart

# Error: Add takes a Cart
When I Add "Milk" to the Region "Shopping cart"
```

## Overloads

```gherkin
Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart

Define: Add Text (Email) to Settings
  Fill Email into the Field "Email" Within Settings
```

When several fit, the one taking more arguments wins, then the one with narrower types (Cart
over Element, anything over `Any`). Defines that always both fit are an error.

## Where Defines work

Everywhere under the same `gpp.config.ts`: `.gpp` files, Markdown and templates. A
directory with its own `gpp.config.ts` is a separate project.

## Backend words

| Backend | Adds |
| --- | --- |
| Playwright | `Visit`, `Reload`, `Back`, `At`, `Titled` |
| Testing Library | `Render` |
| Storybook | nothing |

A Define that uses one only works in that backend's files.
