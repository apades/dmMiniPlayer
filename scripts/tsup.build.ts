import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'

export default defineConfig({
  ...shareConfig,
  treeshake: true,
  minify: true,
  sourcemap: false,
  define: {
    ...shareConfig.define,
    ...getDefinesObject('prod'),
  },
})
