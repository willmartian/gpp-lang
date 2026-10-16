import { sppStories } from '@spp-lang/storybook'
import type { StorybookConfig } from '@storybook/html-vite'
import spp from '../spp.config.ts'

export default {
  ...sppStories(spp),
  framework: '@storybook/html-vite',
  stories: ['../stories/*.stories.ts'],
  addons: ['@storybook/addon-vitest'],
  core: { disableTelemetry: true },
} satisfies StorybookConfig
