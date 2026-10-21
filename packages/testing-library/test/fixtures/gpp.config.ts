import { testingLibrary } from '@gpp-lang/testing-library/config'
import { defineConfig } from 'gpp-lang'

export default defineConfig({ backends: [testingLibrary()] })
