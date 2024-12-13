/**
 * 参考自 {@link https://github.com/claviska/esbuild-plugin-inline-import}
 */
import { EsbuildPlugin } from './types'
import path from 'path'
import fs from 'fs/promises'
import less from 'less'
import loadConfig, { type Result } from 'postcss-load-config'
import postcss from 'postcss'
import { isDev } from '../shared'
import { transform } from 'esbuild'

type Props = {}
export const inlineImport = (props: Props): EsbuildPlugin => {
  const filter = /\?inline$/,
    namespace = '_' + Math.random().toString(36).substr(2, 9)

  return {
    name: 'inline-import',
    setup(build) {
      let configCache: Result
      const getPostcssConfig = async () => {
        if (configCache) {
          return configCache
        }

        try {
          const result = await loadConfig({}, process.cwd())
          configCache = result
          return result
        } catch (error: any) {
          if (error.message.includes('No PostCSS Config found in')) {
            const result = { plugins: [] as any[], options: {} }
            return result
          }
          throw error
        }
      }

      // debugger
      const alias = Object.entries(build.initialOptions.alias ?? {}) as [
        `${string}`,
        `${string}`,
      ][]
      build.onResolve({ filter }, async (args) => {
        // 处理alias
        const inputPath = alias.reduce((inputPath, [key, val]) => {
          if (!inputPath.includes(key)) return inputPath
          return path.resolve(val, inputPath.replace(key, '.'))
        }, args.path)
        // debugger
        let filePath = path.resolve(args.resolveDir, inputPath)
        try {
          await fs.access(filePath)
        } catch {
          filePath = path.resolve(
            args.resolveDir,
            inputPath.replace(filter, ''),
          )
        }

        return {
          path: filePath + '?inline',
          namespace,
        }
      })

      build.onLoad({ filter }, async (args) => {
        const inputPath = args.path.replace('?inline', '')
        // debugger
        let contents = await fs.readFile(inputPath, 'utf8')

        // 转换less
        if (inputPath.endsWith('.less')) {
          contents = await less
            .render(contents, {
              filename: path.resolve(inputPath),
            })
            .then((res) => res.css)
        }

        // postcss处理
        // 参考自 {@link https://github.com/egoist/tsup/blob/796fc5030f68f929fecde7c94732e9a586ba7508/src/esbuild/postcss.ts}
        if (inputPath.endsWith('.css') || inputPath.endsWith('.less')) {
          const { plugins, options } = await getPostcssConfig()

          if (plugins && plugins.length > 0) {
            const result = await postcss
              ?.default(plugins)
              .process(contents, { ...options, from: args.path })

            contents = result.css
          }
        }

        if (!isDev) {
          contents = (
            await transform(contents, {
              minify: true,
              minifyIdentifiers: true,
              minifySyntax: true,
              minifyWhitespace: true,
              logLevel: 'silent',
              loader: 'css',
            })
          ).code
        }

        return {
          contents,
          watchFiles: [inputPath],
          loader: 'text',
        }
      })
    },
  }
}
