import type { StorybookConfig } from '@storybook/html-vite'
import { sppStories } from '../../../src/index.ts'
import spp from '../spp.config.ts'

export default {
  ...sppStories(spp),
  framework: '@storybook/html-vite',
  stories: ['../*.stories.ts'],
  addons: ['@storybook/addon-vitest'],
  core: { disableTelemetry: true },
} satisfies StorybookConfig
