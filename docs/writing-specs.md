# Writing specs

```gherkin
When I Click the Button "Remove" Within the Row Containing "Kale"
```

Capitalised words are code and run right to left: find the row, find the button in it, click
it. Lowercase words are ignored. [All words](built-in-words.md).

## Types

```
Button : Text | Pattern, Scope -> Element
```

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
```

Defines go above `Feature:`, and work in every file under the same `gpp.config.ts`.

## Nouns

A Define that leaves one value is a type.

```gherkin
Define: Cart
  the Region "Shopping cart"

Define: Add Text (Item) to Cart
  Fill Item into the Field "Item" Within Cart
```

```gherkin
# Fine
When I Add "Milk" to the Cart

# Error: Add takes a Cart
When I Add "Milk" to the Region "Shopping cart"
```
