import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root,
  base: process.env.BASE_PATH || './',
  resolve: {
    alias: {
      '@apad/element-picker': resolve(root, '../src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
