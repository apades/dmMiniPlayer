import { defineConfig, normalizePath } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@apad/vite-plugin'
import path from 'path'
import packageData from './package.json'
import fs from 'fs-extra'
import { plasmoDataTextReplace, plasmoUrlReplace } from './src/utils/vite'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'

const pr = (...p) => path.resolve(__dirname, ...p)

const outDir = pr('./dist')

fs.copySync(pr('./locales'), pr(outDir, './_locales'))

export default defineConfig({
  plugins: [
    plasmoDataTextReplace(),
    plasmoUrlReplace(),
    react({
      tsDecorators: true,
    }),
    crx({ manifest: packageData.manifest }),
  ],
  resolve: {
    alias: {
      '@root': pr('./src'),
    },
  },
  define: {
    ...getDefinesObject('dev'),
  },
})
