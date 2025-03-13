import { defineConfig } from 'tsup'
import { omit } from '@root/utils'
import { shareConfig } from './tsup.shared'
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
