import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
import { pr } from './utils.mjs'
import { omit } from '@root/utils'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  entry: {
    background: shareConfig.entry.background,
  },
  treeshake: false,
  minify: false,
  watch: true,
  sourcemap: 'inline',
  splitting: false,
  clean: false,
})
