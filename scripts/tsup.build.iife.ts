import { omit } from '@root/utils'
import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { getDefinesConfig, pr } from './utils.mjs'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  entry: {
    world: pr('../src/contents/world.build.ts'),
    'world-pip': pr('../src/contents/world-pip.build.ts'),
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
    ...getDefinesConfig('prod'),
  },
})
