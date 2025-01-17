import { defineConfig } from 'tsup'
import { manifest, outDir, shareConfig } from './tsup.shared'
import fs from 'fs-extra'
import { pr } from './utils.mjs'
import { omit } from '@root/utils'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  async onSuccess() {
    manifest.web_accessible_resources = [
      {
        resources: fs.readdirSync(pr(outDir)),
        matches: ['<all_urls>'],
      },
      {
        resources: ['assets/icon.png'],
        matches: ['<all_urls>'],
      },
    ]
    fs.writeJSONSync(pr(outDir, './manifest.json'), manifest, { spaces: 2 })
  },
  entry: {
    background: shareConfig.entry.background,
    css: shareConfig.entry.css,
    inject: shareConfig.entry.inject,
    'before-init-main': pr('../src/contents/before-init-main.ts'),
    world: pr('../src/contents/world.dev.ts'),
  },
  treeshake: false,
  minify: false,
  watch: true,
  sourcemap: 'inline',
  splitting: false,
  clean: false,
})
