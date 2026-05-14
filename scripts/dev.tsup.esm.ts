import path from 'path'
import { defineConfig } from 'tsup'
import fs from 'fs-extra'
import { arrayInsert, isArray, omit, tryCatch } from '@root/utils'
import { manifest, outDir, shareConfig } from './shared.tsup'
import { getPackageRoot, pr } from './utils.mjs'
import { isDev } from './shared'
import { outputListener } from './plugin/outputListener'

export default defineConfig({
  ...omit(shareConfig, ['onSuccess']),
  esbuildPlugins: [...shareConfig.esbuildPlugins, outputListener()],
  async onSuccess() {
    fs.copySync(
      pr('../node_modules/@apad/setting-panel/lib/index.css'),
      pr(outDir, './setting-panel.css'),
    )
    // resolve @dmMiniPlayer/adapter
    const adapterRoot = getPackageRoot('@dmMiniPlayer/adapter')
    fs.copySync(path.resolve(adapterRoot, 'dist'), pr(outDir, './adapter'))
    const [err] = tryCatch(() => {
      const config = fs.readJSONSync(
        path.resolve(adapterRoot, 'dist/config.json'),
      )
      manifest.content_scripts = arrayInsert(
        manifest.content_scripts ?? [],
        manifest.content_scripts?.findIndex(
          (s) => s.js?.[0] === 'entry-all-frames.js',
        ) || 0,
        Object.entries(config).map(([key, c]: [string, any]) => ({
          js: [`adapter/${key}.js`],
          matches: isArray(c.match) ? c.match : [c.match],
          run_at: 'document_start',
          all_frames: true,
        })),
      )
    })
    if (err) {
      console.warn('没有找到 adapter/dist 前置配置json')
      console.log(err)
    }

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
