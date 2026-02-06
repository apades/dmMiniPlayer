import { defineConfig } from 'tsup'
import fs from 'fs-extra'
import { omit } from '@root/utils'
import { manifest, outDir, shareConfig } from './shared.tsup'
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
    ...omit(shareConfig.entry, ['entry-all-frames']),
    'inject-top': pr('../src/contents/inject-top.ts'),
    'inject-all-frames-top': pr('../src/contents/inject-all-frames-top.ts'),
  },
  treeshake: false,
  minify: false,
  watch: true,
  splitting: false,
  clean: false,
})
