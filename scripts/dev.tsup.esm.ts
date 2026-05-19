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
    const toInsertScripts: Required<typeof manifest>['content_scripts'] = []
    const list = fs.readdirSync(path.resolve(adapterRoot, 'dist'))
    list
      .filter((f) => f.endsWith('.json'))
      .forEach((file) => {
        const config = fs.readJSONSync(path.resolve(adapterRoot, 'dist', file))

        if (config.hasInject) {
          const injectFile = file.replace('.json', '.inject.js')
          fs.copySync(
            path.resolve(adapterRoot, 'dist', injectFile),
            pr(outDir, `./adapter/${injectFile}`),
          )
          toInsertScripts.push({
            js: [`adapter/${injectFile}`],
            matches: isArray(config.match) ? config.match : [config.match],
            run_at: 'document_start',
            all_frames: true,
            world: 'MAIN',
          })
        }

        const jsFile = file.replace('.json', '.js')
        fs.copySync(
          path.resolve(adapterRoot, 'dist', jsFile),
          pr(outDir, `./adapter/${jsFile}`),
        )
        toInsertScripts.push({
          js: [`adapter/${jsFile}`],
          matches: isArray(config.match) ? config.match : [config.match],
          run_at: 'document_start',
          all_frames: true,
        })
      })

    manifest.content_scripts = arrayInsert(
      manifest.content_scripts ?? [],
      manifest.content_scripts?.findIndex(
        (s) => s.js?.[0] === 'entry-all-frames.js',
      ) || 0,
      toInsertScripts,
    )

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
