import { useWords } from '@spp-lang/storybook'
import type { Preview } from '@storybook/html-vite'

// Defines every spp template can use.
useWords(import.meta.glob<string>('../words/*.spp', { query: '?raw', import: 'default', eager: true }))

export default {} satisfies Preview
