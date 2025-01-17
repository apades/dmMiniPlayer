import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { omit } from '@root/utils'
import { getDefinesConfig } from './utils.mjs'

export default defineConfig({
  ...shareConfig,
  entry: omit(shareConfig.entry, ['inject']),
  treeshake: true,
  minify: true,
  sourcemap: false,
  define: {
    ...shareConfig.define,
    ...getDefinesConfig('prod'),
  },
})
