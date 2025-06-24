import fs2 from 'fs/promises'
import path from 'path'
import fs from 'fs-extra'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { manifest } from '../src/manifest'

import packageJson from '../package.json'
import { DEV_PORT } from '../src/shared/constants'
import { getChangeLog, pr } from './utils.mjs'

export const outDir = pr('../dist')
const version = packageJson.version

export default defineConfig({
  resolve: {
    alias: {
      '@root': pr('../src'),
      '@pkgs': pr('../packages'),
    },
  },
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV
      ? `"${process.env.NODE_ENV}"`
      : '"development"',
    'process.env.upgrade_en': `"${getChangeLog(version)?.replaceAll('\n', '\\n')}"`,
    'process.env.upgrade_zh': `"${getChangeLog(version, 'zh')?.replaceAll(
      '\n',
      '\\n',
    )}"`,
    'process.env.version': `"${version}"`,
  },
  server: {
    port: DEV_PORT + 1,
    cors: true,
  },
  build: {
    write: true,
    outDir,
  },
})
