# To do

Things that came up while building Spec++ and haven't been done.

## Planned

- [ ] **Storybook.** Test stories with Spec++: a `Story` word first, then Spec++ as a story's
      `play` function, Spec++'s first non-Playwright backend.
- [ ] **Enforce Given / When / Then.** Agreed: Given may take shortcuts, like setup words and
      API calls. When may only do what a user does. Then may only check what a user can see,
      except words marked as side-effect checks (an email was sent). Needs words to say which
      kind they are.

## Decided against

- **Loops over what's on the page,** like Cypress's `.each()`, Robot Framework's `FOR` or
  testRigor's `until`. How often they run depends on the page, so a spec wouldn't do the
  same thing every run, and a loop over nothing passes. Lists are checked whole instead,
  with `Each`, `No`, `Count` and `Read` with a table, which retry and fail loudly.
- **Unit tests of business logic,** say through a Vitest backend with words like `Equal` and
  words written in JavaScript. A spec is written in the words of whoever uses what it tests,
  and a library's users write code, so code is its best spec. JavaScript words that call an
  app's functions would be step definitions under another name. Business rules are tested
  through the product, with a Scenario Outline's table of examples, and made quick with
  Given shortcuts rather than by testing lower down.

## Other interfaces

Interfaces with users of their own, and their own words, are where Spec++ could grow
instead. They also reach apps in any language, as the browser already does, without
porting Spec++.

- [ ] **Mobile apps.** Their users tap buttons and read headings too, so the shared words
      fit as they are, given a driver that finds things by role and accessible name. Which
      driver is undecided.
- [ ] **Command lines:** running a command and seeing its output.
- [ ] **HTTP APIs,** at the level of requests and responses; see `Get` and `Post` below.

## The language

- [ ] **An escape hatch for words written in JavaScript.** Agreed shape: you can add words but
      never match sentences. So a `words.js`-style file of words with declared forms, the same
      `form()` the builtins use, so the checker still works. Its words are for Given
      shortcuts and things a user would recognise, not for calling an app's code to test it
      (see Decided against).
- [ ] **A wider standard vocabulary** for the usual reasons to reach for JavaScript:
  - [ ] requests: `Post` and `Get`, through Playwright's API client
  - [ ] mocking routes: `Mock`, through `page.route`
  - [ ] the clock
  - [ ] file upload
  - [ ] cookies and saved sign-in state
- [ ] **Nouns for people and things (`Admin`).** Discussed:
  - [ ] a noun leaves a value, like a persona, for a verb to use
  - [ ] within a scenario, a noun means the same one each time ("an Admin … the Admin");
        `Another Admin` for a second
  - [ ] choose a default kind: fixed data, a factory, or a saved session (leaning factory)
  - [ ] the convention of `Signed-in` for the shortcut state versus `Sign-in` for the real action
- [ ] **Reading fields from values,** like `the Email of the Admin`, and how field names avoid
      clashing with other words.
- [ ] **Match only the text a screen reader reads.** Playwright's text matching (`hasText`,
      `getByText`, `toContainText`, `toHaveText`) matches hidden text, even `aria-hidden` and
      `display: none`, so `Containing` on a role with no name, `Contain`, `Read` and
      `See "some text"` can pass on text nobody hears; checked on 1.63. Its aria snapshots
      leave that text out, so a selector engine following their rules could fix it
      everywhere at once.
- [ ] **Plurals.** `Count 3 Row` and `Each Checkbox` read well enough, but `Count 3 Rows` is
      an unknown word. TodoMVC defines `Todos` as a word of its own. Looking a plural up as
      its singular would do, if it doesn't make mistakes harder to see.
- [ ] **A role with nothing after it can take the verb's text as its name.**
      `Fill the Textbox with "hi"` finds the textbox named "hi", and then says
      "Fill expected some text, but there was nothing left", which doesn't say why.
- [ ] **Testing Library's `ByDisplayValue` is missing.**
- [ ] **Friction in prose.**
  - [ ] Numbers in prose ("3 items") are code.
  - [ ] Punctuation like `$`, `%` or `&` is an error.
  - [ ] Stray capitals like "OK" are unknown words.
  - [ ] Decide how forgiving to be.
- [ ] **The trailing-adjective rule needs a better error.** "Given an Admin is Signed-in"
      can't work, since verbs lead and nouns follow. Today it says "Signed-in expected an
      Admin, but there was nothing left", which is true but doesn't say why: that Signed-in
      runs first, before the Admin exists, so it belongs in front of it.

## Checking and errors

- [ ] **A failed check points at the step's start, not the word.** It should point at `See`,
      `Checked` and so on. Expectations would need to remember where they came from.
- [ ] **Only the first mistake in each scenario is reported,** so fixing one reveals the next.
      Consider carrying on after a mistake where the stack is still meaningful.
- [ ] **A kind in a `Define`'s header is treated as a use of that word** by hover and find
      references: hovering `Text` in `Define: Add Text (Item)` shows the `Text` query.

## Running

- [ ] **The whole project is loaded and checked** each time Playwright loads its config, to
      generate the tests, and again in each worker, so `Define`s from any file are there.
      Think about the cost in large repos.
- [ ] **A new scenario may not show up in an editor until it reloads the config.** The
      generated tests are written when Playwright loads its config. Playwright's VS Code
      extension and UI mode reload it when test files change, but a `.spp` file isn't one
      to them. Untested: try adding a scenario with each open.
- [ ] **Playwright's VS Code extension finds the `.spp` file through a `.map` file** beside
      each generated test, which it reads itself (checked with 1.1.19). That's its own
      detail, not an API, so it wants a test: `editors/vscode` could run the extension on a
      scenario, as was done by hand.
- [ ] **`@playwright/test` is a peer dependency at `^1.63.0`,** the only version tried. Find
      the oldest that works (`test.step`'s `location` is the likely floor) and widen it.
- [ ] **`defineSppConfig` reads which file called it from the stack,** for the directory
      its paths are relative to. Called from a helper in another file, it needs `root`.
- [ ] **`words` in `defineSppConfig`** for the JavaScript escape hatch, once there is one.

## Editors

- [ ] **The Neovim setup in the README is untested.**
- [ ] **The language server rescans the workspace** on every open and save. That's fine now;
      in a large repo it wants a watcher-based cache.
- [ ] **A `Define`'s comment isn't shown** in the dictionary or on hover, as a built-in word's
      doc is.

## Markdown

Open questions about ` ```spp ` blocks in Markdown files.

- [ ] **GitHub won't colour ` ```spp ` blocks** until Spec++ is in linguist's languages. That's
      why Spec++'s own README uses ` ```gherkin ` blocks, on purpose, though it means its
      examples aren't tested.
- [ ] **The VS Code grammar injection is untested.** The integration test covers checking
      Markdown, not how its blocks are highlighted.
- [ ] **Run buttons in Markdown are untested.** Playwright's VS Code extension put run and
      debug buttons beside scenarios in a `.spp` file when tried by hand. A Markdown file's
      generated test maps back to it the same way, but nobody has tried it.
- [ ] **Every Markdown file is read** to see whether it has an ` ```spp ` block, on every
      rescan. Fine now; see the notes on large repos above.
- [ ] **The extension doesn't start for a project with only Markdown:** it starts on a
      `.spp` file.
