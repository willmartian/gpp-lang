# Markdown

` ```spp ` blocks in Markdown files run as tests, like Rust's doctests, so your docs' examples
stay true. See [`examples/demo/features/README.md`](../examples/demo/features/README.md).

| Block | Is |
| --- | --- |
| starts with `Feature:` | a new Feature |
| starts with `Scenario:` or a step | more of the Feature above it |
| anything else | Defines, which every file can use |
| ` ```spp ignore ` | shown, never run |

````markdown
Signing in takes an email and a password.

```spp
Feature: Signing in

  Scenario: The right password
    Given I Visit "/"
```

With the wrong password, you stay where you are:

```spp
  Scenario: The wrong password
    Given I Visit "/"
```
````

- Only Markdown files with a ` ```spp ` block are part of the project.
- `spp-lang test README.md:12` runs the scenario on line 12.
- Mistakes point at lines in the Markdown file.
