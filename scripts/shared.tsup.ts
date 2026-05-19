import path from 'path'
import { defineConfig } from 'tsup'
import fs from 'fs-extra'
import esbuildMetaUrl from '@chialab/esbuild-plugin-meta-url'
import { arrayInsert, isArray } from '@root/utils'
import { manifest } from '../src/manifest'
import packageJson from '../package.json'
import { getChangeLog, getDefinesConfig, getPackageRoot, pr } from './utils.mjs'
import { inlineImport } from './plugin/inlineImport'
import { isDev, isTest } from './shared'

const version = packageJson.version

export const tsconfig = pr('../tsconfig.json')
export const outDir = pr('../dist')

const envFileName = isDev ? 'dev' : 'prod'

export const shareConfig = {
  esbuildPlugins: [inlineImport({}), (esbuildMetaUrl as any)({})],
  esbuildOptions(options, ctx) {
    options.alias ??= {}
    Object.assign(options.alias, {
      '@root': pr('../src'),
      '@pkgs': pr('../packages'),
      // react: 'preact/compat',
      // 'react-dom/test-utils': 'preact/test-utils',
      // 'react-dom': 'preact/compat', // 必须放在 test-utils 下面
      // 'react/jsx-runtime': 'preact/jsx-runtime',
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
  format: 'esm',
  clean: true,
  shims: true,
  // save sourcemap + source code in dev/test mode
  sourcemap: isDev || isTest ? 'inline' : false,
  minify: !isDev && !isTest,
  outDir,
  entry: {
    background: pr('../src/background/index.ts'),
    // 包含player的cs
    main: pr('../src/contents/main.ts'),
    // ---- entry -----
    'entry-inject-top': pr(`../src/entry/entry-inject-top.${envFileName}.ts`),
    'entry-inject-all-frames-top': pr(
      `../src/entry/entry-inject-all-frames-top.${envFileName}.ts`,
    ),
    'entry-all-frames': pr(`../src/entry/entry-all-frames.${envFileName}.ts`),
    'entry-init-ext-config': pr(`../src/entry/entry-init-ext-config.ts`),
    // ---- entry -----
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

    if (isDev) {
      manifest.permissions?.push('scripting')
    }
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
    ...getDefinesConfig(envFileName, {
      upgrade_en: getChangeLog(version)?.replaceAll('\n', '\\n'),
      upgrade_zh: getChangeLog(version, 'zh')?.replaceAll('\n', '\\n'),
      version,
    }),
  },
  platform: 'browser',
} satisfies Parameters<typeof defineConfig>[0]

export { manifest }
