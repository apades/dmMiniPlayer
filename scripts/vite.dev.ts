import fs2 from 'fs/promises'
import path from 'path'
import fs from 'fs-extra'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { manifest } from '../src/manifest'

import packageJson from '../package.json'
import { DEV_PORT } from '../src/shared/constants'
import { getChangeLog, pr } from './utils.mjs'

export const outDir = pr('../dist')
const version = packageJson.version

function handleDefineValue(value: any): string {
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function serializeDefine(define: Record<string, any>): string {
  let res = `{`
  const keys = Object.keys(define).sort()
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const val = define[key]
    res += `${JSON.stringify(key)}: ${handleDefineValue(val)}`
    if (i !== keys.length - 1) {
      res += `, `
    }
  }
  return res + `}`
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'onSuccess',
      config(config, env) {
        // 处理自定义的 @vite/client 通信脚本
        const fileContent = fs.readFileSync(
          pr('../src/core/vite.client.js'),
          'utf-8',
        )
        const newFileContent = fileContent.replace(
          '__DEFINES__',
          serializeDefine(config.define!),
        )

        const newFileSrc = pr('../src/entry/vite.client.dev.js')

        fs.outputFileSync(newFileSrc, newFileContent, 'utf-8')

        config.resolve ??= {}
        config.resolve.alias ??= {}
        config.resolve.alias = {
          ...config.resolve.alias,
          '@vite/client': newFileSrc,
          '/@vite/client': newFileSrc,
        }

        return config
      },
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
