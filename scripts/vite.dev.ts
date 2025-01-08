import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getChangeLog, pr } from './utils.mjs'
import { manifest } from '../src/manifest'
import fs from 'fs-extra'
import fs2 from 'fs/promises'
import path from 'path'

import packageJson from '../package.json'
import { DEV_PORT } from '../src/shared/constants'

export const outDir = pr('../dist')
const version = packageJson.version

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'onSuccess',
      configResolved() {
        const locales = fs.readdirSync(pr('../src/locales-ext'))
        locales.forEach((locale) => {
          if (locale === '.translated.json') return
          fs.copySync(
            pr('../src/locales-ext', locale),
            pr(
              outDir,
              `./_locales/${locale.replace('.json', '')}/messages.json`,
            ),
          )
        })
        fs.copySync(pr('../assets'), pr(outDir, './assets'))

        fs.readdirSync(pr('../src/entry')).forEach((file) => {
          fs.copySync(pr('../src/entry', file), pr(outDir, file))
        })

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

        const popupHtmlFile = pr('../src/popup/index.html')
        const popupHtmlText = fs
          .readFileSync(popupHtmlFile, 'utf-8')
          .replace(
            '<script src="./index.tsx" type="module"></script>',
            '<script src="./popup.js" type="module"></script>',
          )
        fs.writeFileSync(pr(outDir, './popup.html'), popupHtmlText, 'utf-8')
      },
    },
  ],
  resolve: {
    alias: {
      '@root': pr('../src'),
      '@pkgs': pr('../packages'),
    },
  },
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV
      ? `"${process.env.NODE_ENV}"`
      : '"development"',
    'process.env.upgrade_en': `"${getChangeLog(version)?.replaceAll('\n', '\\n')}"`,
    'process.env.upgrade_zh': `"${getChangeLog(version, 'zh')?.replaceAll(
      '\n',
      '\\n',
    )}"`,
    'process.env.version': `"${version}"`,
  },
  server: {
    port: DEV_PORT,
  },
  build: {
    write: true,
    outDir,
  },
})
