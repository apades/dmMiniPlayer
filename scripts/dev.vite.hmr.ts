import react from '@vitejs/plugin-react'
import preact from '@preact/preset-vite'
import fs from 'fs-extra'
import { defineConfig } from 'vite'
import { manifest } from '../src/manifest'

import packageJson from '../package.json'
import { DEV_PORT } from '../src/shared/constants'
import { getChangeLog, pr } from './utils.mjs'

export const outDir = pr('../dist')
const version = packageJson.version

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    {
      name: 'onSuccess',
      configResolved(config) {
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

        console.log('tsup')
        const entryAllFramesPath = pr('../src/entry/entry-all-frames.dev')
        fs.readdirSync(entryAllFramesPath).forEach((file) => {
          fs.copySync(pr(entryAllFramesPath, file), pr(outDir, file))
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

        manifest.permissions?.push('scripting')
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
      // react: 'preact/compat',
      // 'react-dom/test-utils': 'preact/test-utils',
      // 'react-dom': 'preact/compat', // 必须放在 test-utils 下面
      // 'react/jsx-runtime': 'preact/jsx-runtime',
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
    cors: true,
  },
  legacy: {
    skipWebSocketTokenCheck: true,
  },
  build: {
    write: true,
    outDir,
  },
})
