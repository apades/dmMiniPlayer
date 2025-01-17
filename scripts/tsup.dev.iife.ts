import { omit } from '@root/utils'
import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { pr } from './utils.mjs'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  entry: {
    'before-init-main': pr('../src/contents/before-init-main.ts'),
    'entry-all-frames': pr('../src/contents/entry-all-frames.ts'),
  },
  treeshake: false,
  minify: false,
  watch: true,
  clean: false,
  format: 'iife',
  sourcemap: 'inline',
  splitting: false,
})
