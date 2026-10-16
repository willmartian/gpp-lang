// The language server this extension ships with: Spec++'s own, bundled with
// both backends' words, so it checks every kind of file with nothing installed.
import { words as pages } from '@spp-lang/playwright/vocabulary'
import { words as templates } from '@spp-lang/storybook/vocabulary'
import { startServer } from 'spp-lang/lsp'

startServer({ backends: { pages: pages(), templates: templates() } })
