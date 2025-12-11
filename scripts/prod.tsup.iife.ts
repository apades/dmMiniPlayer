import { omit, pick } from '@root/utils'
import { defineConfig } from 'tsup'
import { shareConfig } from './shared.tsup'
import { getDefinesConfig, pr } from './utils.mjs'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  entry: pick(shareConfig.entry, [
    'entry-inject-all-frames-top',
    'entry-inject-top',
    'entry-all-frames',
    'entry-init-ext-config',
  ]),
  treeshake: true,
  splitting: false,
  clean: false,
  format: 'iife',
})
