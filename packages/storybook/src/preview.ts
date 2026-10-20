// A preview entry the addon adds: the project's Defines, as its Vite plugin
// read them, for every template.

import sources from 'virtual:spp-lang/defines'
import { useWords } from './play.ts'

useWords(sources)
