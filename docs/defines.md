# Your own words

A Define makes a word of your own, written in Gherkin++.

```gherkin
Define: Add Text (Item)
  Fill the Field "Item" with Item
  Click the Button "Add"

Feature: The grocery list

  Scenario: Adding things
    When I Add "Milk" to the list
    Then I should See the Cell "Milk"
```

## Syntax

| Part | Is |
| --- | --- |
| `Define:` | the word's name, then what it takes |
| `Text (Item)` | some text, called `Item` in the body |
| `Text` | some text, called `Text` in the body |
| the body | indented lines of code, without step keywords |

- A Define goes above a file's `Feature:` line, or in a file with no Feature.
- Every file in the project can use it: see [Where they work](#where-they-work).
- Lowercase words are prose here too.
- Two of the same type need names: `Define: Move Element (Source) to Element (Target)`.

## Types

A Define can take `Text`, `Number`, `Element` or `Table`, as in
[How words work](words.md#types), `Any`, which is anything, or a noun.

## Nouns

A Define that leaves one value is a noun. Its name becomes a type.

```gherkin
Define: Cart
  the Region "Shopping cart"

Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart
```

| Step | |
| --- | --- |
| `When I Add "Milk" to the Cart` | works |
| `When I Click the Cart` | works: a Cart is still an Element |
| `When I Add "Milk" to the Region "Shopping cart"` | a mistake: `Add` takes a Cart |

A noun has one Define, since its name is a type.

## Overloads

A word can have several Defines, told apart by what they take.

```gherkin
Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart

Define: Add Text (Email) to Settings
  Fill Email into the Field "Email" Within Settings
```

When more than one fits, the first of these wins:

1. the one that takes more
2. the one with narrower types: a Cart before an Element, anything before `Any`

Two Defines that could always both fit are a mistake, reported where they're defined.

## Checking

- A Define's types are inferred from its body. `Add Text (Item)` passes `Item` to `Fill`, so
  `When I Add the Button "Milk"` is a mistake.
- A Define with a mistake fails as a test of its own.

## Where they work

A project is the files under the nearest `package.json`, and every Define in it can be used by
all of its files: Features, Markdown and Storybook templates alike. A package inside another
is a project of its own, with words of its own. `gpp-lang check`, the editor and
Storybook see a project's Defines that way. Playwright uses the Defines in its config's
[`features`](playwright.md#config).
