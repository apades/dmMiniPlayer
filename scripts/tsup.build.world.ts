import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
import { omit } from '@root/utils'
import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { pr } from './utils.mjs'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  entry: {
    world: pr('../src/contents/world.build.ts'),
  },
  treeshake: true,
  minify: true,
  sourcemap: false,
  splitting: false,
  clean: false,
  define: {
    ...shareConfig.define,
    ...getDefinesObject('prod'),
  },
})
