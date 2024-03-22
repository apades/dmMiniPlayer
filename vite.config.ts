import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'
import packageData from './package.json'
import fs from 'fs'
import { plasmoDataTextReplace, plasmoUrlReplace } from './src/utils/vite'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'

const pr = (...p) => path.resolve(__dirname, ...p)

export default defineConfig({
  plugins: [
    plasmoDataTextReplace(),
    plasmoUrlReplace(),
    react(),
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
  optimizeDeps: {
    include: ['lib'],
  },
  build: {
    commonjsOptions: {
      include: [/lib/, /node_modules/],
    },
  },
})
