import { defineConfig } from 'tsup'
import path from 'path'
import { inlineImport } from './plugin/inlineImport'
import fs from 'fs-extra'
import { manifest } from '../src/manifest'
import esbuildMetaUrl from '@chialab/esbuild-plugin-meta-url'

export const pr = (...p: any) => path.resolve(__dirname, ...p)

export const tsconfig = pr('../tsconfig.json')
export const outDir = pr('../dist')

export const shareConfig: Parameters<typeof defineConfig>[0] = {
  esbuildPlugins: [inlineImport({}), esbuildMetaUrl({})],
  esbuildOptions(options, ctx) {
    options.alias ??= {}
    Object.assign(options.alias, {
      '@root': pr('../src'),
    })
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
    world: pr('../src/contents/inject.ts'),
    // 修改cs的clog脚本
    clogInject: pr('../src/contents/clogInject.ts'),
    // 视频浮动按钮的cs
    floatButton: pr('../src/contents/floatButton.ts'),
    // popup的脚本
    popup: pr('../src/popup/index.tsx'),
    options: pr('../src/options/index.tsx'),
  },
  noExternal: [/(.*)/],
  async onSuccess() {
    fs.copySync(pr('../locales'), pr(outDir, './_locales'))
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

    const htmlPages = ['popup', 'options']
    for (const page of htmlPages) {
      const htmlFile = pr(`../src/${page}/index.html`)
      const htmlText = fs.readFileSync(htmlFile, 'utf-8').replace(
        '<script src="./index.tsx" type="module"></script>',
        `<script src="./${page}.js" type="module"></script>`
      )
      fs.writeFileSync(pr(outDir, `./${page}.html`), htmlText, 'utf-8')
    }
  },
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV
      ? `"${process.env.NODE_ENV}"`
      : '"development"',
  },
  platform: 'browser',
}

export { manifest }
