import path from 'path'
import { defineConfig } from 'wxt'
import fs, { copy } from 'fs-extra'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  alias: {
    '@root': path.resolve(__dirname, '../../src'),
  },
  hooks: {
    'build:done': (wxt) => {
      console.log('build:before', wxt.config.outDir)
      fs.copySync(path.resolve('./locales'), wxt.config.outDir + '/locales')
    },
  },
  manifest: {
    web_accessible_resources: [
      {
        resources: ['**/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
})
