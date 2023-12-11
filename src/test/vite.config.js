import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
import fs from 'fs'

function plasmoUrlReplace() {
  const virtualModuleId = /import (.*?) from "url\:(.*)"/g

  return {
    name: 'plasmo url replace', // required, will show up in warnings and errors
    transform(text = '', id) {
      let matches = [...text.matchAll(virtualModuleId)]
      for (let match of matches) {
        text = text.replace(
          match[0],
          `import ${match[1]} from "${match[2]}?url"`
        )
      }
      return text
    },
  }
}

function plasmoDataTextReplace() {
  const virtualModuleId = /import (.*?) from "data\-text\:(.*)"/g

  return {
    name: 'plasmo data text replace', // required, will show up in warnings and errors
    transform(text = '', id) {
      let matches = [...text.matchAll(virtualModuleId)]
      for (let match of matches) {
        text = text.replace(
          match[0],
          `import ${match[1]} from "${match[2]}?raw"`
        )
      }
      return text
    },
  }
}

const pr = (...p) => path.resolve(__dirname, ...p)
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    plasmoUrlReplace(),
    plasmoDataTextReplace(),
    react({
      babel: {
        plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@root': pr('../'),
      'webextension-polyfill': pr('./polyfill/browser/index.ts'),
    },
  },
  define: {
    ...getDefinesObject('dev'),
  },
  server: {
    https: {
      key: fs.readFileSync(pr('../../localhost-key.pem')),
      cert: fs.readFileSync(pr('../../localhost.pem')),
    },
  },
})
