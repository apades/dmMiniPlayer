import path from 'path'
import { ADAPTER_CONFIG_GLOBAL_NAME } from '@root/shared/config'
import { defineConfig } from 'tsup'

const pr = (...args: string[]) => path.resolve(process.cwd(), ...args)

export const getConfig = (
  config: Partial<{ isDev: boolean; isOfficial: boolean }> = {},
) =>
  ({
    esbuildOptions(options) {
      options.alias ??= {}
      options.charset = 'utf8'
      // IIFE global is `__toCommonJS` shape `{ default, __esModule }`; expose the default export on `window[name]`.
      const unwrapDefault = `;${ADAPTER_CONFIG_GLOBAL_NAME}=${ADAPTER_CONFIG_GLOBAL_NAME}.default??${ADAPTER_CONFIG_GLOBAL_NAME};`
      const prev = options.footer as
        | string
        | { js?: string; [k: string]: string | undefined }
        | undefined
      const prevJs = typeof prev === 'string' ? prev : (prev?.js ?? '')
      const rest = typeof prev === 'object' && prev ? prev : {}
      options.footer = { ...rest, js: prevJs + unwrapDefault }
    },
    outExtension({ format }) {
      return {
        js: `.js`,
      }
    },
    format: 'iife',
    globalName: ADAPTER_CONFIG_GLOBAL_NAME,
    clean: false,
    shims: true,
    target: 'esnext',
    sourcemap: config.isDev ? 'inline' : false,
    minify: !config.isDev,
    noExternal: [/(.*)/],
    watch: config.isDev,
    define: {
      'process.env.NODE_ENV': process.env.NODE_ENV
        ? `"${process.env.NODE_ENV}"`
        : '"development"',
    },
    platform: 'browser',
  }) satisfies Parameters<typeof defineConfig>[0]
