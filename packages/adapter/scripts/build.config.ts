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
    treeshake: true,
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
