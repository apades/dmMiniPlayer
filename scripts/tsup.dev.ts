import { defineConfig } from 'tsup'
import { shareConfig } from './tsup.shared'
import { pr } from './utils.mjs'

export default defineConfig({
  ...shareConfig,
  entry: {
    ...shareConfig.entry,
    world: pr('../src/contents/world.dev.ts'),
  },
  treeshake: false,
  minify: false,
  watch: true,
  sourcemap: 'inline',
  splitting: false,
  clean: false,
})
