import path from 'node:path'
import type { StorybookConfig } from '@storybook/html-vite'

export default {
  framework: '@storybook/html-vite',
  stories: ['../*.stories.ts'],
  /** This package's own addon, from its source. */
  addons: ['@storybook/addon-vitest', path.join(import.meta.dirname, '../../../src/preset.ts')],
  core: { disableTelemetry: true },
} satisfies StorybookConfig
