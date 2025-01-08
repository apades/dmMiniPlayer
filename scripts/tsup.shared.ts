import { defineConfig } from 'tsup'
import path from 'path'
import { inlineImport } from './plugin/inlineImport'
import fs from 'fs-extra'
import { manifest } from '../src/manifest'
import esbuildMetaUrl from '@chialab/esbuild-plugin-meta-url'
import { getChangeLog } from './utils.mjs'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
import packageJson from '../package.json'
import { omit } from '@root/utils'

const version = packageJson.version
export const pr = (...p: any) => path.resolve(__dirname, ...p)

export const tsconfig = pr('../tsconfig.json')
export const outDir = pr('../dist')

export const shareConfig = {
  esbuildPlugins: [inlineImport({}), (esbuildMetaUrl as any)({})],
  esbuildOptions(options, ctx) {
    options.alias ??= {}
    Object.assign(options.alias, {
      '@root': pr('../src'),
      '@pkgs': pr('../packages'),
    })
    options.charset = 'utf8'
  },
  outExtension({ format }) {
    return {
      js: `.js`,
    }
  },
  target: 'esnext',
  tsconfig,
  splitting: true,
  format: 'esm',
  clean: true,
  shims: true,
  outDir,
  entry: {
    background: pr('../src/background/index.ts'),
    // 包含player的cs
    main: pr('../src/contents/main.ts'),
    // 注入world: main的脚本
    inject: pr('../src/contents/inject.ts'),
    // 修改cs的clog脚本
    clogInject: pr('../src/contents/clogInject.ts'),
    // popup的脚本
    popup: pr('../src/popup/index.tsx'),
    css: pr('../src/style/index.ts'),
  },
  noExternal: [/(.*)/],
  async onSuccess() {
    const locales = fs.readdirSync(pr('../src/locales-ext'))
    locales.forEach((locale) => {
      if (locale === '.translated.json') return
      fs.copySync(
        pr('../src/locales-ext', locale),
        pr(outDir, `./_locales/${locale.replace('.json', '')}/messages.json`),
      )
    })
    fs.copySync(pr('../assets'), pr(outDir, './assets'))

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
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV
      ? `"${process.env.NODE_ENV}"`
      : '"development"',
    ...omit(
      getDefinesObject('dev', {
        upgrade_en: getChangeLog(version)?.replaceAll('\n', '\\n'),
        upgrade_zh: getChangeLog(version, 'zh')?.replaceAll('\n', '\\n'),
        version,
      }),
      ['____env____'],
    ),
  },
  platform: 'browser',
} satisfies Parameters<typeof defineConfig>[0]

export { manifest }
