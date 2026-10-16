import playwright from '@spp-lang/playwright'
import { defineConfig } from 'spp-lang'

export default defineConfig({ backends: [playwright()] })
