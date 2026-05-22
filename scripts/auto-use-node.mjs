import { spawnSync } from 'child_process'
import fs from 'fs'
import { pr } from './utils.mjs'

const expectedVersion = fs.readFileSync(pr('../.nvmrc'), 'utf-8').trim()
const currentVersion = process.versions.node

if (process.platform === 'win32') {
  if (!currentVersion.startsWith(`${expectedVersion}.`)) {
    console.warn(
      `Expected Node ${expectedVersion}.x, current Node is ${currentVersion}`,
    )
  }
  process.exit(0)
}

const result = spawnSync('sh', [pr('./nvm-auto-use.sh')], {
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)
