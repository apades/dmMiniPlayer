import { defineConfig } from 'tsup'
import { inlineImport } from '../../scripts/plugin/inlineImport'
import { yamlLoader } from '../../scripts/plugin/yamlLoader'

export default defineConfig({
  esbuildPlugins: [inlineImport({}), yamlLoader()],
  esbuildOptions(options, ctx) {
    options.charset = 'utf8'
    options.loader ??= {}

    options.loader = {
      ...options.loader,
      '.yml': 'text',
    }
  },
  treeshake: true,
})
