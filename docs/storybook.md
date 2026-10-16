# Storybook

An `spp` template is a story's [play function](https://storybook.js.org/docs/writing-stories/play-function).
The story is the scenario: its args set it up, and the template is its steps. See
[`examples/storybook`](../examples/storybook).

```ts
import { spp } from '@spp-lang/storybook/play'

export const SavingADraft: Story = {
  args: { title: '' },
  play: spp`
    When I Fill the Field "Title" with "Hello"
    And I Click the Button "Save"
    Then the Status should Read "Draft saved"
  `,
}
```

Needs Storybook 10.

```sh
npm install --save-dev spp-lang @spp-lang/storybook
```

```ts
// spp.config.ts: the project, and the backends that run it
import storybook from '@spp-lang/storybook'
import { defineConfig } from 'spp-lang'

export default defineConfig({ backends: [storybook({ files: ['src'] })] })
```

```ts
// .storybook/main.ts
import { sppStories } from '@spp-lang/storybook'
import spp from '../spp.config.ts'

export default { ...sppStories(spp), framework: '@storybook/react-vite', stories: ['../src/**/*.stories.tsx'] }
```

`storybook()` takes `files` and `ignore`, as `playwright()` does ([Running](running.md)).

- **Each line is a step**, starting with Given, When, Then, And, But or `*`. Tables and
  DocStrings go under a step, as in a Scenario. There's no `Feature:` or `Scenario:` line.
- **The Interactions panel** shows each step, with what it did under it.
- **Mistakes fail the story before anything is clicked,** with the step and a caret under the
  word.
- **There's no `${…}`.** What a spec checks is written out, so it reads as it runs. Repeat the
  text that's in the args.
- **Stories run as tests** with [Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon),
  like any other play function.

## Words

The [words](words.md) are the same, less the ones for a page: a story is one page, already open,
so there's no `Visit`, `Reload`, `Back`, `At` or `Titled`.

- **Things are looked for in the whole page,** not only the story's canvas, so a dialog in a
  portal is found as a user finds it.
- **Checks and actions retry** for as long as Testing Library's `asyncUtilTimeout`, a second
  unless you `configure` it.
- **`Fill` puts the text in at once,** as Playwright does, and `Type` types it key by key.

## Defines

[Defines](defines.md) go in the project's `.spp` files, as for any backend, and every template
can use them. `sppStories` reads them as Storybook builds, since a play function runs in a
browser, which can't, and changing one reloads the stories. A `Feature:` in one is another
backend's to run.

## Checking

`spp-lang check` checks every template under the `storybook()` backend's `files`, with the
words above and the project's Defines, and says where each mistake is in the stories file.

The [language server](editors.md) does the same as you type, and hover, completion, go to
definition and references work inside templates. VS Code's extension also highlights them as
Spec++.
