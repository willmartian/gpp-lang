import { playwright } from '@gpp-lang/playwright/config'
import { defineConfig } from 'gpp-lang'

export default defineConfig({ backends: [playwright()] })
