import { defineConfig } from 'tsup'
import { omit } from '@root/utils'
import { shareConfig } from './shared.tsup'
import { getDefinesConfig } from './utils.mjs'

export default defineConfig({
  ...shareConfig,
  entry: omit(shareConfig.entry, [
    'entry-inject-all-frames-top',
    'entry-inject-top',
    'entry-all-frames',
    'entry-init-ext-config',
  ]),
  treeshake: true,
  splitting: true,
  format: 'esm',
})
