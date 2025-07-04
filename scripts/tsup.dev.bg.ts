import { defineConfig } from 'tsup'
import fs from 'fs-extra'
import { omit } from '@root/utils'
import { manifest, outDir, shareConfig } from './tsup.shared'
import { pr } from './utils.mjs'
import { isDev } from './shared'
import { outputListener } from './plugin/outputListener'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  esbuildPlugins: [...shareConfig.esbuildPlugins, outputListener()],
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

    manifest.permissions?.push('scripting')
    fs.writeJSONSync(pr(outDir, './manifest.json'), manifest, { spaces: 2 })
  },
  entry: {
    background: shareConfig.entry.background,
    css: shareConfig.entry.css,
    inject: shareConfig.entry.inject,
    'inject-pip': shareConfig.entry['inject-pip'],
    'before-init-main': pr('../src/contents/before-init-main.ts'),
    world: pr('../src/contents/world.dev.ts'),
    'world-pip': pr('../src/contents/world-pip.dev.ts'),
    popup: shareConfig.entry.popup,
  },
  treeshake: false,
  minify: false,
  watch: true,
  sourcemap: 'inline',
  splitting: false,
  clean: false,
})
