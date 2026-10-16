import type { Preview } from '@storybook/html-vite'
import { useWords } from '../../../src/backends/storybook/index.ts'

// Defines every spp template can use.
useWords(import.meta.glob<string>('../words/*.spp', { query: '?raw', import: 'default', eager: true }))

export default {} satisfies Preview
