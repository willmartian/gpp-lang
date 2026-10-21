// Testing Library as a backend in gpp.config.ts, and the word it adds to the
// shared ones: Render, which renders what a template's ${…} holds. Its
// templates are Features, a test each Scenario.
//
//     // gpp.config.ts
//     import { defineConfig } from 'gpp-lang'
//     import { testingLibrary } from '@gpp-lang/testing-library/config'
//
//     export default defineConfig({ backends: [testingLibrary()] })
//
// Only this is loaded by the tools, so it imports nothing of Testing Library's.

import type { Backend, Context, Env } from '@gpp-lang/core'
import { formsFor, Interpolated, type, Env as Words, words } from '@gpp-lang/core'

export interface TestingLibraryOptions {
  // The test files it runs, as globs from the config's directory. By default,
  // every *.test.* and *.spec.* file.
  files?: string[]
}

export function testingLibrary({ files = ['**/*.test.*', '**/*.spec.*'] }: TestingLibraryOptions = {}): Backend {
  return {
    name: 'Testing Library',
    files,
    words: testingLibraryWords(),
    templates: 'features',
    interpolation: ComponentType,
  }
}

// What a template's ${…} holds: whatever the renderer takes, like a React element.
export const ComponentType = type(
  'Component',
  `a component, as \${…}`,
  (v): v is Interpolated => v instanceof Interpolated,
)

// What Render runs with: the renderer from renderWith (driver.ts).
export interface RenderContext extends Context {
  render(ui: unknown): Promise<void>
}

let vocabulary: Env | undefined

// The shared words, and Render.
export function testingLibraryWords(): Env {
  const form = formsFor<RenderContext>()
  vocabulary ??= new Words(words())
    .word(
      'Render',
      form([ComponentType], (ctx, component) => ctx.render(component.value)),
    )
    .doc(
      {
        group: 'Doing',
        summary: `Renders what the test's gpp template has in a \${…}, like a React element.`,
        examples: [`Given I Render \${<Editor title="" />}`],
      },
      'Render',
    )
  return vocabulary
}
