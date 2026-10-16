// The language server this extension ships with: Spec++'s own, bundled with
// both of its backends, which check a workspace that has no spp.config, or
// isn't trusted, so its config mustn't run.
import playwright from '@spp-lang/playwright'
import storybook from '@spp-lang/storybook'
import { startServer } from 'spp-lang/lsp'

startServer({ defaults: [playwright(), storybook()] })
