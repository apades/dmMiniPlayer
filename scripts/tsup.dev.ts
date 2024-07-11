import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'

export default defineConfig({
  ...shareConfig,
  treeshake: false,
  minify: false,
  watch: true,
  sourcemap: 'inline',
  define: {
    ...(shareConfig as any).define,
    ...getDefinesObject('dev'),
  },
})
