import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react-swc'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
import { plasmoDataTextReplace, plasmoUrlReplace } from './src/utils/vite'
import path from 'path'

const pr = (...p: string[]) => path.resolve(__dirname, ...p)

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: async () => {
    return {
      plugins: [react({ tsDecorators: true })],
      resolve: {
        alias: {
          '@root': pr('./src'),
        },
      },
      define: {
        ...getDefinesObject('dev'),
      },
    }
  },
  manifest: {
    host_permissions: ['<all_urls>'],
    permissions: ['storage', 'scripting'],
  },
})
