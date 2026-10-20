import type { StorybookConfig } from '@storybook/html-vite'

export default {
  framework: '@storybook/html-vite',
  stories: ['../stories/*.stories.ts'],
  addons: ['@storybook/addon-vitest', '@gpp-lang/storybook'],
  core: { disableTelemetry: true },
} satisfies StorybookConfig
