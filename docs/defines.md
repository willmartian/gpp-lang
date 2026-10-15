# Defines

Your own words, written in Spec++.

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
- Every file in the project can use it.
- Lowercase words are prose here too.
- Two of the same kind need names: `Define: Move Element (Source) to Element (Target)`.

## Kinds

| Kind | Takes |
| --- | --- |
| `Text` | quoted text |
| `Number` | a number |
| `Element` | something on the page |
| `Table` | the step's data table |
| `Any` | anything |
| a noun, like `Cart` | that noun |

## Nouns

A Define that leaves one value is a noun. Its name becomes a kind.

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

A noun has one Define, since its name is a kind.

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
2. the one with narrower kinds: a Cart before an Element, anything before `Any`

Two Defines that could always both fit are a mistake, reported where they're defined.

## Checking

- A Define's types are inferred from its body. `Add Text (Item)` passes `Item` to `Fill`, so
  `When I Add the Button "Milk"` is a mistake.
- A Define with a mistake fails as a test of its own.
