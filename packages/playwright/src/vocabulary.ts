// The words, for spp-lang check and the language server, which check .spp files
// and Markdown with them. Nothing here needs Playwright to be installed.

import { core } from 'spp-lang'
import { browser } from './words.ts'

export const words = () => browser(core())
