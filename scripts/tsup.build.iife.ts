import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
import { omit } from '@root/utils'
import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { pr } from './utils.mjs'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  entry: {
    world: pr('../src/contents/world.build.ts'),
    'before-init-main': pr('../src/contents/before-init-main.ts'),
    'entry-all-frames': pr('../src/contents/entry-all-frames.ts'),
  },
  treeshake: true,
  minify: true,
  sourcemap: false,
  splitting: false,
  clean: false,
  format: 'iife',
  define: {
    ...shareConfig.define,
    ...getDefinesObject('prod'),
  },
})
